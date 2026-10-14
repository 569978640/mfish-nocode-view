import { onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import { tlaApi } from "@/api/pbi/tla";
import type { PbiPart, TlaCategory, TlaSeries } from "@/api/pbi/model";

/** 页面视图层级：系列列表 / 参数配置 / 产品家谱 */
export type ArchitectureView = "list" | "config" | "family";

/** 当前选中系列的分类信息（参数配置与家谱视图的入参） */
interface CurrentConfig {
  /** 一级分类：取二级分类的 parentDisplayName */
  firstCategory: string;
  /** 二级分类标题：取显示名 displayName */
  secondCategory: string;
  /** 产品分类：取二级分类内部名 name（接口入参 PRODUCTCLASSIFICATION） */
  productClassification: string;
}

/**
 * TLA 架构页主视图状态机：
 * 维护一级分类标签、系列卡片列表，以及"系列列表 → 参数配置 / 产品家谱 → 产品详情"三视图切换；
 * 家谱以 v-show 常驻缓存，reloadKey 令牌控制"入口点击必刷新、详情返回不重载"。
 */
export const useTlaArchitecture = () => {
  const categoryList = ref<TlaCategory[]>([]);
  const activeCategory = ref<string>("");
  const seriesList = ref<TlaSeries[]>([]);
  const currentView = ref<ArchitectureView>("list");

  const currentConfig = ref<CurrentConfig>({ firstCategory: "", secondCategory: "", productClassification: "" });

  /** 从家谱点击部件编号带入的初始详情部件：非空时参数配置视图挂载即进入该部件详情层 */
  const pendingDetailPart = ref<PbiPart | null>(null);
  /** 家谱跳转详情请求进行中标记，防止重复点击 */
  const partOpening = ref(false);
  /**
   * 家谱加载令牌：仅在系列列表点击"产品家谱"按钮时递增，家谱组件据此重新拉取；
   * 从产品详细信息页返回不递增，实现"返回不重载、入口点击必重载"。
   */
  const familyReloadKey = ref(0);

  const loadCategories = async () => {
    categoryList.value = await tlaApi.getCategoryList();
    if (categoryList.value.length > 0) {
      activeCategory.value = categoryList.value[0].id;
      loadSeries();
    }
  };

  const loadSeries = async () => {
    if (!activeCategory.value) return;
    seriesList.value = await tlaApi.getSeriesList(activeCategory.value);
  };

  const handleCategoryChange = (key: any) => {
    activeCategory.value = key;
    loadSeries();
  };

  /** 组装卡片点击所需的分类信息：一级分类取 parentDisplayName，二级分类标题取显示名 displayName，productClassification 取内部名 name */
  const buildConfig = (series: TlaSeries): CurrentConfig => ({
    firstCategory: series.parentDisplayName || series.parentName || "",
    secondCategory: series.displayName || series.name,
    productClassification: series.name
  });

  // 点击参数配置：进入参数配置视图（清空家谱跳详情带入的初始部件）
  const openConfig = (series: TlaSeries) => {
    pendingDetailPart.value = null;
    currentConfig.value = buildConfig(series);
    currentView.value = "config";
  };

  // 点击产品家谱：进入家谱树视图（清空家谱跳详情带入的初始部件）
  const openFamilyTree = (series: TlaSeries) => {
    pendingDetailPart.value = null;
    currentConfig.value = buildConfig(series);
    currentView.value = "family";
    // 递增加载令牌：无论是否同一系列，从列表入口进入家谱都重新加载；详情返回路径不经过此方法
    familyReloadKey.value++;
  };

  /**
   * 从产品家谱点击部件编号：按编号拉取该部件完整特性参数，再进入参数配置视图的详情层。
   * 特性参数展示列由一级分类决定，故携带当前系列的 firstCategory。
   */
  const openPartDetailFromFamily = async (wtPartNumber: string) => {
    if (!wtPartNumber || partOpening.value) return;
    partOpening.value = true;
    const hide = message.loading("正在打开产品详细信息...", 0);
    try {
      const part = await tlaApi.getPartDetail(currentConfig.value.firstCategory, wtPartNumber);
      if (!part) {
        message.warning("未查询到该部件的详细信息");
        return;
      }
      pendingDetailPart.value = part;
      currentView.value = "config";
    } catch (error) {
      console.error("打开产品详细信息失败", error);
    } finally {
      hide();
      partOpening.value = false;
    }
  };

  /**
   * 参数配置视图返回：若该视图由家谱点击部件编号进入（带初始详情部件），则返回家谱；否则返回系列列表。
   * 详情层内部的逐级返回（详情→列表/对比）已在 ParameterConfig 内消化，仅其最终返回到此。
   */
  const handleConfigBack = () => {
    if (pendingDetailPart.value) {
      pendingDetailPart.value = null;
      currentView.value = "family";
    } else {
      currentView.value = "list";
    }
  };

  onMounted(() => {
    loadCategories();
  });

  return {
    categoryList,
    activeCategory,
    seriesList,
    currentView,
    currentConfig,
    pendingDetailPart,
    familyReloadKey,
    handleCategoryChange,
    openConfig,
    openFamilyTree,
    openPartDetailFromFamily,
    handleConfigBack
  };
};

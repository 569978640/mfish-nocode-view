import { onMounted, ref } from "vue";
import { tlaApi } from "@/api/pbi/tla";
import type { TlaCategory, TlaSeries } from "@/api/pbi/model";
import { useTlaTabs, type TlaTabContext } from "../../tla/hooks/useTlaTabs";

/**
 * TLA-Architecture 首页主视图：
 * 仅维护一级分类标签与产品系列卡片列表，是整个 TLA 模块的固定入口标签（不可关闭）；
 * 参数配置、产品家谱、部件编号、型号对比均以独立系统标签页打开，不再在首页内切视图。
 */
export const useTlaArchitecture = () => {
  const categoryList = ref<TlaCategory[]>([]);
  const activeCategory = ref<string>("");
  const seriesList = ref<TlaSeries[]>([]);

  const { openConfigTab, openFamilyTab } = useTlaTabs();

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

  /**
   * 组装系列卡片跳转所需的二级分类上下文：
   * 一级分类取 parentDisplayName，二级分类标题取显示名 displayName，productClassification 取内部名 name。
   */
  const buildContext = (series: TlaSeries): TlaTabContext => ({
    firstCategory: series.parentDisplayName || series.parentName || "",
    secondCategory: series.displayName || series.name,
    productClassification: series.name
  });

  /** 点击参数配置：打开"参数配置"系统标签（携带二级分类上下文） */
  const openConfig = (series: TlaSeries) => {
    openConfigTab(buildContext(series));
  };

  /** 点击产品家谱：打开"产品家谱"系统标签（携带二级分类上下文） */
  const openFamilyTree = (series: TlaSeries) => {
    openFamilyTab(buildContext(series));
  };

  onMounted(() => {
    loadCategories();
  });

  return {
    categoryList,
    activeCategory,
    seriesList,
    handleCategoryChange,
    openConfig,
    openFamilyTree
  };
};

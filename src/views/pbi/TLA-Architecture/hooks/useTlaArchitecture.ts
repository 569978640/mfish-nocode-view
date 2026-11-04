import { computed, reactive, ref } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { tlaApi } from "@/api/pbi/tla";
import type { TlaCategory, TlaSeries } from "@/api/pbi/model";
import { compareSessionContext, TLA_ROUTE_NAMES, useTlaTabs, type TlaTabContext } from "../../tla/hooks/useTlaTabs";

/**
 * 模块级共享状态：TLA 首页卡片与布局级全局分类侧栏共用同一份数据，
 * 保证切换系统标签、在任意 PBI 页签操作侧栏时分类状态一致且只请求一次。
 */
const categoryList = ref<TlaCategory[]>([]);
const activeCategory = ref<string>("");
/** 一级分类 id → 二级分类（产品系列）缓存，侧栏菜单与卡片列表共用，切换分类不重复请求 */
const seriesByCategory = reactive<Record<string, TlaSeries[]>>({});
/** 一级分类 id → 二级分类加载状态，侧栏展开时用于展示加载中占位 */
const seriesLoading = reactive<Record<string, boolean>>({});
/** 侧栏展开状态（全局共享，切换页签后保持收起/展开状态） */
const menuOpen = ref(true);
/** 当前激活页签对应的二级分类内部名，用于侧栏二级菜单选中态；空串表示无二级选中 */
const activeSeriesName = ref("");

/** 分类初始化单例：首页与全局侧栏可能同时触发，保证分类与系列只加载一次 */
let initPromise: Promise<void> | null = null;

/**
 * TLA-Architecture 首页主视图：
 * 维护一级分类、各分类下的二级系列缓存与当前选中分类，是整个 TLA 模块的固定入口标签（不可关闭）；
 * 一级/二级分类通过左侧分类侧栏切换，参数配置、产品图谱、部件编号、型号对比均以独立系统标签页打开。
 */
export const useTlaArchitecture = () => {
  const { openConfigTab, openFamilyTab } = useTlaTabs();

  /** 当前一级分类下的系列卡片列表 */
  const seriesList = computed<TlaSeries[]>(() => seriesByCategory[activeCategory.value] || []);

  /** 当前一级分类显示名（顶部工具栏展示） */
  const activeCategoryName = computed(() => {
    const category = categoryList.value.find((item) => item.id === activeCategory.value);
    return category ? category.displayName || category.name : "";
  });

  /**
   * 加载指定一级分类的系列：
   * 已缓存或正在加载时直接复用，避免抽屉预加载与分类切换重复发起请求。
   */
  const loadSeries = async (categoryId: string) => {
    if (!categoryId || seriesByCategory[categoryId] || seriesLoading[categoryId]) return;
    seriesLoading[categoryId] = true;
    try {
      seriesByCategory[categoryId] = await tlaApi.getSeriesList(categoryId);
    } finally {
      seriesLoading[categoryId] = false;
    }
  };

  /** 默认一级分类：优先 ALL（接口返回顺序不保证），不存在时取第一个分类 */
  const resolveDefaultCategory = (categories: TlaCategory[]): string => {
    const allCategory = categories.find((category) =>
      [category.id, category.name, category.displayName].some((value) => value?.trim().toUpperCase() === "ALL")
    );
    return (allCategory ?? categories[0])?.id ?? "";
  };

  const loadCategories = async () => {
    categoryList.value = await tlaApi.getCategoryList();
    activeCategory.value = resolveDefaultCategory(categoryList.value);
    if (activeCategory.value) {
      await loadSeries(activeCategory.value);
    }
  };

  /** 切换一级分类：更新选中分类、清除二级选中并确保其系列卡片已加载（侧栏点击一级分类时调用） */
  const handleCategoryChange = async (categoryId: string) => {
    activeCategory.value = categoryId;
    activeSeriesName.value = "";
    await loadSeries(categoryId);
  };

  /** 预加载全部一级分类的系列，保证抽屉展开后二级菜单完整 */
  const loadAllSeries = async () => {
    await Promise.all(categoryList.value.map((category) => loadSeries(category.id)));
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

  /** 点击产品图谱：打开"产品图谱"系统标签（携带二级分类上下文） */
  const openFamilyTree = (series: TlaSeries) => {
    openFamilyTab(buildContext(series));
  };

  /**
   * 分类数据初始化（幂等）：
   * 首页与布局级侧栏都会在挂载时调用，内部只执行一次；接口异常时仅记录日志，不阻塞页面渲染。
   */
  const ensureLoaded = (): Promise<void> => {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await loadCategories();
          // 分类侧栏默认展开，进入页面即预加载全部二级分类，保证菜单层级完整
          await loadAllSeries();
        } catch (error) {
          console.error("加载产品分类失败", error);
        }
      })();
    }
    return initPromise;
  };

  /** 路由参数/query 归一化为字符串（数组取第一项，空值返回空串） */
  const routeText = (value: unknown): string => (Array.isArray(value) ? value[0] || "" : value ? String(value) : "");

  /**
   * 按当前激活页签反向同步侧栏选中状态：
   * - 参数配置/产品图谱：一级分类取 query.firstCategory，二级分类取 path 中的 classification；
   * - 型号对比：分类上下文取对比会话；
   * - 部件详情：按需求不联动，保持上一次菜单状态；
   * - 首页等其他 PBI 页签：保留一级分类，清除二级选中。
   */
  const syncFromRoute = async (route: RouteLocationNormalizedLoaded): Promise<void> => {
    if (route.name === TLA_ROUTE_NAMES.PART) return;
    if (
      route.name !== TLA_ROUTE_NAMES.CONFIG &&
      route.name !== TLA_ROUTE_NAMES.FAMILY &&
      route.name !== TLA_ROUTE_NAMES.COMPARE
    ) {
      activeSeriesName.value = "";
      return;
    }
    await ensureLoaded();
    let firstCategory = "";
    let classification = "";
    if (route.name === TLA_ROUTE_NAMES.COMPARE) {
      firstCategory = compareSessionContext.value.firstCategory;
      classification = compareSessionContext.value.productClassification;
    } else {
      firstCategory = routeText(route.query.firstCategory);
      classification = routeText(route.params.classification);
    }
    if (!firstCategory) return;
    const category = categoryList.value.find(
      (item) => item.displayName === firstCategory || item.name === firstCategory
    );
    if (!category) return;
    activeCategory.value = category.id;
    await loadSeries(category.id);
    activeSeriesName.value = classification;
  };

  return {
    categoryList,
    activeCategory,
    activeCategoryName,
    activeSeriesName,
    seriesList,
    seriesByCategory,
    seriesLoading,
    menuOpen,
    ensureLoaded,
    syncFromRoute,
    handleCategoryChange,
    openConfig,
    openFamilyTree
  };
};

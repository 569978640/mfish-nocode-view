import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useMultipleTabStore } from "@mfish/stores/modules";
import type { PbiPart } from "@/api/pbi/model";

/**
 * TLA 架构多标签页改造的统一路由/会话中心：
 * - 首页 TLA-Architecture 为系列卡片入口（后端菜单动态路由），四个业务动作各自打开独立系统标签页；
 * - 部件编号、型号对比两个标签所需的完整部件数据无法通过 URL 传递，使用模块级内存会话在标签间共享（刷新即失效）。
 */

/** 首页路由路径（后端菜单配置，兜底值） */
export const TLA_HOME_PATH = "/pbi/TLA-Architecture";
/** 参数配置标签路径 */
export const TLA_CONFIG_PATH = "/pbi/tla/config";
/** 产品家谱标签路径 */
export const TLA_FAMILY_PATH = "/pbi/tla/family";
/** 部件编号（产品详细信息）标签路径 */
export const TLA_PART_PATH = "/pbi/tla/part";
/** 型号对比标签路径 */
export const TLA_COMPARE_PATH = "/pbi/tla/compare";
/** TLA 业务子标签统一前缀（刷新引导时识别用） */
export const TLA_TAB_PREFIX = "/pbi/tla/";

/** 系列卡片携带的二级分类上下文（参数配置/产品家谱/型号对比入参） */
export interface TlaTabContext {
  /** 一级分类显示名称（二级分类的 parentDisplayName） */
  firstCategory: string;
  /** 二级分类显示名称（标题展示用） */
  secondCategory: string;
  /** 二级分类内部名称（接口入参 PRODUCTCLASSIFICATION） */
  productClassification: string;
}

/** 型号对比会话载荷：对比部件 + 发起对比时的分类上下文 */
interface CompareSession {
  parts: PbiPart[];
  context: TlaTabContext;
}

/**
 * 部件详情会话：参数配置/产品家谱/型号对比点击部件编号时暂存完整部件。
 * 模块级单例，新标签页直接消费，避免部件详情接口重复请求；刷新页面后由部件编号接口兜底回源。
 */
const partDetailSession = ref<PbiPart | null>(null);

/**
 * 型号对比会话：开始对比时暂存对比部件全集与分类上下文。
 * 对比标签只有一个（同路径复用），再次发起对比直接覆盖，页面响应式刷新。
 */
const compareSession = ref<CompareSession>({
  parts: [],
  context: { firstCategory: "", secondCategory: "", productClassification: "" }
});

/** 读取并消费部件详情会话：编号匹配时返回缓存部件，同时保留会话（同会话内重复进入仍可命中） */
export const getPartDetailSession = (wtPartNumber: string): PbiPart | null => {
  const part = partDetailSession.value;
  return part && part.wtPartNumber === wtPartNumber ? part : null;
};

/** 型号对比会话部件列表（响应式：同路径对比标签内再次发起对比时表格自动刷新） */
export const compareSessionParts = computed(() => compareSession.value.parts);

/** 型号对比会话分类上下文（响应式） */
export const compareSessionContext = computed(() => compareSession.value.context);

/** 从型号对比会话中移除指定部件（对比标签内关闭标签胶囊） */
export const removeComparePart = (wtPartNumber: string) => {
  compareSession.value = {
    ...compareSession.value,
    parts: compareSession.value.parts.filter((part) => part.wtPartNumber !== wtPartNumber)
  };
};

/** 清空型号对比会话（对比标签内"清空所选"） */
export const clearCompareParts = () => {
  compareSession.value = { ...compareSession.value, parts: [] };
};

/**
 * TLA 标签页统一入口：提供四个业务标签的打开方法。
 * 必须在组件 setup 中调用（内部使用 useRouter）。
 */
export const useTlaTabs = () => {
  const router = useRouter();

  /** 打开参数配置标签（同路径标签自动复用，query 变化后页面重新加载） */
  const openConfigTab = (context: TlaTabContext) => {
    router.push({ path: TLA_CONFIG_PATH, query: { ...context } });
  };

  /** 打开产品家谱标签 */
  const openFamilyTab = (context: TlaTabContext) => {
    router.push({ path: TLA_FAMILY_PATH, query: { ...context } });
  };

  /**
   * 打开部件编号（产品详细信息）标签：
   * 先暂存完整部件供标签直接消费，URL 仅携带一级分类与部件编号（刷新后可据此回源）。
   */
  const openPartTab = (part: PbiPart, firstCategory: string) => {
    partDetailSession.value = part;
    router.push({
      path: TLA_PART_PATH,
      query: { firstCategory, wtPartNumber: part.wtPartNumber }
    });
  };

  /** 打开型号对比标签：暂存对比部件与分类上下文，同路径标签复用、内容响应式更新 */
  const openCompareTab = (parts: PbiPart[], context: TlaTabContext) => {
    compareSession.value = { parts: [...parts], context: { ...context } };
    router.push({ path: TLA_COMPARE_PATH });
  };

  /** 关闭当前标签（型号对比会话失效等场景的返回入口），关闭后由标签 store 自动跳转到相邻标签 */
  const closeCurrentTab = () => {
    const tabStore = useMultipleTabStore();
    tabStore.closeTab(router.currentRoute.value, router);
  };

  return {
    openConfigTab,
    openFamilyTab,
    openPartTab,
    openCompareTab,
    closeCurrentTab
  };
};

/**
 * 默认布局启动引导（DefaultLayout setup 中、多标签组件初始化之前调用一次）：
 * 1. 将后端菜单动态注册的 TLA 首页路由标记为 affix 固定标签（不可关闭）并开启 keepAlive；
 * 2. 浏览器刷新/直接打开业务子标签地址时，清除残留子标签并回到首页标签，保证刷新后默认回到首页。
 * 模块级 initialized 标记保证只在页面首次加载执行一次，SPA 内切换路由重复挂载布局不会误触发。
 */
let initialized = false;

export const setupTlaHomeTab = () => {
  if (initialized) return;
  initialized = true;

  const router = useRouter();
  const tabStore = useMultipleTabStore();

  // 后端菜单 id 未知，按路径特征匹配首页路由，避免硬编码整段路径
  const homeRecord = router.getRoutes().find((record) => /tla-architecture/i.test(record.path));
  if (homeRecord) {
    homeRecord.meta.affix = true;
    homeRecord.meta.keepAlive = true;
  }
  const homePath = homeRecord?.path || TLA_HOME_PATH;

  // 仅当首次加载就落在业务子标签地址时触发（刷新场景），正常 SPA 内跳转不会再次进入本分支
  const currentPath = router.currentRoute.value.path;
  if (currentPath.startsWith(TLA_TAB_PREFIX)) {
    const stalePaths = tabStore.getTabList
      .filter((tab) => tab.path.startsWith(TLA_TAB_PREFIX))
      .map((tab) => tab.fullPath || tab.path);
    if (stalePaths.length > 0) {
      tabStore.bulkCloseTabs(stalePaths);
    }
    router.replace(homePath);
  }
};

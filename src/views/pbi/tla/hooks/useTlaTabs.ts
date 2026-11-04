import { computed, ref } from "vue";
import { useRouter, type RouteLocationNormalized } from "vue-router";
import { useMultipleTabStore } from "@mfish/stores/modules";
import { listenerRouteChange } from "@mfish/core/logics/mitt/RouteChange";
import { Persistent } from "@mfish/core/utils/cache/Persistent";
import { MULTIPLE_TABS_KEY } from "@mfish/core/enums";
import type { PbiPart } from "@/api/pbi/model";

/**
 * TLA 架构多标签页改造的统一路由/会话中心：
 * - 首页 TLA-Architecture 为系列卡片入口（后端菜单动态路由），业务动作各自打开独立系统标签页；
 * - 参数配置/产品图谱/部件编号以 path 参数区分系列/部件：不同系列或部件对应不同标签，互不复用；
 * - 标签显示名随业务上下文动态生成（一级分类+二级分类+动作名 / 编号+详细特性参数）；
 * - 部件完整数据无法通过 URL 传递，使用模块级内存会话在标签间共享（刷新即失效，接口可兜底回源）。
 */

/** TLA 业务子标签路由名（路由表与动态标题解析共用的唯一数据源） */
export const TLA_ROUTE_NAMES = {
  CONFIG: "PbiTlaConfig",
  FAMILY: "PbiTlaFamily",
  PART: "PbiTlaPartDetail",
  COMPARE: "PbiTlaCompare"
} as const;

/** 首页路由路径（后端菜单配置，兜底值） */
export const TLA_HOME_PATH = "/pbi/TLA-Architecture";
/** 参数配置标签基础路径（后接 /:classification） */
export const TLA_CONFIG_PATH = "/pbi/tla/config";
/** 产品图谱标签基础路径（后接 /:classification） */
export const TLA_FAMILY_PATH = "/pbi/tla/family";
/** 部件编号（产品详细信息）标签基础路径（后接 /:wtPartNumber） */
export const TLA_PART_PATH = "/pbi/tla/part";
/** 型号对比标签路径 */
export const TLA_COMPARE_PATH = "/pbi/tla/compare";

/** 系列卡片携带的二级分类上下文（参数配置/产品图谱/型号对比入参） */
export interface TlaTabContext {
  /** 一级分类显示名称（二级分类的 parentDisplayName） */
  firstCategory: string;
  /** 二级分类显示名称（标题展示用） */
  secondCategory: string;
  /** 二级分类内部名称（接口入参 PRODUCTCLASSIFICATION，同时作为标签唯一标识） */
  productClassification: string;
}

/** 型号对比会话载荷：对比部件 + 发起对比时的分类上下文 */
interface CompareSession {
  parts: PbiPart[];
  context: TlaTabContext;
}

/** 部件详情会话最大暂存数（防止连续打开大量部件标签时内存无界增长，FIFO 淘汰） */
const PART_SESSION_LIMIT = 50;

/**
 * 部件详情会话：按部件编号暂存完整部件（参数配置表格/图谱/对比表格点击部件编号时写入）。
 * 不同部件的标签可同时存在，故使用编号 → 部件的 Map 而非单例会话；
 * 各标签挂载时按自身编号消费，页面刷新后由部件编号接口兜底回源。
 */
const partDetailSessionMap = new Map<string, PbiPart>();

/** 暂存部件详情（超出上限时淘汰最早写入的编号） */
const setPartDetailSession = (part: PbiPart) => {
  if (partDetailSessionMap.has(part.wtPartNumber)) {
    // 已存在先删除再写入，使该编号刷新为最近使用，维持 FIFO 顺序
    partDetailSessionMap.delete(part.wtPartNumber);
  } else if (partDetailSessionMap.size >= PART_SESSION_LIMIT) {
    const oldestKey = partDetailSessionMap.keys().next().value;
    if (oldestKey !== undefined) partDetailSessionMap.delete(oldestKey);
  }
  partDetailSessionMap.set(part.wtPartNumber, part);
};

/** 读取部件详情会话：编号命中时返回缓存部件，未命中返回 null（调用方按编号回源） */
export const getPartDetailSession = (wtPartNumber: string): PbiPart | null => {
  return partDetailSessionMap.get(wtPartNumber) ?? null;
};

/** 型号对比会话本地缓存键（与多标签列表同样存 localStorage，刷新后对比标签内容可恢复） */
const TLA_COMPARE_SESSION_KEY = "tla-compare-session";

/** 空的型号对比会话（缓存缺失/结构异常时的兜底值） */
const createEmptyCompareSession = (): CompareSession => ({
  parts: [],
  context: { firstCategory: "", secondCategory: "", productClassification: "" }
});

/**
 * 从本地缓存恢复型号对比会话。
 * 对比部件集合是用户在参数配置页手动勾选的，无法通过接口按标签回源，
 * 因此与多标签列表一样持久化，保证刷新后型号对比标签内容不丢失。
 */
const readCompareSession = (): CompareSession => {
  const empty = createEmptyCompareSession();
  try {
    // Persistent 的值类型为受限联合，自定义会话以 JSON 字符串形式存取
    const cached = Persistent.getLocal<string>(TLA_COMPARE_SESSION_KEY);
    if (typeof cached !== "string" || !cached) {
      return empty;
    }
    const parsed = JSON.parse(cached) as Partial<CompareSession> | null;
    if (!parsed || !Array.isArray(parsed.parts) || typeof parsed.context !== "object" || parsed.context === null) {
      return empty;
    }
    return { parts: parsed.parts as PbiPart[], context: { ...empty.context, ...parsed.context } };
  } catch {
    return empty;
  }
};

/**
 * 型号对比会话：开始对比时暂存对比部件全集与分类上下文。
 * 对比标签全局只有一个（同路径复用），再次发起对比直接覆盖，页面响应式刷新；
 * 初值从本地缓存读取，并在每次变更后写回，刷新后内容可恢复。
 */
const compareSession = ref<CompareSession>(readCompareSession());

/** 将型号对比会话写入本地缓存（JSON 字符串形式，规避 Persistent 受限值类型） */
const persistCompareSession = () => {
  Persistent.setLocal(TLA_COMPARE_SESSION_KEY, JSON.stringify(compareSession.value));
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
  persistCompareSession();
};

/** 清空型号对比会话（对比标签内"清空所选"） */
export const clearCompareParts = () => {
  compareSession.value = { ...compareSession.value, parts: [] };
  persistCompareSession();
};

/** 路由参数/query 归一化为字符串（数组取第一项，空值返回空串） */
const routeText = (value: unknown): string =>
  Array.isArray(value) ? value[0] || "" : value ? String(value) : "";

/**
 * TLA 标签页统一入口：提供四个业务标签的打开方法。
 * 必须在组件 setup 中调用（内部使用 useRouter）。
 */
export const useTlaTabs = () => {
  const router = useRouter();

  /**
   * 打开参数配置标签：二级分类内部名放入 path 作为标签唯一标识（编码防特殊字符），
   * 一二级分类显示名通过 query 携带（供页面加载与标题展示）。
   * 同系列重复点击 path 相同 → 复用同一标签；不同系列 path 不同 → 新建独立标签。
   */
  const openConfigTab = (context: TlaTabContext) => {
    router.push({
      path: `${TLA_CONFIG_PATH}/${encodeURIComponent(context.productClassification)}`,
      query: { firstCategory: context.firstCategory, secondCategory: context.secondCategory }
    });
  };

  /** 打开产品图谱标签（标识规则同参数配置） */
  const openFamilyTab = (context: TlaTabContext) => {
    router.push({
      path: `${TLA_FAMILY_PATH}/${encodeURIComponent(context.productClassification)}`,
      query: { firstCategory: context.firstCategory, secondCategory: context.secondCategory }
    });
  };

  /**
   * 打开部件编号（产品详细信息）标签：
   * 部件编号放入 path 作为标签唯一标识，先按编号暂存完整部件供新标签直接消费；
   * 一级分类通过 query 携带（决定特性参数展示列，刷新回源时同样需要）。
   */
  const openPartTab = (part: PbiPart, firstCategory: string) => {
    setPartDetailSession(part);
    router.push({
      path: `${TLA_PART_PATH}/${encodeURIComponent(part.wtPartNumber)}`,
      query: { firstCategory }
    });
  };

  /** 打开型号对比标签：暂存对比部件与分类上下文，同路径标签复用、内容响应式更新 */
  const openCompareTab = (parts: PbiPart[], context: TlaTabContext) => {
    compareSession.value = { parts: [...parts], context: { ...context } };
    persistCompareSession();
    router.push({ path: TLA_COMPARE_PATH });
  };

  /** 关闭当前标签（对比会话失效等场景的返回入口），关闭后由标签 store 自动跳转到相邻标签 */
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
 * 解析 TLA 业务标签的动态显示名：
 * - 参数配置/产品图谱：一级分类 + 空格 + 二级分类 + 动作名（如「LD F3.8 参数配置」）；
 * - 部件编号：部件编号 + 空格 + 详细特性参数（如「A066X756 详细特性参数」）。
 * 非 TLA 业务路由或必要上下文缺失时返回 null，沿用路由静态标题。
 */
export const resolveTlaTabTitle = (route: RouteLocationNormalized): string | null => {
  switch (route.name) {
    case TLA_ROUTE_NAMES.CONFIG:
    case TLA_ROUTE_NAMES.FAMILY: {
      const firstCategory = routeText(route.query.firstCategory);
      const secondCategory = routeText(route.query.secondCategory);
      if (!firstCategory && !secondCategory) return null;
      const suffix = route.name === TLA_ROUTE_NAMES.CONFIG ? "参数配置" : "产品图谱";
      return `${[firstCategory, secondCategory].filter((name) => !!name).join(" ")} ${suffix}`;
    }
    case TLA_ROUTE_NAMES.PART: {
      const wtPartNumber = routeText(route.params.wtPartNumber);
      return wtPartNumber ? `${wtPartNumber} 详细特性参数` : null;
    }
    default:
      return null;
  }
};

/**
 * 默认布局启动引导（DefaultLayout setup 中、多标签组件初始化之前调用一次）：
 * 1. 将后端菜单动态注册的 TLA 首页路由标记为 affix 固定标签（不可关闭）并开启 keepAlive；
 * 2. 注册路由变化监听（先于多标签组件的监听）：为 TLA 业务标签生成本次导航独立的 meta 副本，
 *    写入动态标题后再由多标签组件 addTab，保证每个标签拥有各自标题、互不串改；
 * 3. 清理参数化改造前遗留的旧格式业务标签（path 无动态段，已无法匹配路由）。
 *
 * 刷新策略：不主动关闭任何标签、不强制回首页。多标签列表本就持久化在 localStorage
 * （multiTabsSetting.cache），刷新后标签栏原样恢复、浏览器停留在刷新前的活动标签；
 * 各页面按路由参数自行重新加载（部件详情支持按编号回源，型号对比会话单独持久化）。
 * 模块级 initialized 标记保证只在页面首次加载执行一次。
 */
let initialized = false;

export const setupTlaHomeTab = () => {
  if (initialized) return;
  initialized = true;

  const router = useRouter();
  const tabStore = useMultipleTabStore();

  // 必须在多标签组件（tabs/index.vue）注册监听之前注册：
  // 父布局 setup 先于子组件执行，路由变化事件按注册顺序广播，本回调先改写 meta，addTab 随后消费。
  // route.meta 替换为独立副本，避免直接修改路由记录共享 meta 导致同路由所有标签标题被覆盖。
  listenerRouteChange((route) => {
    const title = resolveTlaTabTitle(route);
    if (title && route.meta.title !== title) {
      route.meta = { ...route.meta, title };
    }
  });

  // 后端菜单 id 未知，按路径特征匹配首页路由，避免硬编码整段路径
  const homeRecord = router.getRoutes().find((record) => /tla-architecture/i.test(record.path));
  if (homeRecord) {
    homeRecord.meta.affix = true;
    homeRecord.meta.keepAlive = true;
  }

  // 兼容参数化改造前的旧格式标签（/pbi/tla/config 等无动态段路径，靠 query 传参）：
  // 这类标签无法匹配新路由，点击会进入 404，启动时从恢复的标签列表中剔除一次并同步持久化。
  const legacyFlatPaths = new Set<string>([TLA_CONFIG_PATH, TLA_FAMILY_PATH, TLA_PART_PATH]);
  const restoredTabs = tabStore.getTabList;
  const validTabs = restoredTabs.filter((tab) => !legacyFlatPaths.has(tab.path));
  if (validTabs.length !== restoredTabs.length) {
    // 直接赋值 state 字段（$patch 对 RouteLocationNormalized 会触发过深的类型推导）
    tabStore.tabList = validTabs;
    Persistent.setLocal(MULTIPLE_TABS_KEY, validTabs);
  }
};

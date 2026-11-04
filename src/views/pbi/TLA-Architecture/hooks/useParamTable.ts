import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";
import type { PbiParamConfigItem, PbiPart } from "@/api/pbi/model";
import { getAttrValue, isEmptyValue } from "../utils/partValue";

/** 折叠组头汇总配置：引用组内某个属性，按序号取逗号分隔后的某一段 */
export interface FoldDisplayConfig {
  /** 被引用属性的 Windchill 内部名称 */
  internalName: string;
  /** 被引用属性的部件视图列名 */
  columnName: string;
  /** 逗号分隔后的取值序号（从 1 开始；未配置时展示完整值） */
  index?: number;
}

/** 属性组视图模型 */
export interface ParamGroup {
  /** 属性组名 */
  name: string;
  /** 属性组背景色（带 # 前缀） */
  bgColor: string;
  /** 是否允许折叠（组内配置一致，任一行配置为"是"即允许） */
  allowFold: boolean;
  /** 折叠后组头汇总配置，未配置或引用属性不存在时为空 */
  foldConfig?: FoldDisplayConfig;
  /** 组内属性列表 */
  items: PbiParamConfigItem[];
}

/**
 * 解析折叠汇总配置：
 * - com.bfces.SCR_ASC：展示该属性完整值
 * - com.bfces.DOC|1|：按英文逗号分段后取第 1 段（序号从 1 开始）
 */
const parseFoldDisplayValue = (value: string): { internalName: string; index?: number } | null => {
  const [namePart, indexPart] = value.split("|");
  const internalName = namePart?.trim();
  if (!internalName) return null;
  const index = Number((indexPart ?? "").trim());
  return {
    internalName,
    index: Number.isInteger(index) && index > 0 ? index : undefined
  };
};

/** 属性行状态：空（暂无内容）/ 同（完全一致）/ 异（存在差异）/ 单列（无比较对象，如产品详情页） */
type RowState = "empty" | "same" | "diff" | "single";

interface UseParamTableOptions {
  configList: Ref<PbiParamConfigItem[]>;
  partList: Ref<PbiPart[]>;
  filteredPartList: Ref<PbiPart[]>;
  /** 表格实际展示的部件列（对比模式/普通模式由组件计算后传入） */
  tablePartList: Ref<PbiPart[]>;
}

/** 第一列宽度下限及左右内边距（16px * 2） */
const FIRST_COL_MIN = 140;
const FIRST_COL_PADDING = 32;
/** 部件列最小宽度：部件很多时每列固定为此宽度并出现横向滚动条 */
const PART_COL_MIN = 200;

/**
 * 参数表格的展示模型：属性分组、属性行状态（空/同/异）、左侧过滤开关，
 * 以及第一列与部件列的自适应列宽计算（含容器尺寸监听）。
 */
export const useParamTable = (options: UseParamTableOptions) => {
  const { configList, partList, filteredPartList, tablePartList } = options;

  /** 左侧属性过滤开关：高亮不同参数 / 隐藏相同参数 / 隐藏暂无内容 */
  const highlightDiff = ref(false);
  const hideSame = ref(false);
  const hideEmpty = ref(false);

  // 按 paramGroup 分组，保持接口返回顺序
  const groupList = computed<ParamGroup[]>(() => {
    const groupMap = new Map<string, ParamGroup>();
    for (const item of configList.value) {
      const name = item.paramGroup || "Other";
      let group = groupMap.get(name);
      if (!group) {
        group = {
          name,
          bgColor: item.groupColor ? `#${item.groupColor}` : "#E7E6E6",
          allowFold: item.allowFold?.trim() === "是",
          items: []
        };
        groupMap.set(name, group);
      } else if (item.allowFold?.trim() === "是") {
        // 组内配置一致，兜底任一行为"是"时允许折叠
        group.allowFold = true;
      }
      group.items.push(item);
    }
    const groups = [...groupMap.values()];
    // 折叠汇总配置取组内首个非空值，并在全量属性中解析被引用属性的列名（不受属性过滤影响）
    groups.forEach((group) => {
      const raw = group.items.map((item) => item.foldDisplayValue?.trim()).find(Boolean);
      if (!raw) return;
      const spec = parseFoldDisplayValue(raw);
      if (!spec) return;
      const target =
        group.items.find((item) => item.internalName?.trim() === spec.internalName) ??
        group.items.find((item) => item.internalName?.trim().toLowerCase() === spec.internalName.toLowerCase());
      if (target?.columnName) {
        group.foldConfig = { ...spec, columnName: target.columnName };
      }
    });
    return groups;
  });

  // 空数据提示文案
  const emptyText = computed(() => {
    if (configList.value.length === 0) return "暂无属性配置";
    if (partList.value.length === 0) return "暂无产品型号";
    if (filteredPartList.value.length === 0) return "暂无符合筛选条件的产品型号";
    return "当前属性过滤条件下暂无展示参数";
  });

  /**
   * 属性行状态：基于当前表格展示的部件列统计每个属性行（internalName）的取值
   * - empty：所有部件值均为空（暂无内容）
   * - single：仅一个部件列（产品详情页）——不存在比较对象，有值行既不算相同也不算差异，
   *   不会被"隐藏相同参数"过滤，也不参与差异高亮
   * - same：所有部件都有值且完全一致（相同参数，要求完全相等，含空值的行不算相同）
   * - diff：其他情况——非空值存在差异，或部分部件有值、部分为空
   */
  const rowStateMap = computed<Map<string, RowState>>(() => {
    const stateMap = new Map<string, RowState>();
    for (const group of groupList.value) {
      for (const item of group.items) {
        const cellTexts = tablePartList.value.map((part) => {
          const value = getAttrValue(part, item.columnName);
          return isEmptyValue(value) ? null : String(value).trim();
        });
        const nonEmptyValues = cellTexts.filter((text): text is string => text !== null);
        if (nonEmptyValues.length === 0) {
          stateMap.set(item.internalName, "empty");
        } else if (cellTexts.length <= 1) {
          stateMap.set(item.internalName, "single");
        } else if (nonEmptyValues.length === cellTexts.length && new Set(nonEmptyValues).size === 1) {
          stateMap.set(item.internalName, "same");
        } else {
          stateMap.set(item.internalName, "diff");
        }
      }
    }
    return stateMap;
  });

  /**
   * 应用左侧属性过滤后的分组与属性行：
   * 隐藏暂无内容 → 去掉 empty 行；隐藏相同参数 → 去掉 same 行；组内无可见行时整组不展示
   */
  const displayGroups = computed<ParamGroup[]>(() => {
    return groupList.value
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const state = rowStateMap.value.get(item.internalName);
          if (hideEmpty.value && state === "empty") return false;
          if (hideSame.value && state === "same") return false;
          return true;
        })
      }))
      .filter((group) => group.items.length > 0);
  });

  /** 判断某属性行是否需要按“不同参数”高亮：只要存在差异（含部分为空）即为 diff */
  const isDiffRow = (item: PbiParamConfigItem): boolean => rowStateMap.value.get(item.internalName) === "diff";

  // ---------------- 列宽与固定列 ----------------

  /** 表格横向滚动容器 */
  const tableWrapRef = ref<HTMLElement>();
  /** 滚动容器当前可用宽度（ResizeObserver 实时更新） */
  const wrapWidth = ref(0);
  /** 横向滚动位置是否已离开起点（用于控制固定列右侧阴影） */
  const wrapScrolled = ref(false);
  let resizeObserver: ResizeObserver | null = null;

  /** 横向滚动时切换固定列阴影 */
  const handleTableScroll = (event: Event) => {
    wrapScrolled.value = (event.target as HTMLElement).scrollLeft > 2;
  };

  /**
   * 第一列（特性参数列）固定宽度：
   * 用 canvas 按真实字体测量全部属性配置中最长的「英文(中文)」文本宽度 + 内边距，
   * 按属性名称实际长度自适应（仅限制下限），保证名称完整展示不截断；
   * 基于全量配置而非当前展示行计算，勾选过滤复选框时宽度保持稳定
   */
  const firstColumnWidth = computed(() => {
    let maxTextWidth = 0;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        for (const item of configList.value) {
          ctx.font = '600 13px "PingFang SC", "Microsoft YaHei", sans-serif';
          let lineWidth = ctx.measureText(item.param || "").width;
          if (item.displayName) {
            // 中文名与英文名同一行展示，宽度按两段文本分别测量后累加
            ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
            lineWidth += ctx.measureText(`(${item.displayName})`).width + 2;
          }
          maxTextWidth = Math.max(maxTextWidth, lineWidth);
        }
      }
    } catch {
      // canvas 不可用时回退到最小宽度
    }
    return Math.max(FIRST_COL_MIN, Math.ceil(maxTextWidth) + FIRST_COL_PADDING);
  });

  /**
   * 部件列宽：
   * 部件少时将容器剩余宽度均摊给各列（表格铺满，图片/编号居中更舒展）；
   * 部件多时保持 PART_COL_MIN 固定宽度，表格总宽超出容器即出现横向滚动条
   */
  const partColumnWidth = computed(() => {
    const count = tablePartList.value.length;
    if (count === 0 || wrapWidth.value === 0) return PART_COL_MIN;
    const available = wrapWidth.value - firstColumnWidth.value;
    return Math.max(PART_COL_MIN, Math.floor(available / count));
  });

  /** 表格总宽：第一列 + 所有部件列宽度求和（table-layout:fixed 下即为最终渲染宽度） */
  const tableWidth = computed(() => firstColumnWidth.value + tablePartList.value.length * partColumnWidth.value);

  /** col 列宽硬约束：width/min/max 同值，避免横向滚动时浏览器重新分配列宽 */
  const colStyle = (width: number) => ({
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`
  });

  /**
   * 监听表格滚动容器 ref（flush: 'post' 保证 DOM 已布局）：
   * 部件编号详情页的表格在异步数据返回后才由 v-if 渲染，容器属于"晚挂载"，
   * 不能只在 onMounted 建立观察器；ref 一旦出现立即读取宽度并 observe，
   * 容器被 v-if 移除时断开旧观察器，重新出现时再补建。
   */
  watch(
    tableWrapRef,
    (el, oldEl) => {
      if (el === oldEl) return;
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (!el) return;
      wrapWidth.value = el.clientWidth;
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          wrapWidth.value = entry.contentRect.width;
        }
      });
      resizeObserver.observe(el);
    },
    { flush: "post", immediate: true }
  );

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return {
    highlightDiff,
    hideSame,
    hideEmpty,
    displayGroups,
    isDiffRow,
    emptyText,
    tableWrapRef,
    wrapScrolled,
    handleTableScroll,
    firstColumnWidth,
    partColumnWidth,
    tableWidth,
    colStyle
  };
};

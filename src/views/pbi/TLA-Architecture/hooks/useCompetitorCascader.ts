import { h, onMounted, ref, watch, type Ref } from "vue";
import { Input as AInput } from "ant-design-vue";
import { tlaApi } from "@/api/pbi/tla";
import type { PbiPart, PbiClassificationProps } from "@/api/pbi/model";

/** 竞品级联节点 */
export interface CompetitorOption {
  /** 节点值：一级/二级为分类内部 name，叶子为接口返回的"编号,名称" */
  value: string;
  /** 节点展示文本：分类显示名 / 叶子部件编号 */
  label: string;
  /** 一级节点携带：一级分类显示名（查询部件接口的 firstCategory） */
  firstCategory?: string;
  /** 叶子节点携带：部件编号（"编号,名称"逗号前的部分） */
  partNumber?: string;
  /** 是否叶子节点（控制级联是否继续展开下一级） */
  isLeaf?: boolean;
  /** 是否禁用（已加入对比集的叶子禁用） */
  disabled?: boolean;
  /** 懒加载中的状态标记（Cascader 据此显示加载态） */
  loading?: boolean;
  /** 二级节点持有：第三级产品叶子的全量列表（搜索过滤的数据源，与 children 区分） */
  rawLeaves?: CompetitorOption[];
  children?: CompetitorOption[];
}

/** 级联弹层自定义渲染函数类型（菜单外层容器 + 第三列顶部产品搜索框） */
export type CompetitorDropdownRender = (args: { menuNode?: unknown }) => ReturnType<typeof h>;

interface UseCompetitorCascaderOptions {
  props: PbiClassificationProps;
  /** 当前分类已加载的部件（同分类竞品直接复用，避免重复请求） */
  partList: Ref<PbiPart[]>;
  /** 已加入对比的部件（用于叶子禁用态与变化同步） */
  compareParts: Ref<PbiPart[]>;
  /** 将部件加入对比集（内部已做去重） */
  addCompare: (part: PbiPart) => void;
}

/**
 * 竞品选择三级级联（一级分类 → 二级分类 → 产品型号）：
 * 逐级懒加载、每级空结果展示灰色禁用占位、第三级内置产品模糊搜索；
 * 选中叶子型号后拉取完整部件加入对比集并重置选择器以支持连续添加。
 */
export const useCompetitorCascader = (options: UseCompetitorCascaderOptions) => {
  const { props, partList, compareParts, addCompare } = options;

  /** 级联选项树（一级懒加载后常驻；二、三级展开时逐级加载） */
  const competitorTree = ref<CompetitorOption[]>([]);
  /** 级联当前选中路径（选中叶子加入对比后立即清空，便于连续添加） */
  const competitorPath = ref<string[]>([]);
  /** 第三级产品搜索关键字（仅过滤当前展开的产品列表） */
  const productKeyword = ref("");
  /** 当前展开第三列对应的二级节点引用（搜索过滤作用于该节点） */
  const currentProductNode = ref<CompetitorOption | null>(null);
  /** 跨分类完整部件缓存：key = firstCategory|productClassification，避免重复请求 */
  const competitorPartsCache = new Map<string, PbiPart[]>();

  /** 构造级联空态占位节点：灰色禁用、不可选中、不再展开下一级 */
  const buildEmptyOption = (value: string, label: string): CompetitorOption => ({
    value,
    label,
    disabled: true,
    isLeaf: true
  });

  /** 加载一级分类（node1 末尾的 ALL 兜底节点不属于真实分类，过滤掉） */
  const loadFirstCategories = async () => {
    if (competitorTree.value.length > 0) return;
    const list = await tlaApi.getCategoryList();
    const nodes = list
      .filter((node) => node.name !== "ALL")
      .map((node) => ({
        value: node.name,
        label: node.displayName || node.name,
        firstCategory: node.displayName || node.name,
        isLeaf: false
      }));
    // 无一级分类时展示禁用占位项，避免点开空白无反馈
    competitorTree.value = nodes.length > 0 ? nodes : [buildEmptyOption("empty-category", "暂无分类")];
  };

  /**
   * 级联懒加载（rc-cascader 每次展开非叶子节点都会回调，不区分 children 是否已加载）：
   * 选中一级 → 按一级内部 name 加载二级分类；
   * 选中二级 → 按一级显示名 + 二级内部 name 加载"编号,名称"产品型号选项；
   * 任一级查询结果为空时插入"暂无XX"禁用占位项。
   * 注意：二级节点即使产品已缓存，每次展开也必须把搜索作用域切到当前节点，
   * 否则搜索框会一直过滤上一个型号的列表
   */
  const loadCompetitorData = async (selectedOptions: CompetitorOption[]) => {
    const current = selectedOptions[selectedOptions.length - 1];
    if (!current) return;

    // 二级节点展开：加载（或复用缓存）产品，并把搜索框作用域指向当前节点
    if (selectedOptions.length === 2) {
      current.loading = true;
      try {
        // 切换到不同型号时清空上次的搜索关键字（watch 会顺带恢复旧节点的全量列表）
        if (currentProductNode.value?.value !== current.value) {
          productKeyword.value = "";
        }
        currentProductNode.value = current;
        if (!current.rawLeaves) {
          const firstCategory = selectedOptions[0].firstCategory || selectedOptions[0].value;
          const optionList = await tlaApi.getPartOptions(firstCategory, current.value);
          // 无产品时只标记全量列表为空，占位项由 applyProductFilter 统一生成，避免被过滤逻辑覆盖
          const comparedNumbers = new Set(compareParts.value.map((part) => part.wtPartNumber));
          current.rawLeaves = (optionList || []).map((option) => {
            const commaIndex = option.indexOf(",");
            const partNumber = commaIndex === -1 ? option : option.slice(0, commaIndex);
            const partName = commaIndex === -1 ? "" : option.slice(commaIndex + 1);
            return {
              value: option,
              label: partName ? `${partNumber}, ${partName}` : partNumber,
              partNumber,
              isLeaf: true,
              disabled: comparedNumbers.has(partNumber)
            };
          });
        }
        applyProductFilter(current);
      } catch {
        // 加载失败时置空子级（非占位），菜单重新展开可再次触发加载重试
        current.children = [];
      } finally {
        current.loading = false;
      }
      return;
    }

    // 一级节点展开：二级分类已加载则直接复用
    if (current.children) return;
    current.loading = true;
    try {
      const list = await tlaApi.getSeriesList(current.value);
      if (!list || list.length === 0) {
        current.children = [buildEmptyOption(`empty-series-${current.value}`, "暂无型号")];
        return;
      }
      current.children = list.map((node) => ({
        value: node.name,
        label: node.displayName || node.name,
        isLeaf: false
      }));
    } catch {
      // 加载失败时置空子级（非占位），菜单重新展开可再次触发加载重试
      current.children = [];
    } finally {
      current.loading = false;
    }
  };

  /**
   * 按搜索框关键字过滤当前二级节点的产品叶子，只作用于当前列表的下拉值：
   * 同时匹配下拉显示文本（编号, 名称）与原始值（编号,名称），忽略大小写，
   * 避免逗号后是否带空格、名称内部含逗号导致漏匹配；
   * 关键字为空恢复全量；该分类无产品时展示"暂无产品"；有关键字但无匹配时展示"暂无匹配产品"
   */
  const applyProductFilter = (node: CompetitorOption) => {
    const leaves = node.rawLeaves || [];
    // 该分类本身没有任何产品时，无论是否输入关键字都提示"暂无产品"
    if (leaves.length === 0) {
      node.children = [buildEmptyOption(`empty-product-${node.value}`, "暂无产品")];
      return;
    }
    const keyword = productKeyword.value.trim().toLowerCase();
    if (!keyword) {
      node.children = leaves;
      return;
    }
    const matched = leaves.filter((leaf) => `${leaf.label} ${leaf.value}`.toLowerCase().includes(keyword));
    node.children = matched.length > 0 ? matched : [buildEmptyOption(`empty-match-${node.value}`, "暂无匹配产品")];
  };

  // 搜索关键字变化时实时过滤当前产品列表
  watch(productKeyword, () => {
    if (currentProductNode.value) applyProductFilter(currentProductNode.value);
  });

  /** 级联弹层关闭时清空搜索关键字（watch 会同步把已缓存节点的产品列表恢复全量） */
  const handleCompetitorPopupChange = (open: boolean) => {
    if (!open) productKeyword.value = "";
  };

  /**
   * Cascader 弹层自定义渲染（Cascader 不支持 dropdownRender 插槽，必须用 prop 渲染函数）：
   * 在多列菜单外层包一层容器，并注入悬浮于第三列顶部的产品搜索框
   */
  const renderCompetitorDropdown = ({ menuNode }: { menuNode?: unknown }) =>
    h("div", { class: "competitor-dropdown" }, [
      h(AInput, {
        value: productKeyword.value,
        "onUpdate:value": (value: string) => {
          productKeyword.value = value;
        },
        size: "small",
        allowClear: true,
        placeholder: "搜索编号或名称",
        class: "competitor-product-search",
        // 阻止 mousedown 冒泡，避免点击搜索框被误判为菜单交互导致焦点丢失或路径切换
        onMousedown: (event: Event) => event.stopPropagation()
      }),
      menuNode as never
    ]);

  /**
   * 获取竞品完整部件：
   * 当前分类直接复用已加载的 partList；其他分类按需调用产品型号接口并缓存
   */
  const resolveCompetitorPart = async (
    firstCategory: string,
    productClassification: string,
    partNumber: string
  ): Promise<PbiPart | undefined> => {
    if (firstCategory === props.firstCategory && productClassification === props.productClassification) {
      return partList.value.find((part) => part.wtPartNumber === partNumber);
    }
    const cacheKey = `${firstCategory}|${productClassification}`;
    let list = competitorPartsCache.get(cacheKey);
    if (!list) {
      list = await tlaApi.getPartsByClassification(firstCategory, productClassification);
      competitorPartsCache.set(cacheKey, list || []);
    }
    return list.find((part) => part.wtPartNumber === partNumber);
  };

  /** 选中叶子型号后拉取完整部件加入对比集，并重置级联选择器 */
  const handleCompetitorChange = async (value: string[], selectedOptions: CompetitorOption[]) => {
    competitorPath.value = [];
    if (!value || value.length !== 3) return;
    const firstCategory = selectedOptions[0]?.firstCategory || value[0];
    const productClassification = value[1];
    const partNumber = selectedOptions[2]?.partNumber || value[2].split(",")[0];
    const part = await resolveCompetitorPart(firstCategory, productClassification, partNumber);
    if (part) {
      addCompare(part);
    }
  };

  // 对比集变化时，同步已加载的型号叶子禁用态（移除后叶子恢复可选）；
  // rawLeaves（全量）与 children（搜索过滤后）都要同步，避免被关键字隐藏的叶子状态遗漏
  watch(compareParts, (parts) => {
    const numbers = new Set(parts.map((part) => part.wtPartNumber));
    const syncLeaf = (leaf: CompetitorOption) => {
      if (leaf.partNumber) leaf.disabled = numbers.has(leaf.partNumber);
    };
    for (const level1 of competitorTree.value) {
      for (const level2 of level1.children || []) {
        (level2.rawLeaves || []).forEach((leaf) => syncLeaf(leaf));
        (level2.children || []).forEach((leaf) => syncLeaf(leaf));
      }
    }
  });

  // 分类变化时重置级联选择路径（与数据重载保持同步）
  watch(
    () => [props.firstCategory, props.productClassification],
    () => {
      competitorPath.value = [];
    }
  );

  onMounted(() => {
    // 预加载竞品级联的一级分类
    loadFirstCategories();
  });

  return {
    competitorPath,
    competitorTree,
    loadCompetitorData,
    renderCompetitorDropdown,
    handleCompetitorChange,
    handleCompetitorPopupChange
  };
};

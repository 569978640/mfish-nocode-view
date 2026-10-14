<template>
  <div class="param-config h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部栏：详情/对比模式下返回上一层视图，普通模式返回系列列表 -->
    <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
      <div class="flex items-center gap-4">
        <AButton @click="handleBack">返回</AButton>
        <h2 class="text-xl font-bold m-0">{{ headerTitle }}</h2>
      </div>
    </div>

    <!-- 筛选栏：对比/详情模式隐藏 -->
    <FilterBar
      v-if="!comparing && !detailPart && filterProperties.length > 0"
      :filter-properties="filterProperties"
      :get-text-value="getTextValue"
      :get-multi-value="getMultiValue"
      :set-filter-value="setFilterValue"
      :build-select-options="buildSelectOptions"
      @reset="resetFilters"
    />

    <!-- 左侧属性过滤面板 + 右侧参数表格 -->
    <div class="param-body flex-1 flex overflow-hidden">
      <ComparePanel
        v-if="tablePartList.length > 0"
        v-model:highlight-diff="highlightDiff"
        v-model:hide-same="hideSame"
        v-model:hide-empty="hideEmpty"
        :count="tablePartList.length"
        :is-detail="!!detailPart"
        :comparing="comparing"
        :compare-parts="compareParts"
        v-model:competitor-path="competitorPath"
        :competitor-tree="competitorTree"
        :load-competitor-data="loadCompetitorData"
        :render-competitor-dropdown="renderCompetitorDropdown"
        @remove="removeCompare"
        @competitor-change="handleCompetitorChange"
        @popup-change="handleCompetitorPopupChange"
        @start="startCompare"
        @clear="clearCompare"
      />

      <!-- 参数配置表格：每个部件一列，超出宽度出现横向滚动条；第一列固定不随横向滚动 -->
      <ParamTable
        :loading="loading"
        :display-groups="displayGroups"
        :empty-text="emptyText"
        :table-part-list="tablePartList"
        :table-width="tableWidth"
        :first-column-width="firstColumnWidth"
        :part-column-width="partColumnWidth"
        :col-style="colStyle"
        :wrap-scrolled="wrapScrolled"
        :highlight-diff="highlightDiff"
        :is-diff-row="isDiffRow"
        :is-compared="isCompared"
        :comparing="comparing"
        :is-detail="!!detailPart"
        :set-wrap-el="setWrapEl"
        :on-scroll="handleTableScroll"
        @open-detail="openDetail"
        @toggle-compare="toggleCompare"
        @open-info-page="openInfoPage"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "TLAArchitectureParameterConfig" });
  const props = defineProps<{
    /** 一级分类显示名称（二级分类的 parentDisplayName） */
    firstCategory: string;
    /** 二级分类显示名称（标题展示用，缺省时由父级兜底为内部名） */
    secondCategory: string;
    /** 产品分类（二级分类的原始 name） */
    productClassification: string;
    /** 初始详情部件：由产品家谱点击部件编号带入，挂载即进入该部件的产品详细信息（单部件）视图 */
    initialDetailPart?: PbiPart | null;
  }>();
  const emit = defineEmits(["back"]);

  import { computed, ref } from "vue";
  import { Button as AButton } from "ant-design-vue";
  import type { PbiPart } from "@/api/pbi/model";
  import { usePbiData } from "../hooks/usePbiData";
  import { usePartFilter } from "../hooks/usePartFilter";
  import { usePartCompare } from "../hooks/usePartCompare";
  import { useParamTable } from "../hooks/useParamTable";
  import { useCompetitorCascader } from "../hooks/useCompetitorCascader";
  import FilterBar from "./filter/FilterBar.vue";
  import ComparePanel from "./compare/ComparePanel.vue";
  import ParamTable from "./table/ParamTable.vue";

  // 1. 型号对比集与对比模式（先于数据加载创建，数据重载完成时回调重置）
  const {
    compareParts,
    comparing,
    isCompared,
    addCompare,
    toggleCompare,
    removeCompare,
    clearCompare,
    startCompare,
    exitCompare,
    reset: resetCompare
  } = usePartCompare();

  /**
   * 产品详情层：点击表头部件编号后在当前页切换到单部件详情视图；
   * 非空时优先级高于对比模式，返回时清空即回到来源视图（普通列表或对比页）
   */
  // 家谱跳转带入的部件在挂载时即作为初始详情（组件随视图 v-if 重新挂载，无需 watch 后续变化）
  const detailPart = ref<PbiPart | null>(props.initialDetailPart ?? null);
  /**
   * 初始详情仅在首次数据加载完成时保留一次：usePbiData 挂载即加载并回调 onLoaded，
   * 不能让该回调把家谱带入的详情层清空；消费后置 false，后续分类重载仍正常重置详情层。
   */
  let keepInitialDetail = !!props.initialDetailPart;

  // 2. 配置/部件/筛选属性并行加载，分类切换后重置对比状态与详情层
  const { loading, configList, partList, filterProperties, filterValues } = usePbiData(props, () => {
    resetCompare();
    if (keepInitialDetail) {
      keepInitialDetail = false;
      return;
    }
    detailPart.value = null;
  });

  // 3. 顶部筛选条件与过滤后的部件列表
  const { filteredPartList, buildSelectOptions, getTextValue, getMultiValue, setFilterValue, resetFilters } =
    usePartFilter({
      configList,
      partList,
      filterProperties,
      filterValues
    });

  /**
   * 普通模式页面标题：一级分类 + 二级分类 + 参数配置；
   * 任一分类名为空时自动跳过，避免出现连续空格
   */
  const pageTitle = computed(() => {
    const categories = [props.firstCategory, props.secondCategory].filter((name) => !!name);
    return `${categories.join(" ")} 参数配置`;
  });

  /** 顶部标题：详情层 > 对比模式 > 普通参数配置；详情标题为"编号,名称 详细特性参数" */
  const headerTitle = computed(() => {
    if (detailPart.value) {
      const { wtPartNumber, name } = detailPart.value;
      return `${name ? `${wtPartNumber},${name}` : wtPartNumber} 详细特性参数`;
    }
    if (comparing.value) return "型号对比";
    return pageTitle.value;
  });

  /**
   * 表格实际展示的部件列：
   * 详情层只展示当前部件一列；对比模式展示已加入对比的部件；普通模式展示筛选后的全部部件
   */
  const tablePartList = computed<PbiPart[]>(() => {
    if (detailPart.value) return [detailPart.value];
    return comparing.value ? compareParts.value : filteredPartList.value;
  });

  // 4. 属性分组、行状态（空/同/异）、列宽自适应与固定列阴影
  const {
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
  } = useParamTable({
    configList,
    partList,
    filteredPartList,
    tablePartList
  });

  /**
   * 表格滚动容器模板 ref 回调（组件卸载时 el 为 null）：
   * 写入表格 hook 的 ref，供固定列阴影判定与 ResizeObserver 宽度监听使用
   */
  const setWrapEl = (el: unknown) => {
    // 组件卸载时 el 为 null，而 hook 中 ref 初始类型为 HTMLElement | undefined，统一归一为 undefined
    tableWrapRef.value = (el as HTMLElement | null) ?? undefined;
  };

  // 5. 竞品三级级联（懒加载 + 产品搜索 + 选中叶子加入对比集）
  const {
    competitorPath,
    competitorTree,
    loadCompetitorData,
    renderCompetitorDropdown,
    handleCompetitorChange,
    handleCompetitorPopupChange
  } = useCompetitorCascader({
    props,
    partList,
    compareParts,
    addCompare
  });

  /**
   * 点击部件编号：在当前页切换到产品详细信息视图（复用参数表格，仅展示该部件一列）。
   * 部件数据已在内存中（含全部扩展属性），无需再次请求
   */
  const openDetail = (part: PbiPart) => {
    detailPart.value = part;
  };

  /**
   * 新标签页打开 Windchill 信息页（仅详情页头部入口使用）。
   * 顶层窗口导航允许 URL 携带 Basic 认证凭据（Chrome 仅禁止 iframe 等子资源内嵌凭据）
   */
  const openInfoPage = (part: PbiPart) => {
    if (!part.pageUrl) return;
    window.open(part.pageUrl, "_blank", "noopener");
  };

  // 左上角返回：由产品家谱点击编号进入时（带初始详情部件），详情即本页，直接退出回到家谱，
  // 不经过参数配置列表；正常入口则按 详情层→对比模式→系列列表 逐级返回
  const handleBack = () => {
    if (props.initialDetailPart) {
      emit("back");
      return;
    }
    if (detailPart.value) {
      detailPart.value = null;
    } else if (comparing.value) {
      exitCompare();
    } else {
      emit("back");
    }
  };
</script>

<style lang="less" scoped>
  // 主体：左侧属性过滤面板 + 右侧表格
  .param-body {
    min-height: 0;
  }
</style>

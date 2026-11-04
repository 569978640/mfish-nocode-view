<template>
  <div class="tla-config-page h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部标题（无返回按钮：返回通过关闭系统标签完成） -->
    <div class="mb-4 pb-4 border-b border-gray-200">
      <h2 class="text-xl font-bold m-0">{{ pageTitle }}</h2>
    </div>

    <!-- 顶部筛选栏 -->
    <FilterBar
      v-if="filterProperties.length > 0"
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
        v-model:highlight-diff="highlightDiff"
        v-model:hide-same="hideSame"
        v-model:hide-empty="hideEmpty"
        :count="filteredPartList.length"
        :is-detail="false"
        :comparing="false"
        :compare-parts="compareParts"
        v-model:competitor-path="competitorPath"
        :competitor-tree="competitorTree"
        :load-competitor-data="loadCompetitorData"
        :render-competitor-dropdown="renderCompetitorDropdown"
        @remove="removeCompare"
        @competitor-change="handleCompetitorChange"
        @popup-change="handleCompetitorPopupChange"
        @start="handleStartCompare"
        @clear="clearCompare"
      />

      <!-- 参数配置表格：点击部件编号/开始对比均改为打开独立系统标签 -->
      <ParamTable
        :loading="loading"
        :display-groups="displayGroups"
        :empty-text="emptyText"
        :table-part-list="filteredPartList"
        :table-width="tableWidth"
        :first-column-width="firstColumnWidth"
        :part-column-width="partColumnWidth"
        :col-style="colStyle"
        :wrap-scrolled="wrapScrolled"
        :highlight-diff="highlightDiff"
        :is-diff-row="isDiffRow"
        :is-compared="isCompared"
        :comparing="false"
        :is-detail="false"
        :set-wrap-el="setWrapEl"
        :on-scroll="handleTableScroll"
        @open-detail="handleOpenDetail"
        @toggle-compare="toggleCompare"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiTlaConfigPage" });

  import { computed, reactive } from "vue";
  import { useRoute } from "vue-router";
  import type { PbiPart, PbiClassificationProps } from "@/api/pbi/model";
  import { usePbiData } from "../TLA-Architecture/hooks/usePbiData";
  import { usePartFilter } from "../TLA-Architecture/hooks/usePartFilter";
  import { usePartCompare } from "../TLA-Architecture/hooks/usePartCompare";
  import { useParamTable } from "../TLA-Architecture/hooks/useParamTable";
  import { useCompetitorCascader } from "../TLA-Architecture/hooks/useCompetitorCascader";
  import FilterBar from "../TLA-Architecture/components/filter/FilterBar.vue";
  import ComparePanel from "../TLA-Architecture/components/compare/ComparePanel.vue";
  import ParamTable from "../TLA-Architecture/components/table/ParamTable.vue";
  import { useTlaTabs } from "./hooks/useTlaTabs";

  const route = useRoute();
  /** 路由参数/query 归一化为字符串 */
  const routeText = (value: unknown): string =>
    Array.isArray(value) ? value[0] || "" : value ? String(value) : "";

  // 二级分类上下文：
  // productClassification（二级分类内部名）是标签唯一标识，放在 path 参数中；
  // 一二级分类显示名通过 query 携带。router-view 以 fullPath 为 key，
  // 不同系列是独立组件实例，此处 setup 读取一次即可，切换标签内容天然对应。
  const classification = reactive({
    firstCategory: routeText(route.query.firstCategory),
    secondCategory: routeText(route.query.secondCategory),
    productClassification: routeText(route.params.classification)
  });

  const { openPartTab, openCompareTab } = useTlaTabs();

  // 1. 型号对比集（本页只负责选择，"开始对比"后由独立标签承载对比视图）
  const { compareParts, isCompared, addCompare, toggleCompare, removeCompare, clearCompare, reset: resetCompare } =
    usePartCompare();

  // 2. 配置/部件/筛选属性并行加载，分类切换后重置对比集
  const { loading, configList, partList, filterProperties, filterValues } = usePbiData(
    classification as PbiClassificationProps,
    resetCompare
  );

  // 3. 顶部筛选条件与过滤后的部件列表
  const { filteredPartList, buildSelectOptions, getTextValue, getMultiValue, setFilterValue, resetFilters } =
    usePartFilter({
      configList,
      partList,
      filterProperties,
      filterValues
    });

  /** 页面标题：一级分类 + 二级分类 + 参数配置，分类名为空时自动跳过 */
  const pageTitle = computed(() => {
    const categories = [classification.firstCategory, classification.secondCategory].filter((name) => !!name);
    return `${categories.join(" ")} 参数配置`;
  });

  // 4. 属性分组、行状态、列宽自适应与固定列阴影
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
    tablePartList: filteredPartList
  });

  /** 表格滚动容器模板 ref 回调（组件卸载时 el 为 null） */
  const setWrapEl = (el: unknown) => {
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
    props: classification as PbiClassificationProps,
    partList,
    compareParts,
    addCompare
  });

  /** 点击部件编号：暂存完整部件并打开"部件编号"系统标签 */
  const handleOpenDetail = (part: PbiPart) => {
    openPartTab(part, classification.firstCategory);
  };

  /** 点击开始对比：暂存对比集与分类上下文并打开"型号对比"系统标签 */
  const handleStartCompare = () => {
    if (compareParts.value.length < 2) return;
    openCompareTab(compareParts.value, { ...classification });
  };
</script>

<style lang="less" scoped>
  .param-body {
    min-height: 0;
  }
</style>

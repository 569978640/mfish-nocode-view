<template>
  <div class="tla-compare-page h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部标题（无返回按钮：通过关闭系统标签返回参数配置，原选择状态仍保留） -->
    <div class="mb-4 pb-4 border-b border-gray-200">
      <h2 class="text-xl font-bold m-0">型号对比</h2>
    </div>

    <template v-if="parts.length > 0">
      <!-- 左侧差异开关面板 + 右侧对比表格 -->
      <div class="param-body flex-1 flex overflow-hidden">
        <ComparePanel
          v-model:highlight-diff="highlightDiff"
          v-model:hide-same="hideSame"
          v-model:hide-empty="hideEmpty"
          :count="parts.length"
          :is-detail="false"
          :comparing="true"
          :compare-parts="parts"
          @remove="handleRemove"
          @clear="handleClear"
        />
        <ParamTable
          :loading="configLoading"
          :display-groups="displayGroups"
          empty-text="当前型号暂无可对比的特性参数"
          :table-part-list="parts"
          :table-width="tableWidth"
          :first-column-width="firstColumnWidth"
          :part-column-width="partColumnWidth"
          :col-style="colStyle"
          :wrap-scrolled="wrapScrolled"
          :highlight-diff="highlightDiff"
          :is-diff-row="isDiffRow"
          :is-compared="() => false"
          :comparing="true"
          :is-detail="false"
          :set-wrap-el="setWrapEl"
          :on-scroll="handleTableScroll"
          @open-detail="handleOpenDetail"
        />
      </div>
    </template>

    <!-- 暂无对比型号（用户手动清空后）：可关闭标签返回参数配置重新发起；页面刷新不会清空对比会话 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center gap-4">
      <AEmpty description="暂无可对比的型号，请返回参数配置选择型号后重新发起对比" />
      <AButton type="primary" @click="closeCurrentTab">返回参数配置</AButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiTlaComparePage" });

  import { computed } from "vue";
  import { Button as AButton, Empty as AEmpty } from "ant-design-vue";
  import type { PbiPart } from "@/api/pbi/model";
  import ComparePanel from "../TLA-Architecture/components/compare/ComparePanel.vue";
  import ParamTable from "../TLA-Architecture/components/table/ParamTable.vue";
  import { useTlaParamTable } from "./hooks/useTlaParamTable";
  import {
    clearCompareParts,
    compareSessionContext,
    compareSessionParts,
    removeComparePart,
    useTlaTabs
  } from "./hooks/useTlaTabs";

  // 对比部件与分类上下文均来自"开始对比"时暂存的内存会话，响应式更新
  const parts = compareSessionParts;
  const context = compareSessionContext;
  const firstCategory = computed(() => context.value.firstCategory);

  const {
    configLoading,
    highlightDiff,
    hideSame,
    hideEmpty,
    displayGroups,
    isDiffRow,
    tableWrapRef,
    wrapScrolled,
    handleTableScroll,
    firstColumnWidth,
    partColumnWidth,
    tableWidth,
    colStyle
  } = useTlaParamTable({ firstCategory, parts });

  /** 表格滚动容器模板 ref 回调（组件卸载时 el 为 null） */
  const setWrapEl = (el: unknown) => {
    tableWrapRef.value = (el as HTMLElement | null) ?? undefined;
  };

  const { openPartTab, closeCurrentTab } = useTlaTabs();

  /** 对比标签内移除某个型号胶囊 */
  const handleRemove = (part: PbiPart) => {
    removeComparePart(part.wtPartNumber);
  };

  /** 对比标签内清空全部型号 */
  const handleClear = () => {
    clearCompareParts();
  };

  /** 对比表格中点击部件编号：同样以独立系统标签打开产品详细信息（特性列沿用发起对比的一级分类） */
  const handleOpenDetail = (part: PbiPart) => {
    openPartTab(part, context.value.firstCategory);
  };
</script>

<style lang="less" scoped>
  .param-body {
    min-height: 0;
  }
</style>

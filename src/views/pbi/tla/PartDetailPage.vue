<template>
  <div class="tla-part-page h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部标题：编号,名称 详细特性参数（无返回按钮，通过关闭系统标签返回来源页） -->
    <div class="mb-4 pb-4 border-b border-gray-200">
      <h2 class="text-xl font-bold m-0">{{ headerTitle }}</h2>
    </div>

    <ASpin :spinning="loading" wrapper-class-name="tla-part-spin" class="flex-1 min-h-0 flex flex-col">
      <template v-if="part">
        <div class="param-body flex-1 flex overflow-hidden">
          <!-- 详情模式：仅保留"隐藏暂无内容"开关与信息页入口 -->
          <ComparePanel
            v-model:hide-empty="hideEmpty"
            :count="1"
            :is-detail="true"
            :comparing="false"
            :compare-parts="[]"
          />
          <ParamTable
            :loading="false"
            :display-groups="displayGroups"
            empty-text="该部件暂无可展示的特性参数"
            :table-part-list="parts"
            :table-width="tableWidth"
            :first-column-width="firstColumnWidth"
            :part-column-width="partColumnWidth"
            :col-style="colStyle"
            :wrap-scrolled="wrapScrolled"
            :highlight-diff="false"
            :is-diff-row="() => false"
            :is-compared="() => false"
            :comparing="false"
            :is-detail="true"
            :set-wrap-el="setWrapEl"
            :on-scroll="handleTableScroll"
            @open-info-page="openInfoPage"
          />
        </div>
      </template>
      <div v-else-if="!loading" class="flex-1 flex items-center justify-center">
        <AEmpty description="未查询到该部件的详细信息" />
      </div>
    </ASpin>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiTlaPartDetailPage" });

  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { Spin as ASpin, Empty as AEmpty } from "ant-design-vue";
  import type { PbiPart } from "@/api/pbi/model";
  import { tlaApi } from "@/api/pbi/tla";
  import ComparePanel from "../TLA-Architecture/components/compare/ComparePanel.vue";
  import ParamTable from "../TLA-Architecture/components/table/ParamTable.vue";
  import { useTlaParamTable } from "./hooks/useTlaParamTable";
  import { getPartDetailSession } from "./hooks/useTlaTabs";

  const route = useRoute();
  /** query 参数归一化为字符串 */
  const queryText = (value: unknown): string => (Array.isArray(value) ? value[0] || "" : value ? String(value) : "");

  /** 一级分类（决定特性参数展示列）与部件编号，由来源页跳转时通过 query 带入 */
  const firstCategoryText = queryText(route.query.firstCategory);
  const wtPartNumber = queryText(route.query.wtPartNumber);

  /** 当前展示的部件详情：优先消费内存会话，缺失或编号不匹配时按编号回源 */
  const part = ref<PbiPart | null>(null);
  const loading = ref(true);

  const loadPart = async () => {
    if (!wtPartNumber) {
      loading.value = false;
      return;
    }
    // 来源页已暂存完整部件（参数配置表格/家谱跳转），直接消费避免重复请求
    const cached = getPartDetailSession(wtPartNumber);
    if (cached) {
      part.value = cached;
      loading.value = false;
      return;
    }
    // 页面刷新等会话丢失场景：按编号回源查询
    loading.value = true;
    try {
      part.value = await tlaApi.getPartDetail(firstCategoryText, wtPartNumber);
    } catch (error) {
      console.error("查询产品详细信息失败", error);
      part.value = null;
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadPart);

  const firstCategory = computed(() => firstCategoryText);
  const parts = computed<PbiPart[]>(() => (part.value ? [part.value] : []));

  const {
    hideEmpty,
    displayGroups,
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

  /** 顶部标题："编号,名称 详细特性参数"，名称为空时仅显示编号 */
  const headerTitle = computed(() => {
    if (!part.value) return "产品详细信息";
    const { wtPartNumber: number, name } = part.value;
    return `${name ? `${number},${name}` : number} 详细特性参数`;
  });

  /**
   * 新标签页打开 Windchill 信息页。
   * 顶层窗口导航允许 URL 携带 Basic 认证凭据（Chrome 仅禁止 iframe 等子资源内嵌凭据）
   */
  const openInfoPage = (target: PbiPart) => {
    if (!target.pageUrl) return;
    window.open(target.pageUrl, "_blank", "noopener");
  };
</script>

<style lang="less" scoped>
  .param-body {
    min-height: 0;
  }

  // 加载态容器铺满剩余高度，避免 Spin 只包裹一行内容
  :deep(.tla-part-spin) {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
  }

  :deep(.ant-spin-container) {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
  }
</style>

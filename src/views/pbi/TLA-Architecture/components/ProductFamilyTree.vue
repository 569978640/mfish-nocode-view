<template>
  <div class="family-page h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部栏：返回系列列表 + 家谱标题 -->
    <div class="flex items-center gap-4 mb-3">
      <AButton @click="emit('back')">返回</AButton>
      <h2 class="text-xl font-bold m-0">{{ pageTitle }}</h2>
    </div>

    <!-- 家谱画布：拖拽空白平移、鼠标滚轮缩放（缩放以光标为锚点），右上角提供缩放/适应视图控制按钮 -->
    <div class="family-canvas flex-1 min-h-0">
      <!-- 加载中 -->
      <div v-if="loading" class="family-state flex items-center justify-center h-full">
        <ASpin size="large" tip="家谱数据加载中..." />
      </div>

      <!-- 无有效家谱数据 -->
      <div v-else-if="!root" class="family-state flex items-center justify-center h-full">
        <AEmpty description="暂无产品家谱数据" />
      </div>

      <VueFlow
        v-else
        :nodes="nodes"
        :edges="edges"
        :min-zoom="0.2"
        :max-zoom="2"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :zoom-on-scroll="true"
        :zoom-on-pinch="true"
        :pan-on-drag="true"
        :fit-view-on-init="true"
        :fit-view-options="{ padding: 0.15 }"
        :pro-options="{ hideAttribution: true }"
      >
        <!-- 自定义节点与边（插槽名 = 布局 hook 中定义的 type） -->
        <template #node-familyCard="nodeProps">
          <FamilyNodeCard :data="nodeProps.data" @part-click="handlePartClick" />
        </template>
        <template #edge-familyOrthogonal="edgeProps">
          <FamilyTreeEdge v-bind="edgeProps" />
        </template>
        <Controls position="top-right" :show-interactive="false" />
      </VueFlow>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from "vue";
  import { Button as AButton, Spin as ASpin, Empty as AEmpty, message } from "ant-design-vue";
  import { VueFlow } from "@vue-flow/core";
  import { Controls } from "@vue-flow/controls";
  // Vue Flow 核心样式与缩放控件样式
  import "@vue-flow/core/dist/style.css";
  import "@vue-flow/controls/dist/style.css";
  import type { FamilyTreeNode } from "@/api/pbi/model";
  import { tlaApi } from "@/api/pbi/tla";
  import { useFamilyTreeLayout } from "../hooks/useFamilyTreeLayout";
  import FamilyNodeCard from "./family/FamilyNodeCard.vue";
  import FamilyTreeEdge from "./family/FamilyTreeEdge.vue";

  defineOptions({ name: "TLAArchitectureProductFamilyTree" });
  const props = defineProps<{
    /** 一级分类显示名称 */
    firstCategory: string;
    /** 二级分类显示名称 */
    secondCategory: string;
    /** 二级分类内部名称（PRODUCTCLASSIFICATION），家谱接口入参 */
    productClassification: string;
    /** 家谱视图是否当前展示：组件由 v-show 常驻缓存，仅激活时允许拉取，避免在其他视图产生多余请求 */
    active: boolean;
    /**
     * 加载令牌：仅在系列列表点击"产品家谱"按钮时由父组件递增。
     * 从产品详细信息页返回只切换显隐、不递增令牌，故保留画布与数据不重新加载；
     * 每次从列表进入（含同一系列重复点击、切换其他系列）令牌变化，必定重新拉取。
     */
    reloadKey: number;
  }>();
  const emit = defineEmits<{
    (e: "back"): void;
    /** 点击节点部件编号：向上抛出部件编号，由页面跳转该部件的详细特性参数页 */
    (e: "part-click", wtPartNumber: string): void;
  }>();

  /** 节点卡片点击部件编号：原样向上抛出部件编号 */
  const handlePartClick = (wtPartNumber: string) => {
    emit("part-click", wtPartNumber);
  };

  /** 家谱树根节点，接口返回；null 表示无数据 */
  const root = ref<FamilyTreeNode | null>(null);
  /** 家谱数据加载状态 */
  const loading = ref(false);

  // 树数据 → Vue Flow 节点（叶序紧凑树）与正交折线边
  const { nodes, edges } = useFamilyTreeLayout(root);

  /** 页面标题：一级分类 + 二级分类 + 产品家谱，分类名为空时自动跳过 */
  const pageTitle = computed(() => {
    const categories = [props.firstCategory, props.secondCategory].filter((name) => !!name);
    return `${categories.join(" ")} 产品家谱`;
  });

  /** 加载产品家谱树：按二级分类内部名称调用后端自底向上递归接口 */
  const loadFamilyTree = async () => {
    const classification = props.productClassification;
    if (!classification) {
      message.error("缺少二级分类信息，无法查询产品家谱");
      return;
    }
    loading.value = true;
    try {
      root.value = await tlaApi.getFamilyTree(classification);
    } catch (error) {
      // defHttp 已统一提示错误，这里保证画布进入空态而非持续 loading
      console.error("加载产品家谱失败", error);
      root.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 组件由页面以 v-show 常驻缓存（进入详情不销毁），加载时机完全由 reloadKey 令牌驱动：
   * - 系列列表点击"产品家谱"：父组件递增令牌，触发重新拉取（同系列重复点、换系列均如此）；
   * - 产品详细信息页返回：仅 active 由 false 变 true、令牌不变，不触发，保留原画布与数据。
   * immediate 保证首次挂载即生效，但初始 active 为 false（停留在系列列表），不会产生多余请求。
   */
  watch(
    () => props.reloadKey,
    () => {
      if (props.active) {
        loadFamilyTree();
      }
    },
    { immediate: true }
  );
</script>

<style lang="less" scoped>
  .family-canvas {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
  }

  .family-state {
    color: #9ca3af;
  }

  // 画布各层（含平移拖拽过程）统一使用默认箭头光标，不显示抓手
  .family-canvas :deep(.vue-flow__pane),
  .family-canvas :deep(.vue-flow__pane.dragging),
  .family-canvas :deep(.vue-flow__transformationpane),
  .family-canvas :deep(.vue-flow__nodes) {
    cursor: default;
  }

  // 节点在不可拖拽/不可选择且未注册节点事件时，Vue Flow 会内联 pointer-events:none，
  // 导致鼠标事件穿透节点、卡片 hover 效果无法触发；这里强制恢复命中（拖拽仍由 nodes-draggable=false 禁止）
  .family-canvas :deep(.vue-flow__node) {
    pointer-events: all !important;
    cursor: default;
  }

  // 右上角控制按钮组圆角与阴影微调
  .family-canvas :deep(.vue-flow__controls) {
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
    overflow: hidden;
  }

  .family-canvas :deep(.vue-flow__controls-button) {
    width: 30px;
    height: 30px;
    border-bottom: 1px solid #f0f0f0;
  }
</style>

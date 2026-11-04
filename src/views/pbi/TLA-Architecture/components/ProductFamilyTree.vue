<template>
  <div class="family-page h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部栏：图谱标题（组件已独立为系统标签页，无返回按钮，关闭标签即返回首页） -->
    <div class="flex items-center gap-4 mb-3">
      <h2 class="text-xl font-bold m-0">{{ pageTitle }}</h2>
    </div>

    <!-- 图谱画布：拖拽空白平移、鼠标滚轮缩放（缩放以光标为锚点），右上角提供缩放/适应视图控制按钮 -->
    <div class="family-canvas flex-1 min-h-0">
      <!-- 加载中 -->
      <div v-if="loading" class="family-state flex items-center justify-center h-full">
        <ASpin size="large" tip="图谱数据加载中..." />
      </div>

      <!-- 无有效图谱数据 -->
      <div v-else-if="!root" class="family-state flex items-center justify-center h-full">
        <AEmpty description="暂无产品图谱数据" />
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
  import { computed, onMounted, ref } from "vue";
  import { Spin as ASpin, Empty as AEmpty, message } from "ant-design-vue";
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
    /** 二级分类内部名称（PRODUCTCLASSIFICATION），图谱接口入参 */
    productClassification: string;
  }>();
  const emit = defineEmits<{
    /** 点击节点部件编号：向上抛出部件编号，由页面打开该部件的"部件编号"系统标签 */
    (e: "part-click", wtPartNumber: string): void;
  }>();

  /** 节点卡片点击部件编号：原样向上抛出部件编号 */
  const handlePartClick = (wtPartNumber: string) => {
    emit("part-click", wtPartNumber);
  };

  /** 图谱树根节点，接口返回；null 表示无数据 */
  const root = ref<FamilyTreeNode | null>(null);
  /** 图谱数据加载状态 */
  const loading = ref(false);

  // 树数据 → Vue Flow 节点（叶序紧凑树）与正交折线边
  const { nodes, edges } = useFamilyTreeLayout(root);

  /** 页面标题：一级分类 + 二级分类 + 产品图谱，分类名为空时自动跳过 */
  const pageTitle = computed(() => {
    const categories = [props.firstCategory, props.secondCategory].filter((name) => !!name);
    return `${categories.join(" ")} 产品图谱`;
  });

  /** 加载产品图谱树：按二级分类内部名称调用后端自底向上递归接口 */
  const loadFamilyTree = async () => {
    const classification = props.productClassification;
    if (!classification) {
      message.error("缺少二级分类信息，无法查询产品图谱");
      return;
    }
    loading.value = true;
    try {
      root.value = await tlaApi.getFamilyTree(classification);
    } catch (error) {
      // defHttp 已统一提示错误，这里保证画布进入空态而非持续 loading
      console.error("加载产品图谱失败", error);
      root.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 图谱已独立为系统标签页：每个系列对应独立 query 的标签实例（keepAlive 缓存），
   * 挂载即加载一次；同系列重复点击入口时同路径标签复用、以新 query 重新挂载加载，
   * 标签切换往返时由 keepAlive 保留画布与数据，不再需要显隐/令牌机制。
   */
  onMounted(() => {
    loadFamilyTree();
  });
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

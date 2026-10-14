<template>
  <!-- 父子连线：从父节点底部中点垂直下行至层间中点，水平转折到子节点中轴，再垂直下行至子节点顶部 -->
  <BaseEdge :id="id" :path="orthogonalPath" :style="edgeStyle" />
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { BaseEdge, type EdgeProps } from "@vue-flow/core";

  defineOptions({ name: "FamilyTreeEdge" });
  const props = defineProps<EdgeProps>();

  /** 浅灰直角折线样式，无箭头（衍生关系由上下层级表达） */
  const edgeStyle = {
    stroke: "#c9cedb",
    strokeWidth: 1.5,
    fill: "none"
  };

  /** 正交折线路径（同一父节点的所有子边水平段位于同一 y，视觉上形成贯穿的家谱分支线） */
  const orthogonalPath = computed(() => {
    const midY = (props.sourceY + props.targetY) / 2;
    return `M ${props.sourceX} ${props.sourceY} V ${midY} H ${props.targetX} V ${props.targetY}`;
  });
</script>

<template>
  <ProductFamilyTree
    :first-category="classification.firstCategory"
    :second-category="classification.secondCategory"
    :product-classification="classification.productClassification"
    @part-click="handlePartClick"
  />
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiTlaFamilyPage" });

  import { reactive, ref } from "vue";
  import { useRoute } from "vue-router";
  import { message } from "ant-design-vue";
  import { tlaApi } from "@/api/pbi/tla";
  import ProductFamilyTree from "../TLA-Architecture/components/ProductFamilyTree.vue";
  import { useTlaTabs } from "./hooks/useTlaTabs";

  const route = useRoute();
  /** query 参数归一化为字符串 */
  const queryText = (value: unknown): string => (Array.isArray(value) ? value[0] || "" : value ? String(value) : "");

  // 二级分类上下文：由首页系列卡片跳转时通过 query 带入
  const classification = reactive({
    firstCategory: queryText(route.query.firstCategory),
    secondCategory: queryText(route.query.secondCategory),
    productClassification: queryText(route.query.productClassification)
  });

  const { openPartTab } = useTlaTabs();
  /** 家谱跳转详情请求进行中标记，防止重复点击 */
  const partOpening = ref(false);

  /**
   * 点击家谱节点部件编号：按编号拉取完整特性参数后打开"部件编号"系统标签。
   * 特性参数展示列由一级分类决定，故携带当前系列的 firstCategory。
   */
  const handlePartClick = async (wtPartNumber: string) => {
    if (!wtPartNumber || partOpening.value) return;
    partOpening.value = true;
    const hide = message.loading("正在打开产品详细信息...", 0);
    try {
      const part = await tlaApi.getPartDetail(classification.firstCategory, wtPartNumber);
      if (!part) {
        message.warning("未查询到该部件的详细信息");
        return;
      }
      openPartTab(part, classification.firstCategory);
    } catch (error) {
      console.error("打开产品详细信息失败", error);
    } finally {
      hide();
      partOpening.value = false;
    }
  };
</script>

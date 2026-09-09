<!--
 @description: 产品库查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="产品库信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { ProductDesc } from "./product.data";

  defineOptions({ name: "ProductViewModal" });
  const productData = ref();
  const productDesc = new ProductDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    productData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: productData,
    schema: productDesc.viewSchema,
    column: 2
  });
</script>

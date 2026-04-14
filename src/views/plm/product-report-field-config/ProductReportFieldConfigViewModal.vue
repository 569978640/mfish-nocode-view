<!--
 @description: PLM产品报表查看
 @author: mfish
 @date: 2026-04-14
 @version: V2.3.0
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="PLM产品报表信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { ProductReportFieldConfigDesc } from "./productReportFieldConfig.data";

  defineOptions({ name: "ProductReportFieldConfigViewModal" });
  const productReportFieldConfigData = ref();
  const productReportFieldConfigDesc = new ProductReportFieldConfigDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    productReportFieldConfigData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: productReportFieldConfigData,
    schema: productReportFieldConfigDesc.viewSchema,
    column: 2
  });
</script>

<!--
 @description: 迭代关系查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="迭代关系信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { IteraiteLinkDesc } from "./iteraiteLink.data";

  defineOptions({ name: "IteraiteLinkViewModal" });
  const iteraiteLinkData = ref();
  const iteraiteLinkDesc = new IteraiteLinkDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    iteraiteLinkData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: iteraiteLinkData,
    schema: iteraiteLinkDesc.viewSchema,
    column: 2
  });
</script>

<!--
 @description: 文档小版本查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="文档小版本信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { DocumentDesc } from "./document.data";

  defineOptions({ name: "DocumentViewModal" });
  const documentData = ref();
  const documentDesc = new DocumentDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    documentData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: documentData,
    schema: documentDesc.viewSchema,
    column: 2
  });
</script>

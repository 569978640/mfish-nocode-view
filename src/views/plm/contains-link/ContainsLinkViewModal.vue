<!--
 @description: 包含关系查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="包含关系信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { ContainsLinkDesc } from "./containsLink.data";

  defineOptions({ name: "ContainsLinkViewModal" });
  const containsLinkData = ref();
  const containsLinkDesc = new ContainsLinkDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    containsLinkData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: containsLinkData,
    schema: containsLinkDesc.viewSchema,
    column: 2
  });
</script>

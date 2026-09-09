<!--
 @description: 部件主数据查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="部件主数据信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { PartMasterDesc } from "./partMaster.data";

  defineOptions({ name: "PartMasterViewModal" });
  const partMasterData = ref();
  const partMasterDesc = new PartMasterDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    partMasterData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: partMasterData,
    schema: partMasterDesc.viewSchema,
    column: 2
  });
</script>

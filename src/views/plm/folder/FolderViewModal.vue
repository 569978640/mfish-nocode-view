<!--
 @description: 文件夹查看
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="文件夹信息">
    <Description @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { Description, useDescription } from "@mfish/core/components/Description";
  import { ref } from "vue";
  import { FolderDesc } from "./folder.data";

  defineOptions({ name: "FolderViewModal" });
  const folderData = ref();
  const folderDesc = new FolderDesc();
  const [registerModal, { setModalProps }] = useModalInner(async (data) => {
    setModalProps({
      confirmLoading: false,
      width: "800px",
      cancelText: "关闭",
      showOkBtn: false
    });
    folderData.value = data.record;
  });
  const [registerDesc] = useDescription({
    data: folderData,
    schema: folderDesc.viewSchema,
    column: 2
  });
</script>

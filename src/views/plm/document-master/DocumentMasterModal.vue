<!--
 @description: 文档主数据
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" @submit="handleSubmit" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { ref, computed, unref } from "vue";
  import { BasicForm, useForm } from "@mfish/core/components/Form";
  import { documentMasterFormSchema } from "./documentMaster.data";
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { insertDocumentMaster, updateDocumentMaster } from "@/api/plm/DocumentMaster";

  defineOptions({ name: "DocumentMasterModal" });
  const emit = defineEmits(["success", "register"]);
  const isUpdate = ref(true);
  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    name: "model_form_item",
    labelWidth: 100,
    baseColProps: { span: 12 },
    schemas: documentMasterFormSchema,
    showActionButtonGroup: false,
    autoSubmitOnEnter: true
  });
  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    resetFields().then();
    setModalProps({ confirmLoading: false, width: "800px" });
    isUpdate.value = !!data?.isUpdate;
    if (unref(isUpdate)) {
      setFieldsValue({
        ...data.record
      }).then();
    }
  });
  const getTitle = computed(() => (unref(isUpdate) ? "编辑文档主数据" : "新增文档主数据"));

  async function handleSubmit() {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    if (unref(isUpdate)) {
      saveDocumentMaster(updateDocumentMaster, values);
    } else {
      saveDocumentMaster(insertDocumentMaster, values);
    }
  }

  function saveDocumentMaster(save, values) {
    save(values)
      .then(() => {
        emit("success");
        closeModal();
      })
      .finally(() => {
        setModalProps({ confirmLoading: false });
      });
  }
</script>

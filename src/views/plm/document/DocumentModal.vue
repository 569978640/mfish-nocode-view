<!--
 @description: 文档小版本
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
  import { documentFormSchema } from "./document.data";
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { insertDocument, updateDocument } from "@/api/plm/Document";

  defineOptions({ name: "DocumentModal" });
  const emit = defineEmits(["success", "register"]);
  const isUpdate = ref(true);
  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    name: "model_form_item",
    labelWidth: 100,
    baseColProps: { span: 12 },
    schemas: documentFormSchema,
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
  const getTitle = computed(() => (unref(isUpdate) ? "编辑文档小版本" : "新增文档小版本"));

  async function handleSubmit() {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    if (unref(isUpdate)) {
      saveDocument(updateDocument, values);
    } else {
      saveDocument(insertDocument, values);
    }
  }

  function saveDocument(save, values) {
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

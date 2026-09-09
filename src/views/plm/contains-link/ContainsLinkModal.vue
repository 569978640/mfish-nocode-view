<!--
 @description: 包含关系
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
  import { containsLinkFormSchema } from "./containsLink.data";
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { insertContainsLink, updateContainsLink } from "@/api/plm/ContainsLink";

  defineOptions({ name: "ContainsLinkModal" });
  const emit = defineEmits(["success", "register"]);
  const isUpdate = ref(true);
  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    name: "model_form_item",
    labelWidth: 100,
    baseColProps: { span: 12 },
    schemas: containsLinkFormSchema,
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
  const getTitle = computed(() => (unref(isUpdate) ? "编辑包含关系" : "新增包含关系"));

  async function handleSubmit() {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    if (unref(isUpdate)) {
      saveContainsLink(updateContainsLink, values);
    } else {
      saveContainsLink(insertContainsLink, values);
    }
  }

  function saveContainsLink(save, values) {
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

<!--
 @description: PLM产品报表
 @author: mfish
 @date: 2026-04-14
 @version: V2.3.0
-->
<template>
  <BasicModal v-bind="$attrs" @register="registerModal" :title="getTitle" @ok="handleSubmit">
    <BasicForm @register="registerForm" @submit="handleSubmit" />
  </BasicModal>
</template>
<script lang="ts" setup>
  import { ref, computed, unref } from "vue";
  import { BasicForm, useForm } from "@mfish/core/components/Form";
  import { productReportFieldConfigFormSchema } from "./productReportFieldConfig.data";
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { insertProductReportFieldConfig, updateProductReportFieldConfig } from "@/api/plm/ProductReportFieldConfig";

  defineOptions({ name: "ProductReportFieldConfigModal" });
  const emit = defineEmits(["success", "register"]);
  const isUpdate = ref(true);
  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    name: "model_form_item",
    labelWidth: 100,
    baseColProps: { span: 12 },
    schemas: productReportFieldConfigFormSchema,
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
  const getTitle = computed(() => (unref(isUpdate) ? "编辑PLM产品报表" : "新增PLM产品报表"));

  async function handleSubmit() {
    const values = await validate();
    setModalProps({ confirmLoading: true });
    if (unref(isUpdate)) {
      saveProductReportFieldConfig(updateProductReportFieldConfig, values);
    } else {
      saveProductReportFieldConfig(insertProductReportFieldConfig, values);
    }
  }

  function saveProductReportFieldConfig(save, values) {
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

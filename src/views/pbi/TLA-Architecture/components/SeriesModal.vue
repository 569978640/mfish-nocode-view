<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="维护产品系列信息" @ok="handleSubmit">
    <BasicForm @register="registerForm">
      <!-- 自定义上传图片插槽 -->
      <template #logoImg="{ model, field }">
        <Upload
          v-model:file-list="logoList"
          name="file"
          :max-count="1"
          accept="image/*"
          list-type="picture-card"
          :custom-request="uploadLogo"
          @preview="handlePreview"
        >
          <div v-if="logoList.length === 0">
            <Icon icon="ant-design:plus-outlined" />
            <div style="margin-top: 8px">上传图片</div>
          </div>
        </Upload>
        <Modal :open="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
          <img alt="预览图片" style="width: 100%" :src="previewImage" />
        </Modal>
      </template>
    </BasicForm>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { ref, unref, watch } from "vue";
  import { Upload, Modal, type UploadProps } from "ant-design-vue";
  import { Icon } from "@mfish/core/components/Icon";
  import { BasicModal, useModalInner } from "@mfish/core/components/Modal";
  import { BasicForm, useForm } from "@mfish/core/components/Form";
  import { tlaApi } from "@/api/pbi/tla";
  import { uploadApi } from "@mfish/core/api";

  const emit = defineEmits(["success", "register"]);
  const isUpdate = ref(false);

  // ---------- 图片上传相关逻辑 ----------
  const logoList = ref<UploadProps["fileList"]>([]);
  const previewVisible = ref(false);
  const previewImage = ref("");
  const previewTitle = ref("");

  const handleCancel = () => {
    previewVisible.value = false;
    previewTitle.value = "";
  };

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      // 本地预览处理
      const getBase64 = (f: File) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.addEventListener("load", () => resolve(reader.result));
          reader.addEventListener("error", (error) => reject(error));
        });
      };
      file.preview = await getBase64(file.originFileObj);
    }
    previewImage.value = file.url || file.preview;
    previewVisible.value = true;
    previewTitle.value = file.name || file.url.slice(Math.max(0, file.url.lastIndexOf("/") + 1));
  };

  const uploadLogo = (e: any) => {
    uploadApi({ file: e.file }, (_) => {})
      .then((res) => {
        if (res.fileUrl) {
          logoList.value = [
            {
              uid: res.id || Date.now().toString(),
              name: res.fileName,
              status: "done",
              url: res.fileUrl
            }
          ];
          setFieldsValue({ imageUrl: res.fileUrl });
        }
        e.onSuccess(res, e.file);
      })
      .catch((error) => {
        e.onError(error);
      });
  };

  // 同步列表变更
  watch(
    () => logoList.value,
    (newVal) => {
      if (!newVal || newVal.length === 0) {
        setFieldsValue({ imageUrl: "" });
      }
    },
    { deep: true }
  );

  const [registerForm, { resetFields, setFieldsValue, validate }] = useForm({
    labelWidth: 100,
    baseColProps: { span: 24 },
    schemas: [
      {
        field: "id",
        label: "ID",
        component: "Input",
        show: false
      },
      {
        field: "categoryId",
        label: "categoryId",
        component: "Input",
        show: false
      },
      {
        field: "name",
        label: "系列名称",
        component: "Input",
        required: true
      },
      {
        field: "description",
        label: "描述",
        component: "InputTextArea",
        required: true
      },
      {
        field: "imageUrl",
        label: "上传图片",
        component: "Input",
        slot: "logoImg",
        required: true
      }
    ],
    showActionButtonGroup: false,
    actionColOptions: { span: 23 }
  });

  const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
    await resetFields();
    logoList.value = [];
    setModalProps({ confirmLoading: false });
    isUpdate.value = !!data?.isUpdate;

    if (unref(isUpdate)) {
      await setFieldsValue({ ...data.record });
      if (data.record.imageUrl) {
        logoList.value = [
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: data.record.imageUrl
          }
        ];
      }
    } else {
      await setFieldsValue({ categoryId: data.categoryId });
    }
  });

  async function handleSubmit() {
    try {
      const values = await validate();
      setModalProps({ confirmLoading: true });
      await tlaApi.saveSeries(values);
      closeModal();
      emit("success");
    } finally {
      setModalProps({ confirmLoading: false });
    }
  }
</script>

<!--
 @description: PLM产品报表
 @author: mfish
 @date: 2026-04-14
 @version: V2.3.0
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:productReportFieldConfig:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:productReportFieldConfig:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:productReportFieldConfig:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:productReportFieldConfig:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:productReportFieldConfig:update',
                tooltip: '修改'
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                },
                auth: 'plm:productReportFieldConfig:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ProductReportFieldConfigModal @register="registerModal" @success="handleSuccess" />
    <ProductReportFieldConfigViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchProductReportFieldConfig, deleteProductReportFieldConfig, exportProductReportFieldConfig, getProductReportFieldConfigList } from "@/api/plm/ProductReportFieldConfig";
  import ProductReportFieldConfigModal from "./ProductReportFieldConfigModal.vue";
  import ProductReportFieldConfigViewModal from "./ProductReportFieldConfigViewModal.vue";
  import { columns, searchFormSchema } from "./productReportFieldConfig.data";
  import { ProductReportFieldConfig } from "@/api/plm/model/ProductReportFieldConfigModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "ProductReportFieldConfigManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "PLM产品报表列表",
    api: getProductReportFieldConfigList,
    rowKey: "id",
    columns,
    formConfig: {
      name: "search_form_item",
      labelWidth: 100,
      schemas: searchFormSchema,
      autoSubmitOnEnter: true
    },
    useSearchForm: true,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: false,
    rowSelection: {
      onChange: (rowKeys: any[]) => {
        selectedRowKeys.value = rowKeys;
      }
    },
    actionColumn: {
      width: 120,
      title: "操作",
      dataIndex: "action"
    }
  });
  const { createMessage } = useMessage();
  /**
   * 新建
   */
  function handleCreate() {
    openModal(true, {
      isUpdate: false
    });
  }

  /**
   *  导出自动生成支持导出1000条可自行修改
   */
  function handleExport() {
    exportProductReportFieldConfig({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param productReportFieldConfig PLM产品报表对象
   */
  function handleQuery(productReportFieldConfig: ProductReportFieldConfig) {
    openViewModal(true, { record: productReportFieldConfig });
  }

  /**
   * 修改
   * @param productReportFieldConfig PLM产品报表对象
   */
  function handleEdit(productReportFieldConfig: ProductReportFieldConfig) {
    openModal(true, {
      record: productReportFieldConfig,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param productReportFieldConfig PLM产品报表对象
   */
  function handleDelete(productReportFieldConfig: ProductReportFieldConfig) {
    if (productReportFieldConfig.id) {
      deleteProductReportFieldConfig(productReportFieldConfig.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchProductReportFieldConfig(selectedRowKeys.value.join(",")).then(() => {
        handleSuccess();
      });
    } else {
      createMessage.warning("请勾选要删除的数据");
    }
  }

  /**
   * 处理完成
   */
  function handleSuccess() {
    reload();
  }
</script>

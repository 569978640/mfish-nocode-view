<!--
 @description: 文档主数据
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:documentMaster:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:documentMaster:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:documentMaster:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:documentMaster:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:documentMaster:update',
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
                auth: 'plm:documentMaster:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DocumentMasterModal @register="registerModal" @success="handleSuccess" />
    <DocumentMasterViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchDocumentMaster, deleteDocumentMaster, exportDocumentMaster, getDocumentMasterList } from "@/api/plm/DocumentMaster";
  import DocumentMasterModal from "./DocumentMasterModal.vue";
  import DocumentMasterViewModal from "./DocumentMasterViewModal.vue";
  import { columns, searchFormSchema } from "./documentMaster.data";
  import { DocumentMaster } from "@/api/plm/model/DocumentMasterModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "DocumentMasterManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "文档主数据列表",
    api: getDocumentMasterList,
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
    exportDocumentMaster({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param documentMaster 文档主数据对象
   */
  function handleQuery(documentMaster: DocumentMaster) {
    openViewModal(true, { record: documentMaster });
  }

  /**
   * 修改
   * @param documentMaster 文档主数据对象
   */
  function handleEdit(documentMaster: DocumentMaster) {
    openModal(true, {
      record: documentMaster,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param documentMaster 文档主数据对象
   */
  function handleDelete(documentMaster: DocumentMaster) {
    if (documentMaster.id) {
      deleteDocumentMaster(documentMaster.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchDocumentMaster(selectedRowKeys.value.join(",")).then(() => {
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

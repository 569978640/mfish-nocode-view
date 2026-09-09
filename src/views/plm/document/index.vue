<!--
 @description: 文档小版本
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:document:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:document:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:document:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:document:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:document:update',
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
                auth: 'plm:document:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DocumentModal @register="registerModal" @success="handleSuccess" />
    <DocumentViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchDocument, deleteDocument, exportDocument, getDocumentList } from "@/api/plm/Document";
  import DocumentModal from "./DocumentModal.vue";
  import DocumentViewModal from "./DocumentViewModal.vue";
  import { columns, searchFormSchema } from "./document.data";
  import { Document } from "@/api/plm/model/DocumentModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "DocumentManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "文档小版本列表",
    api: getDocumentList,
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
    exportDocument({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param document 文档小版本对象
   */
  function handleQuery(document: Document) {
    openViewModal(true, { record: document });
  }

  /**
   * 修改
   * @param document 文档小版本对象
   */
  function handleEdit(document: Document) {
    openModal(true, {
      record: document,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param document 文档小版本对象
   */
  function handleDelete(document: Document) {
    if (document.id) {
      deleteDocument(document.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchDocument(selectedRowKeys.value.join(",")).then(() => {
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

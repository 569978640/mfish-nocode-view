<!--
 @description: 包含关系
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:containsLink:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:containsLink:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:containsLink:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:containsLink:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:containsLink:update',
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
                auth: 'plm:containsLink:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ContainsLinkModal @register="registerModal" @success="handleSuccess" />
    <ContainsLinkViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchContainsLink, deleteContainsLink, exportContainsLink, getContainsLinkList } from "@/api/plm/ContainsLink";
  import ContainsLinkModal from "./ContainsLinkModal.vue";
  import ContainsLinkViewModal from "./ContainsLinkViewModal.vue";
  import { columns, searchFormSchema } from "./containsLink.data";
  import { ContainsLink } from "@/api/plm/model/ContainsLinkModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "ContainsLinkManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "包含关系列表",
    api: getContainsLinkList,
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
    exportContainsLink({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param containsLink 包含关系对象
   */
  function handleQuery(containsLink: ContainsLink) {
    openViewModal(true, { record: containsLink });
  }

  /**
   * 修改
   * @param containsLink 包含关系对象
   */
  function handleEdit(containsLink: ContainsLink) {
    openModal(true, {
      record: containsLink,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param containsLink 包含关系对象
   */
  function handleDelete(containsLink: ContainsLink) {
    if (containsLink.id) {
      deleteContainsLink(containsLink.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchContainsLink(selectedRowKeys.value.join(",")).then(() => {
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

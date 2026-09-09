<!--
 @description: 迭代关系
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:iteraiteLink:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:iteraiteLink:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:iteraiteLink:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:iteraiteLink:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:iteraiteLink:update',
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
                auth: 'plm:iteraiteLink:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <IteraiteLinkModal @register="registerModal" @success="handleSuccess" />
    <IteraiteLinkViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchIteraiteLink, deleteIteraiteLink, exportIteraiteLink, getIteraiteLinkList } from "@/api/plm/IteraiteLink";
  import IteraiteLinkModal from "./IteraiteLinkModal.vue";
  import IteraiteLinkViewModal from "./IteraiteLinkViewModal.vue";
  import { columns, searchFormSchema } from "./iteraiteLink.data";
  import { IteraiteLink } from "@/api/plm/model/IteraiteLinkModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "IteraiteLinkManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "迭代关系列表",
    api: getIteraiteLinkList,
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
    exportIteraiteLink({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param iteraiteLink 迭代关系对象
   */
  function handleQuery(iteraiteLink: IteraiteLink) {
    openViewModal(true, { record: iteraiteLink });
  }

  /**
   * 修改
   * @param iteraiteLink 迭代关系对象
   */
  function handleEdit(iteraiteLink: IteraiteLink) {
    openModal(true, {
      record: iteraiteLink,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param iteraiteLink 迭代关系对象
   */
  function handleDelete(iteraiteLink: IteraiteLink) {
    if (iteraiteLink.id) {
      deleteIteraiteLink(iteraiteLink.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchIteraiteLink(selectedRowKeys.value.join(",")).then(() => {
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

<!--
 @description: 部件主数据
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:partMaster:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:partMaster:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:partMaster:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:partMaster:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:partMaster:update',
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
                auth: 'plm:partMaster:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <PartMasterModal @register="registerModal" @success="handleSuccess" />
    <PartMasterViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchPartMaster, deletePartMaster, exportPartMaster, getPartMasterList } from "@/api/plm/PartMaster";
  import PartMasterModal from "./PartMasterModal.vue";
  import PartMasterViewModal from "./PartMasterViewModal.vue";
  import { columns, searchFormSchema } from "./partMaster.data";
  import { PartMaster } from "@/api/plm/model/PartMasterModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "PartMasterManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "部件主数据列表",
    api: getPartMasterList,
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
    exportPartMaster({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param partMaster 部件主数据对象
   */
  function handleQuery(partMaster: PartMaster) {
    openViewModal(true, { record: partMaster });
  }

  /**
   * 修改
   * @param partMaster 部件主数据对象
   */
  function handleEdit(partMaster: PartMaster) {
    openModal(true, {
      record: partMaster,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param partMaster 部件主数据对象
   */
  function handleDelete(partMaster: PartMaster) {
    if (partMaster.id) {
      deletePartMaster(partMaster.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchPartMaster(selectedRowKeys.value.join(",")).then(() => {
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

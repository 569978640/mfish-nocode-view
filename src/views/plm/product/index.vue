<!--
 @description: 产品库
 @author: mfish
 @date: 2026-04-17
 @version: V2.3.1
-->
<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <AButton type="primary" @click="handleCreate" v-auth="'plm:product:insert'">新增</AButton>
        <AButton color="warning" @click="handleExport" v-auth="'plm:product:export'">导出</AButton>
        <AButton color="error" @click="handleBatchDelete" v-auth="'plm:product:delete'">批量删除</AButton>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:info-circle-outlined',
                onClick: handleQuery.bind(null, record),
                auth: 'plm:product:query',
                color: 'success',
                tooltip: '查看'
              },
              {
                icon: 'ant-design:edit-outlined',
                onClick: handleEdit.bind(null, record),
                auth: 'plm:product:update',
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
                auth: 'plm:product:delete',
                tooltip: '删除'
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <ProductModal @register="registerModal" @success="handleSuccess" />
    <ProductViewModal @register="registerViewModal" />
  </div>
</template>
<script lang="ts" setup>
  import { BasicTable, useTable, TableAction } from "@mfish/core/components/Table";
  import { useModal } from "@mfish/core/components/Modal";
  import { Button as AButton } from "@mfish/core/components/Button";
  import { deleteBatchProduct, deleteProduct, exportProduct, getProductList } from "@/api/plm/Product";
  import ProductModal from "./ProductModal.vue";
  import ProductViewModal from "./ProductViewModal.vue";
  import { columns, searchFormSchema } from "./product.data";
  import { Product } from "@/api/plm/model/ProductModel";
  import { ref } from "vue";
  import { useMessage } from "@mfish/core/hooks";


  defineOptions({ name: "ProductManagement" });
  const [registerModal, { openModal }] = useModal();
  const [registerViewModal, { openModal: openViewModal }] = useModal();
  const selectedRowKeys = ref<any[]>([]);
  const [registerTable, { reload, getForm }] = useTable({
    title: "产品库列表",
    api: getProductList,
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
    exportProduct({ ...getForm().getFieldsValue(), pageNum: 1, pageSize: 1000 });
  }

  /**
   * 查看
   * @param product 产品库对象
   */
  function handleQuery(product: Product) {
    openViewModal(true, { record: product });
  }

  /**
   * 修改
   * @param product 产品库对象
   */
  function handleEdit(product: Product) {
    openModal(true, {
      record: product,
      isUpdate: true
    });
  }

  /**
   * 删除
   * @param product 产品库对象
   */
  function handleDelete(product: Product) {
    if (product.id) {
      deleteProduct(product.id).then(() => {
        handleSuccess();
      });
    }
  }

  /**
   * 批量删除
   */
  function handleBatchDelete() {
    if (selectedRowKeys.value.length > 0) {
      deleteBatchProduct(selectedRowKeys.value.join(",")).then(() => {
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

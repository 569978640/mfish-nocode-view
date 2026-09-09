import { BasicColumn, FormSchema } from "@mfish/core/components/Table";
import { DescItem } from "@mfish/core/components/Description";

/**
 * @description: 产品库
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export const columns: BasicColumn[] = [
  {
    title: "类型",
    dataIndex: "type",
    width: 120
  },
  {
    title: "产品名称",
    dataIndex: "name",
    width: 120
  },
];
export const searchFormSchema: FormSchema[] = [
  {
    field: "id",
    label: "产品ID",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
  {
    field: "name",
    label: "产品名称",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
  {
    field: "create_by",
    label: "",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
];
export const productFormSchema: FormSchema[] = [
  {
    field: "id",
    label: "唯一ID",
    component: "Input",
    show: false
  },
  {
    field: "type",
    label: "类型",
    component: "Input",
  },
  {
    field: "name",
    label: "产品名称",
    component: "Input",
  },
];

export class ProductDesc {
  viewSchema: DescItem[] = [
    {
      label: "id",
      field: "id",
      show: () => false
    },
    {
      field: "type",
      label: "类型"
    },
    {
      field: "name",
      label: "产品名称"
    },
  ];
}

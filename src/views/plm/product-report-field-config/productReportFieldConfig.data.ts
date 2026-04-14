import { BasicColumn, FormSchema } from "@mfish/core/components/Table";
import { DescItem } from "@mfish/core/components/Description";

/**
 * @description: 产品系列报表字段配置
 * @author: mfish
 * @date: 2026-04-15
 * @version: V2.3.0
 */
export const columns: BasicColumn[] = [
  {
    title: "编号",
    dataIndex: "number",
    width: 120
  },
  {
    title: "字段",
    dataIndex: "field",
    width: 120
  },
  {
    title: "类型",
    dataIndex: "type",
    width: 120
  },
];
export const searchFormSchema: FormSchema[] = [
  {
    field: "number",
    label: "编号",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
];
export const productReportFieldConfigFormSchema: FormSchema[] = [
  {
    field: "id",
    label: "唯一ID",
    component: "Input",
    show: false
  },
  {
    field: "number",
    label: "编号",
    component: "Input",
    required: true
  },
  {
    field: "field",
    label: "字段",
    component: "Input",
    required: true
  },
  {
    field: "type",
    label: "类型",
    component: "Input",
    required: true
  },
];

export class ProductReportFieldConfigDesc {
  viewSchema: DescItem[] = [
    {
      label: "id",
      field: "id",
      show: () => false
    },
    {
      field: "number",
      label: "编号"
    },
    {
      field: "field",
      label: "字段"
    },
    {
      field: "type",
      label: "类型"
    },
  ];
}

import { BasicColumn, FormSchema } from "@mfish/core/components/Table";
import { DescItem } from "@mfish/core/components/Description";

/**
 * @description: 迭代关系
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export const columns: BasicColumn[] = [
  {
    title: "",
    dataIndex: "type",
    width: 120
  },
  {
    title: "",
    dataIndex: "fromId",
    width: 120
  },
  {
    title: "",
    dataIndex: "fromType",
    width: 120
  },
  {
    title: "",
    dataIndex: "toId",
    width: 120
  },
  {
    title: "",
    dataIndex: "toType",
    width: 120
  },
];
export const searchFormSchema: FormSchema[] = [
];
export const iteraiteLinkFormSchema: FormSchema[] = [
  {
    field: "id",
    label: "唯一ID",
    component: "Input",
    show: false
  },
  {
    field: "type",
    label: "",
    component: "Input",
  },
  {
    field: "fromId",
    label: "",
    component: "Input",
  },
  {
    field: "fromType",
    label: "",
    component: "Input",
  },
  {
    field: "toId",
    label: "",
    component: "Input",
  },
  {
    field: "toType",
    label: "",
    component: "Input",
  },
];

export class IteraiteLinkDesc {
  viewSchema: DescItem[] = [
    {
      label: "id",
      field: "id",
      show: () => false
    },
    {
      field: "type",
      label: ""
    },
    {
      field: "fromId",
      label: ""
    },
    {
      field: "fromType",
      label: ""
    },
    {
      field: "toId",
      label: ""
    },
    {
      field: "toType",
      label: ""
    },
  ];
}

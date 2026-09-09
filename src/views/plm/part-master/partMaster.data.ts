import { BasicColumn, FormSchema } from "@mfish/core/components/Table";
import { DescItem } from "@mfish/core/components/Description";

/**
 * @description: 部件主数据
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
    dataIndex: "number",
    width: 120
  },
  {
    title: "",
    dataIndex: "name",
    width: 120
  },
];
export const searchFormSchema: FormSchema[] = [
  {
    field: "number",
    label: "",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
  {
    field: "name",
    label: "",
    component: "Input",
    colProps: { xl: 5, md: 6 }
  },
];
export const partMasterFormSchema: FormSchema[] = [
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
    field: "number",
    label: "",
    component: "Input",
  },
  {
    field: "name",
    label: "",
    component: "Input",
  },
];

export class PartMasterDesc {
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
      field: "number",
      label: ""
    },
    {
      field: "name",
      label: ""
    },
  ];
}

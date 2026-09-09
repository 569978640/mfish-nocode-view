import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 产品库
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface Product extends BaseEntity<string> {
  //类型
  type?: string;
  //产品名称
  name?: string;
}

export interface ReqProduct extends ReqPage {
  //产品ID
  id?: string;
  //产品名称
  name?: string;
  //
  create_by?: string;
}

//分页结果集
export type ProductPageModel = PageResult<Product>;

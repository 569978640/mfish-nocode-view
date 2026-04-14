import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 产品系列报表字段配置
 * @author: mfish
 * @date: 2026-04-15
 * @version: V2.3.0
 */
export interface ProductReportFieldConfig extends BaseEntity<string> {
  //编号
  number: string;
  //字段
  field: string;
  //类型
  type: string;
}

export interface ReqProductReportFieldConfig extends ReqPage {
  //编号
  number?: string;
}

//分页结果集
export type ProductReportFieldConfigPageModel = PageResult<ProductReportFieldConfig>;

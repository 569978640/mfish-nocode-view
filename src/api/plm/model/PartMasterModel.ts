import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 部件主数据
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface PartMaster extends BaseEntity<string> {
  //
  type?: string;
  //
  number?: string;
  //
  name?: string;
}

export interface ReqPartMaster extends ReqPage {
  //
  number?: string;
  //
  name?: string;
}

//分页结果集
export type PartMasterPageModel = PageResult<PartMaster>;

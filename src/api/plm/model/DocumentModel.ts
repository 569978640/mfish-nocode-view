import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 文档小版本
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface Document extends BaseEntity<string> {
  //
  type?: string;
  //
  version?: string;
  //
  state?: string;
}

export interface ReqDocument extends ReqPage {
  //
  version?: string;
  //
  state?: string;
}

//分页结果集
export type DocumentPageModel = PageResult<Document>;

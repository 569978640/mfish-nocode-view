import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 包含关系
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface ContainsLink extends BaseEntity<string> {
  //
  type?: string;
  //
  fromId?: string;
  //
  fromType?: string;
  //
  toId?: string;
  //
  toType?: string;
}

export interface ReqContainsLink extends ReqPage {
}

//分页结果集
export type ContainsLinkPageModel = PageResult<ContainsLink>;

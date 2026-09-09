import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 迭代关系
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface IteraiteLink extends BaseEntity<string> {
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

export interface ReqIteraiteLink extends ReqPage {
}

//分页结果集
export type IteraiteLinkPageModel = PageResult<IteraiteLink>;

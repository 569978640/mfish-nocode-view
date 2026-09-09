import { BaseEntity, PageResult, ReqPage } from "@mfish/core/api";

/**
 * @description: 文件夹
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
export interface Folder extends BaseEntity<string> {
  //
  type?: string;
  //
  name?: string;
}

export interface ReqFolder extends ReqPage {
  //
  name?: string;
}

//分页结果集
export type FolderPageModel = PageResult<Folder>;

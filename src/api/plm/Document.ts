import { defHttp } from "@mfish/core/utils/http/axios";
import { Document, ReqDocument, DocumentPageModel } from "@/api/plm/model/DocumentModel";

/**
 * @description: 文档小版本
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  Document = "/plm/document"
}

/**
 * 分页列表查询
 *
 * @param reqDocument
 * @return 返回分页列表
 */
export const getDocumentList = (reqDocument?: ReqDocument) => {
  return defHttp.get<DocumentPageModel>({ url: Api.Document, params: reqDocument });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getDocumentById(id: string) {
  return defHttp.get<Document>({ url: `${Api.Document}/${id}` });
}

/**
 * 导出文档小版本
 * @param reqDocument 请求参数
 */
export function exportDocument(reqDocument?: ReqDocument) {
  return defHttp.download({ url: `${Api.Document}/export`, params: reqDocument });
}

/**
 * 新增文档小版本
 *
 * @param document 请求参数
 * @return 返回结果
 */
export function insertDocument(document: Document) {
  return defHttp.post<Document>({ url: Api.Document, params: document }, { successMessageMode: "message" });
}

/**
 * 修改文档小版本
 *
 * @param document
 * @return 返回结果
 */
export function updateDocument(document: Document) {
  return defHttp.put<Document>({ url: Api.Document, params: document }, { successMessageMode: "message" });
}

/**
 * 删除文档小版本
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteDocument(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.Document}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除文档小版本
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchDocument(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.Document}/batch/${ids}` }, { successMessageMode: "message" });
}

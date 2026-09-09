import { defHttp } from "@mfish/core/utils/http/axios";
import { DocumentMaster, ReqDocumentMaster, DocumentMasterPageModel } from "@/api/plm/model/DocumentMasterModel";

/**
 * @description: 文档主数据
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  DocumentMaster = "/plm/documentMaster"
}

/**
 * 分页列表查询
 *
 * @param reqDocumentMaster
 * @return 返回分页列表
 */
export const getDocumentMasterList = (reqDocumentMaster?: ReqDocumentMaster) => {
  return defHttp.get<DocumentMasterPageModel>({ url: Api.DocumentMaster, params: reqDocumentMaster });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getDocumentMasterById(id: string) {
  return defHttp.get<DocumentMaster>({ url: `${Api.DocumentMaster}/${id}` });
}

/**
 * 导出文档主数据
 * @param reqDocumentMaster 请求参数
 */
export function exportDocumentMaster(reqDocumentMaster?: ReqDocumentMaster) {
  return defHttp.download({ url: `${Api.DocumentMaster}/export`, params: reqDocumentMaster });
}

/**
 * 新增文档主数据
 *
 * @param documentMaster 请求参数
 * @return 返回结果
 */
export function insertDocumentMaster(documentMaster: DocumentMaster) {
  return defHttp.post<DocumentMaster>({ url: Api.DocumentMaster, params: documentMaster }, { successMessageMode: "message" });
}

/**
 * 修改文档主数据
 *
 * @param documentMaster
 * @return 返回结果
 */
export function updateDocumentMaster(documentMaster: DocumentMaster) {
  return defHttp.put<DocumentMaster>({ url: Api.DocumentMaster, params: documentMaster }, { successMessageMode: "message" });
}

/**
 * 删除文档主数据
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteDocumentMaster(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.DocumentMaster}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除文档主数据
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchDocumentMaster(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.DocumentMaster}/batch/${ids}` }, { successMessageMode: "message" });
}

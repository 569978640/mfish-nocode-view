import { defHttp } from "@mfish/core/utils/http/axios";
import { Folder, ReqFolder, FolderPageModel } from "@/api/plm/model/FolderModel";

/**
 * @description: 文件夹
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  Folder = "/plm/folder"
}

/**
 * 分页列表查询
 *
 * @param reqFolder
 * @return 返回分页列表
 */
export const getFolderList = (reqFolder?: ReqFolder) => {
  return defHttp.get<FolderPageModel>({ url: Api.Folder, params: reqFolder });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getFolderById(id: string) {
  return defHttp.get<Folder>({ url: `${Api.Folder}/${id}` });
}

/**
 * 导出文件夹
 * @param reqFolder 请求参数
 */
export function exportFolder(reqFolder?: ReqFolder) {
  return defHttp.download({ url: `${Api.Folder}/export`, params: reqFolder });
}

/**
 * 新增文件夹
 *
 * @param folder 请求参数
 * @return 返回结果
 */
export function insertFolder(folder: Folder) {
  return defHttp.post<Folder>({ url: Api.Folder, params: folder }, { successMessageMode: "message" });
}

/**
 * 修改文件夹
 *
 * @param folder
 * @return 返回结果
 */
export function updateFolder(folder: Folder) {
  return defHttp.put<Folder>({ url: Api.Folder, params: folder }, { successMessageMode: "message" });
}

/**
 * 删除文件夹
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteFolder(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.Folder}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除文件夹
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchFolder(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.Folder}/batch/${ids}` }, { successMessageMode: "message" });
}

import { defHttp } from "@mfish/core/utils/http/axios";
import { IteraiteLink, ReqIteraiteLink, IteraiteLinkPageModel } from "@/api/plm/model/IteraiteLinkModel";

/**
 * @description: 迭代关系
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  IteraiteLink = "/plm/iteraiteLink"
}

/**
 * 分页列表查询
 *
 * @param reqIteraiteLink
 * @return 返回分页列表
 */
export const getIteraiteLinkList = (reqIteraiteLink?: ReqIteraiteLink) => {
  return defHttp.get<IteraiteLinkPageModel>({ url: Api.IteraiteLink, params: reqIteraiteLink });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getIteraiteLinkById(id: string) {
  return defHttp.get<IteraiteLink>({ url: `${Api.IteraiteLink}/${id}` });
}

/**
 * 导出迭代关系
 * @param reqIteraiteLink 请求参数
 */
export function exportIteraiteLink(reqIteraiteLink?: ReqIteraiteLink) {
  return defHttp.download({ url: `${Api.IteraiteLink}/export`, params: reqIteraiteLink });
}

/**
 * 新增迭代关系
 *
 * @param iteraiteLink 请求参数
 * @return 返回结果
 */
export function insertIteraiteLink(iteraiteLink: IteraiteLink) {
  return defHttp.post<IteraiteLink>({ url: Api.IteraiteLink, params: iteraiteLink }, { successMessageMode: "message" });
}

/**
 * 修改迭代关系
 *
 * @param iteraiteLink
 * @return 返回结果
 */
export function updateIteraiteLink(iteraiteLink: IteraiteLink) {
  return defHttp.put<IteraiteLink>({ url: Api.IteraiteLink, params: iteraiteLink }, { successMessageMode: "message" });
}

/**
 * 删除迭代关系
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteIteraiteLink(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.IteraiteLink}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除迭代关系
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchIteraiteLink(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.IteraiteLink}/batch/${ids}` }, { successMessageMode: "message" });
}

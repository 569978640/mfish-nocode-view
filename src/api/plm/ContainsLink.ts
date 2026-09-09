import { defHttp } from "@mfish/core/utils/http/axios";
import { ContainsLink, ReqContainsLink, ContainsLinkPageModel } from "@/api/plm/model/ContainsLinkModel";

/**
 * @description: 包含关系
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  ContainsLink = "/plm/containsLink"
}

/**
 * 分页列表查询
 *
 * @param reqContainsLink
 * @return 返回分页列表
 */
export const getContainsLinkList = (reqContainsLink?: ReqContainsLink) => {
  return defHttp.get<ContainsLinkPageModel>({ url: Api.ContainsLink, params: reqContainsLink });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getContainsLinkById(id: string) {
  return defHttp.get<ContainsLink>({ url: `${Api.ContainsLink}/${id}` });
}

/**
 * 导出包含关系
 * @param reqContainsLink 请求参数
 */
export function exportContainsLink(reqContainsLink?: ReqContainsLink) {
  return defHttp.download({ url: `${Api.ContainsLink}/export`, params: reqContainsLink });
}

/**
 * 新增包含关系
 *
 * @param containsLink 请求参数
 * @return 返回结果
 */
export function insertContainsLink(containsLink: ContainsLink) {
  return defHttp.post<ContainsLink>({ url: Api.ContainsLink, params: containsLink }, { successMessageMode: "message" });
}

/**
 * 修改包含关系
 *
 * @param containsLink
 * @return 返回结果
 */
export function updateContainsLink(containsLink: ContainsLink) {
  return defHttp.put<ContainsLink>({ url: Api.ContainsLink, params: containsLink }, { successMessageMode: "message" });
}

/**
 * 删除包含关系
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteContainsLink(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.ContainsLink}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除包含关系
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchContainsLink(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.ContainsLink}/batch/${ids}` }, { successMessageMode: "message" });
}

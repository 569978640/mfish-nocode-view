import { defHttp } from "@mfish/core/utils/http/axios";
import { PartMaster, ReqPartMaster, PartMasterPageModel } from "@/api/plm/model/PartMasterModel";

/**
 * @description: 部件主数据
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  PartMaster = "/plm/partMaster"
}

/**
 * 分页列表查询
 *
 * @param reqPartMaster
 * @return 返回分页列表
 */
export const getPartMasterList = (reqPartMaster?: ReqPartMaster) => {
  return defHttp.get<PartMasterPageModel>({ url: Api.PartMaster, params: reqPartMaster });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getPartMasterById(id: string) {
  return defHttp.get<PartMaster>({ url: `${Api.PartMaster}/${id}` });
}

/**
 * 导出部件主数据
 * @param reqPartMaster 请求参数
 */
export function exportPartMaster(reqPartMaster?: ReqPartMaster) {
  return defHttp.download({ url: `${Api.PartMaster}/export`, params: reqPartMaster });
}

/**
 * 新增部件主数据
 *
 * @param partMaster 请求参数
 * @return 返回结果
 */
export function insertPartMaster(partMaster: PartMaster) {
  return defHttp.post<PartMaster>({ url: Api.PartMaster, params: partMaster }, { successMessageMode: "message" });
}

/**
 * 修改部件主数据
 *
 * @param partMaster
 * @return 返回结果
 */
export function updatePartMaster(partMaster: PartMaster) {
  return defHttp.put<PartMaster>({ url: Api.PartMaster, params: partMaster }, { successMessageMode: "message" });
}

/**
 * 删除部件主数据
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deletePartMaster(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.PartMaster}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除部件主数据
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchPartMaster(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.PartMaster}/batch/${ids}` }, { successMessageMode: "message" });
}

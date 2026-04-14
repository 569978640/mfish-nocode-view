import { defHttp } from "@mfish/core/utils/http/axios";
import { ProductReportFieldConfig, ReqProductReportFieldConfig, ProductReportFieldConfigPageModel } from "@/api/plm/model/ProductReportFieldConfigModel";

/**
 * @description: PLM产品报表
 * @author: mfish
 * @date: 2026-04-14
 * @version: V2.3.0
 */
enum Api {
  ProductReportFieldConfig = "/plm/productReportFieldConfig"
}

/**
 * 分页列表查询
 *
 * @param reqProductReportFieldConfig
 * @return 返回分页列表
 */
export const getProductReportFieldConfigList = (reqProductReportFieldConfig?: ReqProductReportFieldConfig) => {
  return defHttp.get<ProductReportFieldConfigPageModel>({ url: Api.ProductReportFieldConfig, params: reqProductReportFieldConfig });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getProductReportFieldConfigById(id: string) {
  return defHttp.get<ProductReportFieldConfig>({ url: `${Api.ProductReportFieldConfig}/${id}` });
}

/**
 * 导出PLM产品报表
 * @param reqProductReportFieldConfig 请求参数
 */
export function exportProductReportFieldConfig(reqProductReportFieldConfig?: ReqProductReportFieldConfig) {
  return defHttp.download({ url: `${Api.ProductReportFieldConfig}/export`, params: reqProductReportFieldConfig });
}

/**
 * 新增PLM产品报表
 *
 * @param productReportFieldConfig 请求参数
 * @return 返回结果
 */
export function insertProductReportFieldConfig(productReportFieldConfig: ProductReportFieldConfig) {
  return defHttp.post<ProductReportFieldConfig>({ url: Api.ProductReportFieldConfig, params: productReportFieldConfig }, { successMessageMode: "message" });
}

/**
 * 修改PLM产品报表
 *
 * @param productReportFieldConfig
 * @return 返回结果
 */
export function updateProductReportFieldConfig(productReportFieldConfig: ProductReportFieldConfig) {
  return defHttp.put<ProductReportFieldConfig>({ url: Api.ProductReportFieldConfig, params: productReportFieldConfig }, { successMessageMode: "message" });
}

/**
 * 删除PLM产品报表
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteProductReportFieldConfig(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.ProductReportFieldConfig}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除PLM产品报表
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchProductReportFieldConfig(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.ProductReportFieldConfig}/batch/${ids}` }, { successMessageMode: "message" });
}

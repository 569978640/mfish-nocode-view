import { defHttp } from "@mfish/core/utils/http/axios";
import { Product, ReqProduct, ProductPageModel } from "@/api/plm/model/ProductModel";

/**
 * @description: 产品库
 * @author: mfish
 * @date: 2026-04-17
 * @version: V2.3.1
 */
enum Api {
  Product = "/plm/product"
}

/**
 * 分页列表查询
 *
 * @param reqProduct
 * @return 返回分页列表
 */
export const getProductList = (reqProduct?: ReqProduct) => {
  return defHttp.get<ProductPageModel>({ url: Api.Product, params: reqProduct });
};

/**
 * 通过id查询
 *
 * @param id 唯一ID
 * @return 返回分页列表
 */
export function getProductById(id: string) {
  return defHttp.get<Product>({ url: `${Api.Product}/${id}` });
}

/**
 * 导出产品库
 * @param reqProduct 请求参数
 */
export function exportProduct(reqProduct?: ReqProduct) {
  return defHttp.download({ url: `${Api.Product}/export`, params: reqProduct });
}

/**
 * 新增产品库
 *
 * @param product 请求参数
 * @return 返回结果
 */
export function insertProduct(product: Product) {
  return defHttp.post<Product>({ url: Api.Product, params: product }, { successMessageMode: "message" });
}

/**
 * 修改产品库
 *
 * @param product
 * @return 返回结果
 */
export function updateProduct(product: Product) {
  return defHttp.put<Product>({ url: Api.Product, params: product }, { successMessageMode: "message" });
}

/**
 * 删除产品库
 *
 * @param id 唯一ID
 * @return 返回结果
 */
export function deleteProduct(id: string) {
  return defHttp.delete<boolean>({ url: `${Api.Product}/${id}` }, { successMessageMode: "message" });
}

/**
 * 批量删除产品库
 *
 * @param ids 唯一ID多个逗号隔开
 * @return 返回结果
 */
export function deleteBatchProduct(ids: string) {
  return defHttp.delete<boolean>({ url: `${Api.Product}/batch/${ids}` }, { successMessageMode: "message" });
}

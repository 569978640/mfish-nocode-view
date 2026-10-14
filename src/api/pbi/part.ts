import type { PbiFilterProperty, PbiParamConfigItem, PbiPart } from "./model";
import { defHttp } from "@mfish/core/utils/http/axios";
import { PBI_BASE_URL } from "./constants";

/**
 * @description PBI 特性参数配置、产品型号（部件）与筛选属性接口
 */
export const partApi = {
  /**
   * 获取特性参数展示配置
   * @param firstCategory 一级分类显示名称（/pbi/node1 返回的 displayName 字段）
   */
  async getParamConfig(firstCategory: string) {
    return await defHttp.get<PbiParamConfigItem[]>({
      url: `${PBI_BASE_URL}/paramConfig`,
      params: { firstCategory }
    });
  },

  /**
   * 根据产品分类获取产品型号（部件）列表
   * @param firstCategory 一级分类（二级分类的 parentDisplayName）
   * @param productClassification 产品分类（二级分类的原始 name）
   */
  async getPartsByClassification(firstCategory: string, productClassification: string) {
    return await defHttp.get<PbiPart[]>({
      url: `${PBI_BASE_URL}/part`,
      params: { firstCategory, productClassification }
    });
  },

  /**
   * 获取产品型号下拉选项（竞品选择级联第三级用）
   * @param firstCategory 一级分类（二级分类的 parentDisplayName）
   * @param productClassification 产品分类（二级分类的原始 name）
   * @returns 每项格式为"部件编号,部件名称"
   */
  async getPartOptions(firstCategory: string, productClassification: string) {
    return await defHttp.get<string[]>({
      url: `${PBI_BASE_URL}/partOptions`,
      params: { firstCategory, productClassification }
    });
  },

  /**
   * 获取筛选属性列表
   * @param nodeName 节点名称（二级分类内部名称 name）
   */
  async getFilterProperties(nodeName?: string) {
    return await defHttp.get<PbiFilterProperty[]>({
      url: `${PBI_BASE_URL}/filterProperties`,
      params: { nodeName }
    });
  },

  /**
   * 按部件编号获取单个产品型号完整特性参数（家谱点击部件编号进入详情页）
   * @param firstCategory 一级分类（决定特性参数展示列）
   * @param wtPartNumber 部件编号
   * @returns 产品型号详情；未查到时返回 null
   */
  async getPartDetail(firstCategory: string, wtPartNumber: string) {
    return await defHttp.get<PbiPart | null>({
      url: `${PBI_BASE_URL}/partDetail`,
      params: { firstCategory, wtPartNumber }
    });
  }
};

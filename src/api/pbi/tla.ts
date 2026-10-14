import type {
  TlaCategory,
  TlaSeries,
  TlaSeriesForm,
  PbiParamConfigItem,
  PbiPart,
  PbiFilterProperty
} from "./model/TlaModel";
import { defHttp } from "@mfish/core/utils/http/axios";
import defaultImg from "@/views/pbi/TLA-Architecture/image/default.png";

/**
 * PBI接口统一前缀（网关路由到mf-bfces服务的/pbi控制器）
 */
const BASE_URL = "/bfces/pbi";

/**
 * @description PBI/TLA 架构接口
 */
export const tlaApi = {
  /**
   * 获取一级分类列表
   */
  async getCategoryList() {
    const list = await defHttp.get<TlaCategory[]>({ url: `${BASE_URL}/node1` });
    return list.map((item) => ({
      ...item,
      id: item.name // 后端未返回 id，使用 name 作为前端唯一标识
    }));
  },

  /**
   * 根据一级分类获取产品系列（二级分类）列表
   */
  async getSeriesList(categoryId: string) {
    const list = await defHttp.get<TlaCategory[]>({
      url: `${BASE_URL}/node2`,
      params: { parentNodeName: categoryId }
    });
    return list.map(
      (item) =>
        ({
          id: item.name, // 后端未返回 id，使用 name 作为前端唯一标识
          categoryId,
          name: item.name, // 二级分类内部名称（NAME），作为产品分类查询部件的条件
          displayName: item.displayName,
          parentName: item.parentName,
          parentDisplayName: item.parentDisplayName,
          description: item.description || "",
          imageUrl: item.image || defaultImg // 图片为空时使用默认图片
        }) as TlaSeries
    );
  },

  /**
   * 保存或更新产品系列
   * @deprecated 后端系列维护接口尚未提供，当前为本地假实现，数据不会持久化；
   * 待后端接口就绪后替换为真实 POST/PUT 调用，并恢复页面上的“编辑”入口
   */
  saveSeries(_data: TlaSeriesForm) {
    return Promise.resolve(true);
  },

  /**
   * 获取特性参数展示配置
   * @param firstCategory 一级分类显示名称（/pbi/node1 返回的 displayName 字段）
   */
  async getParamConfig(firstCategory: string) {
    return await defHttp.get<PbiParamConfigItem[]>({
      url: `${BASE_URL}/paramConfig`,
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
      url: `${BASE_URL}/part`,
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
      url: `${BASE_URL}/partOptions`,
      params: { firstCategory, productClassification }
    });
  },

  /**
   * 获取筛选属性列表
   * @param nodeName 节点名称（二级分类内部名称 name）
   */
  async getFilterProperties(nodeName?: string) {
    return await defHttp.get<PbiFilterProperty[]>({
      url: `${BASE_URL}/filterProperties`,
      params: { nodeName }
    });
  }
};

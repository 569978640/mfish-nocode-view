import type { TlaCategory, TlaSeries, TlaSeriesForm } from "./model";
import { defHttp } from "@mfish/core/utils/http/axios";
import { PBI_BASE_URL } from "./constants";

/**
 * @description PBI/TLA 分类与系列接口（一级分类、二级产品系列）
 */
export const categoryApi = {
  /**
   * 获取一级分类列表
   */
  async getCategoryList() {
    const list = await defHttp.get<TlaCategory[]>({ url: `${PBI_BASE_URL}/node1` });
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
      url: `${PBI_BASE_URL}/node2`,
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
          // API 层不感知视图层图片资源：无图时返回空串，默认图由展示层兜底
          imageUrl: item.image || ""
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
  }
};

import type { FamilyTreeNode } from "./model";
import { defHttp } from "@mfish/core/utils/http/axios";
import { PBI_BASE_URL } from "./constants";

/**
 * @description PBI 产品家谱接口
 */
export const familyApi = {
  /**
   * 获取产品家谱树（自底向上递归组装的衍生关系树）
   * @param productClassification 二级分类内部名称（PRODUCTCLASSIFICATION，即系列的 name）
   * @returns 家谱顶层节点；无有效支系时返回 null
   */
  async getFamilyTree(productClassification: string) {
    return await defHttp.get<FamilyTreeNode | null>({
      url: `${PBI_BASE_URL}/familyTree`,
      params: { productClassification }
    });
  }
};

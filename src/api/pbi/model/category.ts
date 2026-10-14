/**
 * @description TLA 架构分类与系列模型
 */

/**
 * @description TLA 架构分类节点（一级/二级分类通用结构）
 */
export interface TlaCategory {
  id: string;
  name: string;
  displayName?: string;
  parentName?: string;
  parentDisplayName?: string;
  image?: string;
  description?: string;
}

/**
 * @description TLA 架构系列模型（二级分类的前端视图模型）
 */
export interface TlaSeries {
  id: string;
  categoryId: string;
  /** 二级分类内部名称（Windchill NAME，同时作为按产品分类查询部件的条件） */
  name: string;
  /** 二级分类显示名称 */
  displayName?: string;
  parentName?: string;
  parentDisplayName?: string;
  description: string;
  imageUrl: string;
}

/**
 * @description 系列维护表单模型
 */
export interface TlaSeriesForm {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
}

/**
 * 分类入参：一级分类显示名称 + 二级分类内部名称。
 * 数据加载、竞品级联等 hook 共用此入参结构。
 */
export interface PbiClassificationProps {
  /** 一级分类显示名称（二级分类的 parentDisplayName） */
  firstCategory: string;
  /** 产品分类（二级分类的原始 name，即 PRODUCTCLASSIFICATION） */
  productClassification: string;
}

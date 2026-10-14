/**
 * @description PBI 参数配置、产品型号（部件）与筛选属性模型
 */

/**
 * @description PBI 特性参数展示配置项
 * 对应后端 PbiParamConfig（表 PBI_FeatureParameterDisplayConfig）
 */
export interface PbiParamConfigItem {
  /** 一级分类 */
  firstCategory: string;
  /** 属性组名 */
  paramGroup: string;
  /** 参数名称（英文展示名） */
  param: string;
  /** 参数中文显示名称 */
  displayName?: string;
  /** Windchill 内部名称 */
  internalName: string;
  /** 部件属性列名（取值用） */
  columnName: string;
  /** 属性组标题行背景色（十六进制，不含 #） */
  groupColor?: string;
  /** 属性行背景色（十六进制，不含 #） */
  paramColor?: string;
}

/**
 * @description PBI 产品型号（部件）
 * 对应后端 PbiPart
 */
export interface PbiPart {
  /** 部件编号 */
  wtPartNumber: string;
  /** 部件名称 */
  name: string;
  /** 部件图片地址 */
  image: string;
  /** 部件 Windchill 信息页地址（已含 Basic 认证凭据，浏览器新标签页打开） */
  pageUrl?: string;
  /** 部件扩展属性，key 为大写下划线列名（与 PbiParamConfigItem.columnName 对应） */
  attrs: Record<string, any>;
}

/**
 * @description PBI 筛选属性
 * 对应后端 PbiFilterProperty
 */
export interface PbiFilterProperty {
  /** 属性显示名称 */
  displayName?: string;
  /** 属性名称（对应属性配置的 internalName） */
  name: string;
  /** 属性类型 */
  type?: string;
  /** 可选值列表：非空时使用下拉选择，为空时使用输入框 */
  values?: string[];
}

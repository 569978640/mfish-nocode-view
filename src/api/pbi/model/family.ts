/**
 * @description PBI 产品家谱树模型
 */

/**
 * 产品家谱树节点（部件逐代衍生关系）
 * 节点属性与后端模型字段对应：PN=wtPartNumber、状态=state、DOC=doc、DPF=dpf、SCR=scrAsc、实际发货量=shipment。
 * V1.2.0 后端在主库家谱基础上，按部件编号批量查询接口库 V_WINDCHILL_SHIPMENT 回填实际发货量；
 * 规格软属性无值时为 null（卡片仍展示标签，值留空），值含逗号时卡片只显示首个逗号前内容；
 * 视图无记录或接口库不可用时 shipment 为 null，卡片缺省展示 0。
 */
export interface FamilyTreeNode {
  /** Windchill 部件 ID（WTPART.IDA2A2） */
  partId?: string;
  /** 部件编号（卡片标题 PN） */
  wtPartNumber: string;
  /** 部件名称（接口保留字段，当前卡片未展示） */
  name?: string;
  /** 生命周期状态（RELEASED 展示为已发布，OBSOLETE 展示为已废弃） */
  state: string;
  /** 部件图片静态地址（按部件编号拼接；为空或加载失败时卡片回退默认四宫格图标） */
  image?: string;
  /** DOC 规格（软属性 com.bfces.DOC；无值时标签留空，含逗号只取首段） */
  doc?: string;
  /** DPF 规格（软属性 com.bfces.DPF；无值时标签留空，含逗号只取首段） */
  dpf?: string;
  /** SCR 规格（软属性 com.bfces.SCR_ASC；无值时标签留空，含逗号只取首段） */
  scrAsc?: string;
  /** 实际发货量（接口库 V_WINDCHILL_SHIPMENT 按部件编号 ITEM 关联；无记录或接口库异常时为 null，卡片缺省展示 0，0 本身为有效值） */
  shipment?: number | string;
  /** 下一代衍生产品 */
  children?: FamilyTreeNode[];
}

import type { PbiPart } from "@/api/pbi/model/TlaModel";

/**
 * 属性值是否为空：null、undefined、空串及纯空白字符串均视为空
 */
export const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "");

/**
 * 读取部件在指定属性列上的值。
 * attrs 的 key 与 columnName 都是大写下划线字符串，优先直接匹配，再兜底大小写不敏感匹配；
 * WTPARTNUMBER/NAME 后端未放入 attrs，回退取部件顶层字段
 */
export const getAttrValue = (part: PbiPart, columnName?: string): unknown => {
  if (!columnName) return undefined;
  if (part.attrs) {
    if (Object.prototype.hasOwnProperty.call(part.attrs, columnName)) {
      return part.attrs[columnName];
    }
    const upperKey = columnName.toUpperCase();
    const hitKey = Object.keys(part.attrs).find((key) => key.toUpperCase() === upperKey);
    if (hitKey) return part.attrs[hitKey];
    if (upperKey === "WTPARTNUMBER") return part.wtPartNumber;
    if (upperKey === "NAME") return part.name;
  }
  return undefined;
};

/**
 * 属性值展示格式化：空值展示短横线
 */
export const formatValue = (value: unknown): string => (isEmptyValue(value) ? "-" : String(value));

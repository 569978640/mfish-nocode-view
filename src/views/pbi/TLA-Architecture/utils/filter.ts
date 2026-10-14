import type { PbiFilterProperty } from "@/api/pbi/model";

/**
 * 判断筛选条件是否为下拉多选型（接口返回了非空可选值列表）；
 * 无可选值时筛选条件渲染为输入框，走模糊包含匹配。
 */
export const isSelectFilter = (prop: PbiFilterProperty): boolean => !!(prop.values && prop.values.length > 0);

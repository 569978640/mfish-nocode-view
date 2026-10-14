import { categoryApi } from "./category";
import { partApi } from "./part";
import { familyApi } from "./family";

/**
 * @description PBI/TLA 架构接口聚合出口。
 * 实际实现按业务域拆分在 category.ts / part.ts / family.ts；
 * 此处保持 tlaApi 统一对象与方法名不变，调用方导入路径与调用方式无需改动。
 */
export const tlaApi = {
  ...categoryApi,
  ...partApi,
  ...familyApi
};

import { computed, type Ref } from "vue";
import type { PbiFilterProperty, PbiParamConfigItem, PbiPart } from "@/api/pbi/model/TlaModel";
import { getAttrValue, isEmptyValue } from "../utils/partValue";

interface UsePartFilterOptions {
  configList: Ref<PbiParamConfigItem[]>;
  partList: Ref<PbiPart[]>;
  filterProperties: Ref<PbiFilterProperty[]>;
  filterValues: Record<string, string | string[]>;
  isSelectFilter: (prop: PbiFilterProperty) => boolean;
}

/**
 * 部件筛选：
 * 同一条件内下拉多选为“包含任一选中值”（OR），输入框为忽略大小写的模糊包含；
 * 多个筛选条件之间为“同时满足”（AND）；
 * 筛选属性在属性配置中找不到对应列名时，该条件不参与过滤。
 */
export const usePartFilter = (options: UsePartFilterOptions) => {
  const { configList, partList, filterProperties, filterValues, isSelectFilter } = options;

  /** 筛选属性 name（即 internalName） → 部件属性列名 columnName 映射 */
  const internalNameColumnMap = computed(() => {
    const map = new Map<string, string>();
    for (const item of configList.value) {
      if (item.internalName && item.columnName) {
        map.set(item.internalName, item.columnName);
      }
    }
    return map;
  });

  /** 多选下拉选项：接口返回的可选值 */
  const buildSelectOptions = (values: string[]) => values.map((value) => ({ label: value, value }));

  /** 输入框型条件的值读取（联合类型下保证 AInput 拿到 string） */
  const getTextValue = (name: string): string => {
    const value = filterValues[name];
    return typeof value === "string" ? value : "";
  };

  /** 输入框型条件的值写入 */
  const setTextValue = (name: string, value: string) => {
    filterValues[name] = value;
  };

  /** 清空所有筛选条件：下拉多选取空数组，输入框取空串 */
  const resetFilters = () => {
    for (const prop of filterProperties.value) {
      filterValues[prop.name] = isSelectFilter(prop) ? [] : "";
    }
  };

  /** 按筛选条件过滤后的部件列表；无激活条件时返回全量部件 */
  const filteredPartList = computed<PbiPart[]>(() => {
    const activeFilters = filterProperties.value.filter((prop) => {
      const value = filterValues[prop.name];
      return Array.isArray(value) ? value.length > 0 : String(value || "").trim() !== "";
    });
    if (activeFilters.length === 0) return partList.value;
    return partList.value.filter((part) =>
      activeFilters.every((prop) => {
        const columnName = internalNameColumnMap.value.get(prop.name);
        if (!columnName) return true;
        const cellValue = getAttrValue(part, columnName);
        const cellText = isEmptyValue(cellValue) ? "" : String(cellValue).trim();
        if (isSelectFilter(prop)) {
          // 多选下拉：部件值命中任一选中值即保留
          const selected = filterValues[prop.name];
          return Array.isArray(selected) && selected.includes(cellText);
        }
        const keyword = getTextValue(prop.name).trim();
        return cellText.toLowerCase().includes(keyword.toLowerCase());
      })
    );
  });

  return {
    filteredPartList,
    internalNameColumnMap,
    buildSelectOptions,
    getTextValue,
    setTextValue,
    resetFilters
  };
};

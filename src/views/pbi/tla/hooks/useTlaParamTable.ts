import { ref, watch, type Ref } from "vue";
import { tlaApi } from "@/api/pbi/tla";
import type { PbiParamConfigItem, PbiPart } from "@/api/pbi/model";
import { useParamTable } from "../../TLA-Architecture/hooks/useParamTable";

interface UseTlaParamTableOptions {
  /** 一级分类显示名称（决定特性参数展示分组/颜色，来自路由 query 或对比会话） */
  firstCategory: Ref<string>;
  /** 表格展示的部件列（型号对比为对比集，产品详情为单个部件），响应式传入 */
  parts: Ref<PbiPart[]>;
}

/**
 * 型号对比 / 产品详情标签共用的参数表格视图模型：
 * 仅加载特性参数展示配置（属性分组与颜色），部件列由外部会话提供，
 * 行差异状态、列宽自适应等全部复用 TLA-Architecture 的 useParamTable。
 */
export const useTlaParamTable = (options: UseTlaParamTableOptions) => {
  const { firstCategory, parts } = options;

  /** 特性参数展示配置（属性分组、行背景色、列名映射） */
  const configList = ref<PbiParamConfigItem[]>([]);
  /** 配置加载状态 */
  const loading = ref(false);

  /** 按一级分类加载特性参数展示配置；一级分类变化（对比会话切换来源分类）自动重载 */
  const loadConfig = async () => {
    if (!firstCategory.value) return;
    loading.value = true;
    try {
      configList.value = (await tlaApi.getParamConfig(firstCategory.value)) || [];
    } finally {
      loading.value = false;
    }
  };

  watch(firstCategory, loadConfig, { immediate: true });

  // 对比/详情场景下 partList、filteredPartList、tablePartList 三者相同：
  // 无筛选栏，展示什么完全由外部会话决定
  const table = useParamTable({
    configList,
    partList: parts,
    filteredPartList: parts,
    tablePartList: parts
  });

  return {
    configLoading: loading,
    ...table
  };
};

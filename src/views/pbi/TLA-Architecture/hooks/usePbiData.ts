import { onMounted, reactive, ref, watch } from "vue";
import { tlaApi } from "@/api/pbi/tla";
import type { PbiClassificationProps, PbiFilterProperty, PbiParamConfigItem, PbiPart } from "@/api/pbi/model";
import { isSelectFilter } from "../utils/filter";

/**
 * PBI参数配置页数据加载：
 * 并行加载特性参数展示配置、产品型号列表与筛选属性，并维护各筛选条件的默认值；
 * 分类变化重新加载成功后通过 onLoaded 回调通知组件重置对比等派生状态。
 */
export const usePbiData = (props: PbiClassificationProps, onLoaded?: () => void) => {
  const loading = ref(false);
  const configList = ref<PbiParamConfigItem[]>([]);
  const partList = ref<PbiPart[]>([]);
  /** 可用筛选属性列表（保持接口返回顺序） */
  const filterProperties = ref<PbiFilterProperty[]>([]);
  /**
   * 各筛选条件当前值，key 为筛选属性 name（即属性行 internalName）：
   * 下拉多选条件为 string[]，输入框条件为 string
   */
  const filterValues = reactive<Record<string, string | string[]>>({});

  /** 并行加载配置、部件、筛选属性（筛选属性按二级分类节点查询） */
  const loadData = async () => {
    if (!props.firstCategory || !props.productClassification) return;
    loading.value = true;
    try {
      const [configs, parts, filters] = await Promise.all([
        tlaApi.getParamConfig(props.firstCategory),
        tlaApi.getPartsByClassification(props.firstCategory, props.productClassification),
        tlaApi.getFilterProperties(props.productClassification)
      ]);
      configList.value = configs || [];
      partList.value = parts || [];
      filterProperties.value = filters || [];
      // 初始化各筛选条件默认值：下拉多选为空数组（不过滤），输入框为空串
      for (const prop of filterProperties.value) {
        filterValues[prop.name] = isSelectFilter(prop) ? [] : "";
      }
      // 通知组件重置对比模式/对比集等派生状态，避免残留旧分类的部件
      onLoaded?.();
    } finally {
      loading.value = false;
    }
  };

  watch(() => [props.firstCategory, props.productClassification], loadData);

  onMounted(() => {
    loadData();
  });

  return {
    loading,
    configList,
    partList,
    filterProperties,
    filterValues,
    loadData
  };
};

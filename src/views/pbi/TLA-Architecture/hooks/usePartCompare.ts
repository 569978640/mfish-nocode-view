import { ref } from "vue";
import type { PbiPart } from "@/api/pbi/model";

/**
 * 型号对比标签/标题统一文案：编号, 名称（名称为空时只显示编号）。
 * 纯函数，供 hook 返回与对比面板组件直接复用。
 */
export const formatCompareLabel = (part: PbiPart): string =>
  part.name ? `${part.wtPartNumber}, ${part.name}` : part.wtPartNumber;

/**
 * 型号对比集与对比模式管理：
 * 对比部件按添加顺序保存、按 wtPartNumber 去重；对比模式下表格仅展示对比部件。
 */
export const usePartCompare = () => {
  /** 已加入对比的部件（按添加顺序，按 wtPartNumber 去重） */
  const compareParts = ref<PbiPart[]>([]);
  /** 是否处于对比模式（开始对比后为 true，仅展示对比部件） */
  const comparing = ref(false);

  /** 部件是否已加入对比集 */
  const isCompared = (part: PbiPart): boolean =>
    compareParts.value.some((item) => item.wtPartNumber === part.wtPartNumber);

  /** 加入对比集（已存在则忽略），竞品级联选中叶子时调用 */
  const addCompare = (part: PbiPart) => {
    if (!isCompared(part)) {
      compareParts.value = [...compareParts.value, part];
    }
  };

  /** 点击表头对比按钮：已加入则移出，未加入则追加（保持添加顺序） */
  const toggleCompare = (part: PbiPart) => {
    if (isCompared(part)) {
      compareParts.value = compareParts.value.filter((item) => item.wtPartNumber !== part.wtPartNumber);
    } else {
      addCompare(part);
    }
  };

  /** 从对比集移除单个部件 */
  const removeCompare = (part: PbiPart) => {
    compareParts.value = compareParts.value.filter((item) => item.wtPartNumber !== part.wtPartNumber);
  };

  /** 清空对比集 */
  const clearCompare = () => {
    compareParts.value = [];
  };

  /** 开始对比：至少选择 2 款型号 */
  const startCompare = () => {
    if (compareParts.value.length < 2) return;
    comparing.value = true;
  };

  /** 退出对比模式（返回普通表格视图，不清空对比集） */
  const exitCompare = () => {
    comparing.value = false;
  };

  /** 分类重新加载后重置全部对比状态 */
  const reset = () => {
    comparing.value = false;
    compareParts.value = [];
  };

  return {
    compareParts,
    comparing,
    isCompared,
    addCompare,
    toggleCompare,
    removeCompare,
    clearCompare,
    startCompare,
    exitCompare,
    reset,
    formatCompareLabel
  };
};

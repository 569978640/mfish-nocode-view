<template>
  <!-- 筛选栏：按接口返回顺序依次列出筛选条件，values 非空为下拉、为空为输入框；对比/详情模式由父级隐藏 -->
  <div class="filter-bar">
    <span class="filter-title">筛选</span>
    <AButton type="primary" danger size="small" class="filter-reset" @click="emit('reset')">全部</AButton>
    <div v-for="prop in filterProperties" :key="prop.name" class="filter-item">
      <span class="filter-item-label" :title="prop.displayName || prop.name">
        {{ prop.displayName || prop.name }}
      </span>
      <ASelect
        v-if="isSelectFilter(prop)"
        :value="getMultiValue(prop.name)"
        mode="multiple"
        show-search
        allow-clear
        class="filter-control filter-control-multi"
        size="small"
        placeholder="全部"
        :options="buildSelectOptions(prop.values || [])"
        :max-tag-count="1"
        option-filter-prop="label"
        @update:value="(v: string[]) => setFilterValue(prop.name, v)"
      />
      <AInput
        v-else
        :value="getTextValue(prop.name)"
        class="filter-control"
        size="small"
        placeholder="请输入"
        allow-clear
        @update:value="(v: string) => setFilterValue(prop.name, v)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiFilterBar" });
  defineProps<{
    /** 可用筛选属性列表（保持接口返回顺序） */
    filterProperties: PbiFilterProperty[];
    /** 输入框型条件值读取 */
    getTextValue: (name: string) => string;
    /** 下拉多选型条件值读取 */
    getMultiValue: (name: string) => string[];
    /** 筛选条件值统一写入 */
    setFilterValue: (name: string, value: string | string[]) => void;
    /** 多选下拉选项构造 */
    buildSelectOptions: (values: string[]) => { label: string; value: string }[];
  }>();
  const emit = defineEmits<{
    /** 点击"全部"按钮：清空所有筛选条件 */
    (e: "reset"): void;
  }>();
  import { Button as AButton, Select as ASelect, Input as AInput } from "ant-design-vue";
  import type { PbiFilterProperty } from "@/api/pbi/model";
  import { isSelectFilter } from "../../utils/filter";
</script>

<style lang="less" scoped>
  // 顶部筛选栏
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f5f6fa;
    border-radius: 6px;
  }

  .filter-title {
    font-size: 13px;
    color: #8c8c8c;
  }

  .filter-reset {
    border-radius: 6px;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-item-label {
    flex-shrink: 0;
    max-width: 120px;
    font-size: 13px;
    color: #4b5563;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filter-control {
    width: 140px;
  }

  // 多选下拉需要容纳已选 tag，适当加宽
  .filter-control-multi {
    width: 190px;
    min-width: 160px;
  }
</style>

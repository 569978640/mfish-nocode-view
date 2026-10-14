<template>
  <!-- 左侧面板：属性过滤始终保留；型号对比区仅普通模式展示；详情模式只保留"隐藏暂无内容" -->
  <aside class="prop-filter">
    <div class="prop-filter-count">{{ isDetail ? "产品详细信息" : `共 ${count} 款型号` }}</div>
    <!-- 高亮差异/隐藏相同依赖多列比较，详情模式单列无意义，隐藏 -->
    <ACheckbox
      v-if="!isDetail"
      :checked="highlightDiff"
      class="prop-filter-option"
      @update:checked="(v: boolean) => emit('update:highlightDiff', v)"
    >
      高亮不同参数
    </ACheckbox>
    <ACheckbox
      v-if="!isDetail"
      :checked="hideSame"
      class="prop-filter-option"
      @update:checked="(v: boolean) => emit('update:hideSame', v)"
    >
      隐藏相同参数
    </ACheckbox>
    <ACheckbox
      :checked="hideEmpty"
      class="prop-filter-option"
      @update:checked="(v: boolean) => emit('update:hideEmpty', v)"
    >
      隐藏暂无内容
    </ACheckbox>

    <!-- 型号对比区域：对比/详情模式下隐藏 -->
    <div v-if="!comparing && !isDetail" class="compare-section">
      <div class="compare-section-title">型号对比</div>
      <!-- 已选对比部件：未选时显示操作提示 -->
      <div v-if="compareParts.length === 0" class="compare-tip">点击表头【对比】或选择竞品添加型号进行对比</div>
      <div v-else class="compare-tags">
        <div v-for="part in compareParts" :key="part.wtPartNumber" class="compare-tag">
          <span class="compare-tag-name" :title="formatCompareLabel(part)">{{ formatCompareLabel(part) }}</span>
          <span class="compare-tag-close" @click="emit('remove', part)">×</span>
        </div>
      </div>
      <!-- 选择竞品：三级级联（一级分类 → 二级分类 → 产品型号），选中叶子型号即加入对比集 -->
      <ACascader
        v-model:value="competitorPathModel"
        class="compare-cascader"
        size="small"
        placeholder="选择竞品"
        :options="competitorTree"
        :load-data="loadCompetitorData"
        :dropdown-render="renderCompetitorDropdown"
        popup-class-name="competitor-cascader-popup"
        @change="(value, selectedOptions) => emit('competitorChange', value, selectedOptions)"
        @dropdown-visible-change="(open: boolean) => emit('popupChange', open)"
      />
      <AButton
        type="primary"
        ghost
        danger
        block
        class="compare-start"
        :disabled="compareParts.length < 2"
        @click="emit('start')"
      >
        开始对比
      </AButton>
      <div v-if="compareParts.length > 0" class="compare-clear" @click="emit('clear')">清空所选</div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiComparePanel" });
  const props = defineProps<{
    /** 当前表格展示的型号数量 */
    count: number;
    /** 是否产品详情模式（单列） */
    isDetail: boolean;
    /** 是否处于型号对比模式 */
    comparing: boolean;
    /** 左侧属性过滤开关（v-model） */
    highlightDiff: boolean;
    hideSame: boolean;
    hideEmpty: boolean;
    /** 已加入对比的部件 */
    compareParts: PbiPart[];
    /** 竞品级联当前选中路径（v-model） */
    competitorPath: string[];
    /** 竞品级联选项树 */
    competitorTree: CompetitorOption[];
    /** 级联懒加载回调 */
    loadCompetitorData: (selectedOptions: CompetitorOption[]) => Promise<void>;
    /** 级联弹层自定义渲染（注入产品搜索框） */
    renderCompetitorDropdown: CompetitorDropdownRender;
  }>();
  const emit = defineEmits<{
    (e: "update:highlightDiff", value: boolean): void;
    (e: "update:hideSame", value: boolean): void;
    (e: "update:hideEmpty", value: boolean): void;
    (e: "update:competitorPath", value: string[]): void;
    /** 从对比集移除单个部件 */
    (e: "remove", part: PbiPart): void;
    /** 级联选中叶子（完整参数交由容器的 hook 处理函数消费） */
    (e: "competitorChange", value: string[], selectedOptions: CompetitorOption[]): void;
    /** 级联弹层显隐切换 */
    (e: "popupChange", open: boolean): void;
    /** 开始对比 */
    (e: "start"): void;
    /** 清空对比集 */
    (e: "clear"): void;
  }>();

  /** 级联选择路径双向绑定代理：读 props、写回父级 update 事件（保持与 Ref 直绑一致的 v-model 形态） */
  const competitorPathModel = computed<string[]>({
    get: () => props.competitorPath,
    set: (value) => emit("update:competitorPath", value)
  });

  import { computed } from "vue";
  import { Button as AButton, Checkbox as ACheckbox, Cascader as ACascader } from "ant-design-vue";
  import type { PbiPart } from "@/api/pbi/model";
  import { formatCompareLabel } from "../../hooks/usePartCompare";
  import type { CompetitorDropdownRender, CompetitorOption } from "../../hooks/useCompetitorCascader";
</script>

<style lang="less" scoped>
  // 左侧属性过滤面板
  .prop-filter {
    flex-shrink: 0;
    width: 200px;
    margin-right: 12px;
    padding: 16px 12px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    align-self: flex-start;
  }

  .prop-filter-count {
    margin-bottom: 14px;
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
  }

  .prop-filter-option {
    display: flex;
    margin-bottom: 12px;
    font-size: 13px;
    color: #4b5563;
  }

  // 型号对比区域
  .compare-section {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px dashed #e5e7eb;
  }

  .compare-section-title {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
  }

  .compare-tip {
    min-height: 64px;
    margin-bottom: 10px;
    padding: 8px;
    font-size: 12px;
    line-height: 18px;
    color: #9ca3af;
    text-align: center;
    background: #f5f6fa;
    border: 1px dashed #d9dce3;
    border-radius: 6px;
  }

  .compare-tags {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
    max-height: 220px;
    overflow-y: auto;
  }

  .compare-tag {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 4px 8px;
    background: #fff1f0;
    border: 1px solid #ffccc7;
    border-radius: 6px;
  }

  .compare-tag-name {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: #cf1322;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compare-tag-close {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    font-size: 13px;
    line-height: 14px;
    color: #bfbfbf;
    text-align: center;
    border-radius: 50%;
    cursor: pointer;

    &:hover {
      color: #cf1322;
      background: #ffe7e5;
    }
  }

  .compare-start {
    border-radius: 6px;
    font-weight: 600;
  }

  .compare-clear {
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
    cursor: pointer;

    &:hover {
      color: #cf1322;
    }
  }
</style>

<!-- 竞品级联弹层渲染在 body 下，需用全局样式：三列等宽、第三列顶部产品搜索框定位 -->
<style lang="less">
  .competitor-cascader-popup {
    .ant-cascader-menu {
      width: 200px;
      min-width: 200px;
    }

    // 产品“编号, 名称”较长时单行省略，避免撑宽菜单列
    .ant-cascader-menu-item .ant-cascader-menu-item-content {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .competitor-dropdown {
      position: relative;
    }

    // 搜索框悬浮于第三列顶部（两列等宽 200px），默认隐藏，出现第三列时才显示
    .competitor-product-search {
      position: absolute;
      top: 6px;
      left: 400px;
      z-index: 6;
      display: none;
      box-sizing: border-box;
      width: 184px;
      // 显式锁定高度：affix-wrapper 与内部 input 都要约束，防止被全局/继承样式撑高
      height: 24px;
      min-height: 24px;
      margin: 0;
      padding: 0 11px;
      line-height: 22px;
      background: #fff;

      .ant-input {
        height: 22px;
        min-height: 22px;
        padding: 0;
        line-height: 22px;
      }

      .ant-input-clear-icon {
        top: 50%;
        transform: translateY(-50%);
      }
    }

    .competitor-dropdown:has(.ant-cascader-menu:nth-child(3)) .competitor-product-search {
      // 保持 affix-wrapper 的 flex 布局，不能用 block（会破坏内部输入框/清除图标排列并导致高度异常）
      display: inline-flex;
    }

    // 第三列为搜索框预留顶部空间
    .ant-cascader-menus:has(> .ant-cascader-menu:nth-child(3)) > .ant-cascader-menu:nth-child(3) {
      padding-top: 38px;
    }
  }
</style>

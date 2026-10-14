<template>
  <div class="param-config h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部栏：详情/对比模式下返回上一层视图，普通模式返回系列列表 -->
    <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
      <div class="flex items-center gap-4">
        <AButton @click="handleBack">返回</AButton>
        <h2 class="text-xl font-bold m-0">{{ headerTitle }}</h2>
      </div>
    </div>

    <!-- 筛选栏：按接口返回顺序依次列出筛选条件，values 非空为下拉、为空为输入框；对比/详情模式隐藏 -->
    <div v-if="!comparing && !detailPart && filterProperties.length > 0" class="filter-bar">
      <span class="filter-title">筛选</span>
      <AButton type="primary" danger size="small" class="filter-reset" @click="resetFilters">全部</AButton>
      <div v-for="prop in filterProperties" :key="prop.name" class="filter-item">
        <span class="filter-item-label" :title="prop.displayName || prop.name">
          {{ prop.displayName || prop.name }}
        </span>
        <ASelect
          v-if="isSelectFilter(prop)"
          v-model:value="filterValues[prop.name]"
          mode="multiple"
          show-search
          allow-clear
          class="filter-control filter-control-multi"
          size="small"
          placeholder="全部"
          :options="buildSelectOptions(prop.values)"
          :max-tag-count="1"
          option-filter-prop="label"
        />
        <AInput
          v-else
          :value="getTextValue(prop.name)"
          class="filter-control"
          size="small"
          placeholder="请输入"
          allow-clear
          @update:value="(v: string) => setTextValue(prop.name, v)"
        />
      </div>
    </div>

    <!-- 左侧属性过滤面板 + 右侧参数表格 -->
    <div class="param-body flex-1 flex overflow-hidden">
      <!-- 左侧面板：属性过滤始终保留；型号对比区仅普通模式展示；详情模式只保留"隐藏暂无内容" -->
      <aside v-if="tablePartList.length > 0" class="prop-filter">
        <div class="prop-filter-count">{{ detailPart ? "产品详细信息" : `共 ${tablePartList.length} 款型号` }}</div>
        <!-- 高亮差异/隐藏相同依赖多列比较，详情模式单列无意义，隐藏 -->
        <ACheckbox v-if="!detailPart" v-model:checked="highlightDiff" class="prop-filter-option">
          高亮不同参数
        </ACheckbox>
        <ACheckbox v-if="!detailPart" v-model:checked="hideSame" class="prop-filter-option">隐藏相同参数</ACheckbox>
        <ACheckbox v-model:checked="hideEmpty" class="prop-filter-option">隐藏暂无内容</ACheckbox>

        <!-- 型号对比区域：对比/详情模式下隐藏 -->
        <div v-if="!comparing && !detailPart" class="compare-section">
          <div class="compare-section-title">型号对比</div>
          <!-- 已选对比部件：未选时显示操作提示 -->
          <div v-if="compareParts.length === 0" class="compare-tip">点击表头【对比】或选择竞品添加型号进行对比</div>
          <div v-else class="compare-tags">
            <div v-for="part in compareParts" :key="part.wtPartNumber" class="compare-tag">
              <span class="compare-tag-name" :title="formatCompareLabel(part)">{{ formatCompareLabel(part) }}</span>
              <span class="compare-tag-close" @click="removeCompare(part)">×</span>
            </div>
          </div>
          <!-- 选择竞品：三级级联（一级分类 → 二级分类 → 产品型号），选中叶子型号即加入对比集 -->
          <ACascader
            v-model:value="competitorPath"
            class="compare-cascader"
            size="small"
            placeholder="选择竞品"
            :options="competitorTree"
            :load-data="loadCompetitorData"
            :dropdown-render="renderCompetitorDropdown"
            popup-class-name="competitor-cascader-popup"
            @change="handleCompetitorChange"
            @dropdown-visible-change="handleCompetitorPopupChange"
          />
          <AButton
            type="primary"
            ghost
            danger
            block
            class="compare-start"
            :disabled="compareParts.length < 2"
            @click="startCompare"
          >
            开始对比
          </AButton>
          <div v-if="compareParts.length > 0" class="compare-clear" @click="clearCompare">清空所选</div>
        </div>
      </aside>

      <!-- 参数配置表格：每个部件一列，超出宽度出现横向滚动条；第一列固定不随横向滚动 -->
      <div
        :ref="setWrapEl"
        class="param-table-wrap flex-1 overflow-auto mfish-page-content"
        :class="{ 'is-scrolled': wrapScrolled }"
        @scroll="handleTableScroll"
      >
        <ASpin :spinning="loading">
          <table v-if="displayGroups.length > 0" class="param-table" :style="{ width: `${tableWidth}px` }">
            <!-- 列宽硬约束：第一列固定，部件列等宽；宽度之和即表格总宽 -->
            <colgroup>
              <col :style="colStyle(firstColumnWidth)" />
              <col
                v-for="(part, index) in tablePartList"
                :key="`col-${part.wtPartNumber}-${index}`"
                :style="colStyle(partColumnWidth)"
              />
            </colgroup>
            <thead>
              <tr>
                <th class="param-corner sticky-col">特性参数</th>
                <!-- 部件列：图片 + 部件编号 + 部件名称 + 对比按钮 -->
                <th v-for="(part, index) in tablePartList" :key="`${part.wtPartNumber}-${index}`" class="part-head">
                  <div class="part-image-wrap">
                    <!-- 点击图片在悬浮窗中放大预览；无图或加载失败时回退默认图 -->
                    <AImage
                      :src="part.image || defaultImg"
                      :fallback="defaultImg"
                      :alt="part.wtPartNumber"
                      :preview="{ title: part.wtPartNumber }"
                      class="part-image"
                    />
                  </div>
                  <!-- 部件编号：列表/对比模式下点击在当前页打开产品详细信息；详情模式下为纯文本 -->
                  <a
                    v-if="!detailPart"
                    class="part-number part-number-link"
                    title="查看产品详细信息"
                    @click="openDetail(part)"
                  >
                    {{ part.wtPartNumber }}
                  </a>
                  <div v-else class="part-number" :title="part.wtPartNumber">{{ part.wtPartNumber }}</div>
                  <div v-if="part.name" class="part-name" :title="part.name">{{ part.name }}</div>
                  <!-- 详情模式：保留 Windchill 信息页外链入口（新标签页打开，URL 已含 Basic 认证凭据） -->
                  <AButton
                    v-if="detailPart && part.pageUrl"
                    size="small"
                    class="part-info-btn"
                    @click="openInfoPage(part)"
                  >
                    Windchill 信息页
                  </AButton>
                  <!-- 对比按钮：已选为实心红底，未选为红色描边；对比/详情模式下隐藏 -->
                  <AButton
                    v-if="!comparing && !detailPart"
                    size="small"
                    class="part-compare-btn"
                    :type="isCompared(part) ? 'primary' : 'default'"
                    danger
                    @click="toggleCompare(part)"
                  >
                    对比
                  </AButton>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in displayGroups" :key="group.name">
                <!-- 属性组标题行：拆为固定列格（随第一列锁定）+ 跨列格（随横向滚动） -->
                <tr class="group-row">
                  <td class="sticky-col group-cell-fixed" :style="{ backgroundColor: group.bgColor }">
                    <span class="group-bar"></span>
                    <span class="group-name">{{ group.name }}</span>
                  </td>
                  <td
                    class="group-cell-rest"
                    :colspan="tablePartList.length"
                    :style="{ backgroundColor: group.bgColor }"
                  ></td>
                </tr>
                <!-- 组内属性行：每个属性一行，上行 param、下行 displayName；paramColor 为该行背景色 -->
                <tr v-for="item in group.items" :key="item.internalName" class="param-row">
                  <td
                    class="param-label sticky-col"
                    :class="{ 'is-diff': highlightDiff && isDiffRow(item) }"
                    :style="{
                      backgroundColor:
                        highlightDiff && isDiffRow(item) ? '#fff1f0' : item.paramColor ? `#${item.paramColor}` : '#fff'
                    }"
                  >
                    <div class="param-name">{{ item.param }}</div>
                    <div v-if="item.displayName" class="param-display-name">{{ item.displayName }}</div>
                  </td>
                  <!-- 当前部件在该属性列上的取值：attrs 的 key 与 columnName 均为大写下划线格式 -->
                  <td
                    v-for="(part, partIndex) in tablePartList"
                    :key="`${item.internalName}-${partIndex}`"
                    class="part-cell"
                    :style="{
                      backgroundColor:
                        highlightDiff && isDiffRow(item) ? '#fff1f0' : item.paramColor ? `#${item.paramColor}` : '#fff'
                    }"
                    :class="{
                      'is-empty': isEmptyValue(getAttrValue(part, item.columnName)),
                      'is-diff': highlightDiff && isDiffRow(item)
                    }"
                  >
                    {{ formatValue(getAttrValue(part, item.columnName)) }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <AEmpty v-else-if="!loading" class="mt-12" :description="emptyText" />
        </ASpin>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "TLAArchitectureParameterConfig" });
  const props = defineProps<{
    /** 一级分类显示名称（二级分类的 parentDisplayName） */
    firstCategory: string;
    /** 二级分类显示名称（标题展示用，缺省时由父级兜底为内部名） */
    secondCategory: string;
    /** 产品分类（二级分类的原始 name） */
    productClassification: string;
  }>();
  const emit = defineEmits(["back"]);

  import { computed, ref } from "vue";
  import {
    Spin as ASpin,
    Empty as AEmpty,
    Button as AButton,
    Select as ASelect,
    Input as AInput,
    Checkbox as ACheckbox,
    Cascader as ACascader,
    Image as AImage
  } from "ant-design-vue";
  import type { PbiPart } from "@/api/pbi/model/TlaModel";
  import defaultImg from "../image/default.png";
  import { formatValue, getAttrValue, isEmptyValue } from "../utils/partValue";
  import { isSelectFilter, usePbiData } from "../hooks/usePbiData";
  import { usePartFilter } from "../hooks/usePartFilter";
  import { usePartCompare } from "../hooks/usePartCompare";
  import { useParamTable } from "../hooks/useParamTable";
  import { useCompetitorCascader } from "../hooks/useCompetitorCascader";

  // 1. 型号对比集与对比模式（先于数据加载创建，数据重载完成时回调重置）
  const {
    compareParts,
    comparing,
    isCompared,
    addCompare,
    toggleCompare,
    removeCompare,
    clearCompare,
    startCompare,
    exitCompare,
    reset: resetCompare,
    formatCompareLabel
  } = usePartCompare();

  /**
   * 产品详情层：点击表头部件编号后在当前页切换到单部件详情视图；
   * 非空时优先级高于对比模式，返回时清空即回到来源视图（普通列表或对比页）
   */
  const detailPart = ref<PbiPart | null>(null);

  // 2. 配置/部件/筛选属性并行加载，分类切换后重置对比状态与详情层
  const { loading, configList, partList, filterProperties, filterValues } = usePbiData(props, () => {
    resetCompare();
    detailPart.value = null;
  });

  // 3. 顶部筛选条件与过滤后的部件列表
  const { filteredPartList, buildSelectOptions, getTextValue, setTextValue, resetFilters } = usePartFilter({
    configList,
    partList,
    filterProperties,
    filterValues,
    isSelectFilter
  });

  /**
   * 普通模式页面标题：一级分类 + 二级分类 + 参数配置；
   * 任一分类名为空时自动跳过，避免出现连续空格
   */
  const pageTitle = computed(() => {
    const categories = [props.firstCategory, props.secondCategory].filter((name) => !!name);
    return `${categories.join(" ")} 参数配置`;
  });

  /** 顶部标题：详情层 > 对比模式 > 普通参数配置；详情标题为"编号,名称 产品详细信息" */
  const headerTitle = computed(() => {
    if (detailPart.value) {
      const { wtPartNumber, name } = detailPart.value;
      return `${name ? `${wtPartNumber},${name}` : wtPartNumber} 详细特性参数`;
    }
    if (comparing.value) return "型号对比";
    return pageTitle.value;
  });

  /**
   * 表格实际展示的部件列：
   * 详情层只展示当前部件一列；对比模式展示已加入对比的部件；普通模式展示筛选后的全部部件
   */
  const tablePartList = computed<PbiPart[]>(() => {
    if (detailPart.value) return [detailPart.value];
    return comparing.value ? compareParts.value : filteredPartList.value;
  });

  // 4. 属性分组、行状态（空/同/异）、列宽自适应与固定列阴影
  const {
    highlightDiff,
    hideSame,
    hideEmpty,
    displayGroups,
    isDiffRow,
    emptyText,
    tableWrapRef,
    wrapScrolled,
    handleTableScroll,
    firstColumnWidth,
    partColumnWidth,
    tableWidth,
    colStyle
  } = useParamTable({
    configList,
    partList,
    filteredPartList,
    tablePartList
  });

  /**
   * 表格滚动容器模板 ref 回调（组件卸载时 el 为 null）：
   * 写入表格 hook 的 ref，供固定列阴影判定与 ResizeObserver 宽度监听使用
   */
  const setWrapEl = (el: unknown) => {
    // 组件卸载时 el 为 null，而 hook 中 ref 初始类型为 HTMLElement | undefined，统一归一为 undefined
    tableWrapRef.value = (el as HTMLElement | null) ?? undefined;
  };

  // 5. 竞品三级级联（懒加载 + 产品搜索 + 选中叶子加入对比集）
  const {
    competitorPath,
    competitorTree,
    loadCompetitorData,
    renderCompetitorDropdown,
    handleCompetitorChange,
    handleCompetitorPopupChange
  } = useCompetitorCascader({
    props,
    partList,
    compareParts,
    addCompare
  });

  /**
   * 点击部件编号：在当前页切换到产品详细信息视图（复用参数表格，仅展示该部件一列）。
   * 部件数据已在内存中（含全部扩展属性），无需再次请求
   */
  const openDetail = (part: PbiPart) => {
    detailPart.value = part;
  };

  /**
   * 新标签页打开 Windchill 信息页（仅详情页头部入口使用）。
   * 顶层窗口导航允许 URL 携带 Basic 认证凭据（Chrome 仅禁止 iframe 等子资源内嵌凭据）
   */
  const openInfoPage = (part: PbiPart) => {
    if (!part.pageUrl) return;
    window.open(part.pageUrl, "_blank", "noopener");
  };

  // 左上角返回：详情层先退回来源视图，其次退出对比模式，普通模式返回系列列表
  const handleBack = () => {
    if (detailPart.value) {
      detailPart.value = null;
    } else if (comparing.value) {
      exitCompare();
    } else {
      emit("back");
    }
  };
</script>

<style lang="less" scoped>
  // 主体：左侧属性过滤面板 + 右侧表格
  .param-body {
    min-height: 0;
  }

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

  .compare-select {
    width: 100%;
    margin-bottom: 10px;
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

  // 表头对比按钮
  .part-compare-btn {
    margin-top: 8px;
    min-width: 64px;
    border-radius: 6px;
    font-weight: 600;
  }

  // 详情页 Windchill 信息页外链按钮
  .part-info-btn {
    margin-top: 8px;
    border-radius: 6px;
    font-weight: 600;
  }

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

  // 表格：separate 是 position:sticky 生效的前提（collapse 下固定列边框会丢失）；
  // fixed 布局 + colgroup 硬约束列宽，总宽由内联 width（各列求和）决定
  .param-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    background: #fff;
  }

  .param-table th,
  .param-table td {
    box-sizing: border-box;
  }

  // 左上角“特性参数”表头（固定列）
  .param-corner {
    position: sticky;
    left: 0;
    z-index: 3;
    padding: 16px;
    text-align: left;
    vertical-align: top;
    font-weight: 400;
    font-size: 13px;
    color: #8c8c8c;
    background: #fff;
    border-top: 1px solid #ebeef5;
    border-left: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  // 部件列表头（宽度由 colgroup 统一控制）
  .part-head {
    padding: 12px 10px;
    text-align: center;
    vertical-align: top;
    background: #fff;
    border-top: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  .part-image-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    max-width: 200px;
    height: 120px;
    margin: 0 auto;
    padding: 8px;
    background: #f5f6fa;
    border-radius: 8px;
  }

  // AImage 根节点为 span.ant-image，内部 img 由组件渲染，需 :deep 穿透控制尺寸
  .part-image {
    display: inline-flex;
    max-width: 100%;
    max-height: 104px;

    :deep(.ant-image-img) {
      max-width: 100%;
      max-height: 104px;
      object-fit: contain;
    }
  }

  .part-number {
    margin-top: 10px;
    font-size: 15px;
    font-weight: 700;
    line-height: 20px;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 部件编号链接：块级以继承省略与间距，红色系与页面对比按钮呼应
  a.part-number-link {
    display: block;
    color: #cf1322;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: #a8071a;
      text-decoration: underline;
    }
  }

  .part-name {
    margin-top: 2px;
    font-size: 12px;
    line-height: 18px;
    color: #9ca3af;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 属性组标题行：固定格随第一列锁定并承载标题，跨列格随横向滚动
  .group-cell-fixed {
    position: sticky;
    left: 0;
    z-index: 2;
    height: 38px;
    padding: 0;
    white-space: nowrap;
    border-left: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  .group-cell-rest {
    height: 38px;
    padding: 0;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  .group-bar {
    display: inline-block;
    width: 3px;
    height: 14px;
    margin: 0 10px 0 14px;
    vertical-align: middle;
    background: #f5222d;
    border-radius: 1px;
  }

  .group-name {
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: 0.5px;
    vertical-align: middle;
    text-transform: capitalize;
  }

  // 属性行
  .param-row td {
    padding: 9px 16px;
    border-bottom: 1px solid #f0f0f0;
    border-right: 1px solid #f0f0f0;
  }

  // 第一列属性名单元格：横向滚动时锁定
  .param-row .param-label {
    position: sticky;
    left: 0;
    z-index: 2;
    border-left: 1px solid #ebeef5;
  }

  .param-row .part-cell {
    padding: 9px 10px;
  }

  // 固定列右侧分隔阴影：仅在表格发生横向滚动后显示
  .param-table-wrap.is-scrolled .sticky-col {
    box-shadow: 6px 0 8px -6px rgba(15, 23, 42, 0.2);
  }

  .param-name {
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    color: #1f2937;
  }

  .param-display-name {
    margin-top: 2px;
    font-size: 12px;
    line-height: 18px;
    color: #9ca3af;
  }

  // 部件属性值单元格
  .part-cell {
    padding: 9px 10px;
    font-size: 13px;
    line-height: 20px;
    color: #374151;
    text-align: center;
    // 保留接口值中的换行（如多行规格描述）
    white-space: pre-line;
    word-break: break-word;
  }

  .part-cell.is-empty {
    color: #c0c4cc;
  }

  // 高亮不同参数：整行单元格文字标红加粗（背景色由内联样式控制，优先级高于 paramColor）
  .param-row .part-cell.is-diff {
    color: #cf1322;
    font-weight: 600;
  }

  // 第一列属性名随差异行一起高亮（锁定列背景不透明，滚动时红色不被穿透）
  .param-row .param-label.is-diff .param-name {
    color: #cf1322;
    font-weight: 600;
  }

  .param-row .param-label.is-diff .param-display-name {
    color: #cf1322;
    opacity: 0.75;
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

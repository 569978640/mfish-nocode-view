<template>
  <div class="param-config h-full w-full bg-white flex flex-col p-4">
    <!-- 顶部栏：对比模式下返回退出对比，普通模式返回系列列表 -->
    <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
      <div class="flex items-center gap-4">
        <AButton @click="handleBack">返回</AButton>
        <h2 class="text-xl font-bold m-0">{{ comparing ? "型号对比" : `${firstCategory} 特性参数配置` }}</h2>
      </div>
    </div>

    <!-- 筛选栏：按接口返回顺序依次列出筛选条件，values 非空为下拉、为空为输入框；对比模式隐藏 -->
    <div v-if="!comparing && filterProperties.length > 0" class="filter-bar">
      <span class="filter-title">筛选</span>
      <AButton type="primary" danger size="small" class="filter-reset" @click="resetFilters">全部</AButton>
      <div v-for="prop in filterProperties" :key="prop.name" class="filter-item">
        <span class="filter-item-label" :title="prop.displayName || prop.name">
          {{ prop.displayName || prop.name }}
        </span>
        <ASelect
          v-if="prop.values && prop.values.length > 0"
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
      <!-- 左侧面板：属性过滤始终保留；型号对比区仅普通模式展示 -->
      <aside v-if="tablePartList.length > 0" class="prop-filter">
        <div class="prop-filter-count">共 {{ tablePartList.length }} 款型号</div>
        <ACheckbox v-model:checked="highlightDiff" class="prop-filter-option">高亮不同参数</ACheckbox>
        <ACheckbox v-model:checked="hideSame" class="prop-filter-option">隐藏相同参数</ACheckbox>
        <ACheckbox v-model:checked="hideEmpty" class="prop-filter-option">隐藏暂无内容</ACheckbox>

        <!-- 型号对比区域：对比模式下隐藏 -->
        <div v-if="!comparing" class="compare-section">
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
        ref="tableWrapRef"
        class="param-table-wrap flex-1 overflow-auto mfish-page-content"
        :class="{ 'is-scrolled': wrapScrolled }"
        @scroll="handleTableScroll"
      >
        <ASpin :spinning="loading">
          <table
            v-if="displayGroups.length > 0"
            class="param-table"
            :style="{ width: `${tableWidth}px` }"
          >
            <!-- 列宽硬约束：第一列固定，部件列等宽；宽度之和即表格总宽 -->
            <colgroup>
              <col :style="colStyle(firstColumnWidth)" />
              <col v-for="(part, index) in tablePartList" :key="`col-${part.wtPartNumber}-${index}`" :style="colStyle(partColumnWidth)" />
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
                  <!-- 部件编号：有详情页地址时点击在浏览器新标签页打开 Windchill 信息页 -->
                  <a
                    v-if="part.pageUrl"
                    class="part-number part-number-link"
                    title="新标签页打开 Windchill 信息页"
                    @click="openInfoPage(part)"
                  >{{ part.wtPartNumber }}</a>
                  <div v-else class="part-number" :title="part.wtPartNumber">{{ part.wtPartNumber }}</div>
                  <div v-if="part.name" class="part-name" :title="part.name">{{ part.name }}</div>
                  <!-- 对比按钮：已选为实心红底，未选为红色描边；对比模式下隐藏 -->
                  <AButton
                    v-if="!comparing"
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
                  <td class="group-cell-rest" :colspan="tablePartList.length" :style="{ backgroundColor: group.bgColor }"></td>
                </tr>
                <!-- 组内属性行：每个属性一行，上行 param、下行 displayName；paramColor 为该行背景色 -->
                <tr
                  v-for="item in group.items"
                  :key="item.internalName"
                  class="param-row"
                >
                  <td
                    class="param-label sticky-col"
                    :class="{ 'is-diff': highlightDiff && isDiffRow(item) }"
                    :style="{
                      backgroundColor: highlightDiff && isDiffRow(item)
                        ? '#fff1f0'
                        : item.paramColor
                          ? `#${item.paramColor}`
                          : '#fff'
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
                      backgroundColor: highlightDiff && isDiffRow(item)
                        ? '#fff1f0'
                        : item.paramColor
                          ? `#${item.paramColor}`
                          : '#fff'
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
    /** 产品分类（二级分类的原始 name） */
    productClassification: string;
  }>();
  const emit = defineEmits(["back"]);

  import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, h } from "vue";
  import { Spin as ASpin, Empty as AEmpty, Button as AButton, Select as ASelect, Input as AInput, Checkbox as ACheckbox, Cascader as ACascader, Image as AImage } from "ant-design-vue";
  import { tlaApi } from "@/api/pbi/tla";
  import type { PbiParamConfigItem, PbiPart, PbiFilterProperty } from "@/api/pbi/model/TlaModel";
  import defaultImg from "../image/default.png";

  /** 属性组视图模型 */
  interface ParamGroup {
    /** 属性组名 */
    name: string;
    /** 属性组背景色（带 # 前缀） */
    bgColor: string;
    /** 组内属性列表 */
    items: PbiParamConfigItem[];
  }

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

  /** 左侧属性过滤开关：高亮不同参数 / 隐藏相同参数 / 隐藏暂无内容 */
  const highlightDiff = ref(false);
  const hideSame = ref(false);
  const hideEmpty = ref(false);

  /** 已加入对比的部件（按添加顺序，按 wtPartNumber 去重） */
  const compareParts = ref<PbiPart[]>([]);
  /** 是否处于对比模式（开始对比后为 true，仅展示对比部件且隐藏型号对比区） */
  const comparing = ref(false);

  /**
   * 点击部件编号：浏览器新标签页打开 Windchill 信息页。
   * 顶层窗口导航允许 URL 携带 Basic 认证凭据（Chrome 仅禁止 iframe 等子资源内嵌凭据）
   */
  const openInfoPage = (part: PbiPart) => {
    if (!part.pageUrl) return;
    window.open(part.pageUrl, "_blank", "noopener");
  };

  // 按 paramGroup 分组，保持接口返回顺序
  const groupList = computed<ParamGroup[]>(() => {
    const groupMap = new Map<string, ParamGroup>();
    for (const item of configList.value) {
      const name = item.paramGroup || "Other";
      let group = groupMap.get(name);
      if (!group) {
        group = {
          name,
          bgColor: item.groupColor ? `#${item.groupColor}` : "#E7E6E6",
          items: []
        };
        groupMap.set(name, group);
      }
      group.items.push(item);
    }
    return [...groupMap.values()];
  });

  // 空数据提示文案
  const emptyText = computed(() => {
    if (configList.value.length === 0) return "暂无属性配置";
    if (partList.value.length === 0) return "暂无产品型号";
    if (filteredPartList.value.length === 0) return "暂无符合筛选条件的产品型号";
    return "当前属性过滤条件下暂无展示参数";
  });

  /**
   * 读取部件在指定属性列上的值
   * attrs 的 key 与 columnName 都是大写下划线字符串，优先直接匹配，再兜底大小写不敏感匹配；
   * WTPARTNUMBER/NAME 后端未放入 attrs，回退取部件顶层字段
   */
  const getAttrValue = (part: PbiPart, columnName?: string) => {
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

  // 属性值为空时展示短横线（null、undefined、空串及纯空白字符串均视为空）
  const isEmptyValue = (value: unknown) =>
    value === null || value === undefined || (typeof value === "string" && value.trim() === "");

  const formatValue = (value: unknown) => (isEmptyValue(value) ? "-" : String(value));

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

  // 多选下拉选项：接口返回的可选值；未选择（空数组）即表示不过滤
  const buildSelectOptions = (values: string[]) => values.map((value) => ({ label: value, value }));

  // 判断筛选条件是否为下拉多选型（接口返回了可选值）
  const isSelectFilter = (prop: PbiFilterProperty) => !!(prop.values && prop.values.length > 0);

  // 输入框型条件的值读写（联合类型下保证 AInput 拿到 string）
  const getTextValue = (name: string) => {
    const value = filterValues[name];
    return typeof value === "string" ? value : "";
  };
  const setTextValue = (name: string, value: string) => {
    filterValues[name] = value;
  };

  // 清空所有筛选条件：下拉多选取空数组，输入框取空串
  const resetFilters = () => {
    for (const prop of filterProperties.value) {
      filterValues[prop.name] = isSelectFilter(prop) ? [] : "";
    }
  };

  /**
   * 按筛选条件过滤后的部件列表：
   * 同一条件内下拉多选为“包含任一选中值”（OR），输入框为忽略大小写的模糊包含；
   * 多个筛选条件之间为“同时满足”（AND）；
   * 筛选属性在属性配置中找不到对应列名时，该条件不参与过滤
   */
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

  /**
   * 表格实际展示的部件列：
   * 对比模式只展示已加入对比的部件，普通模式展示筛选后的全部部件
   */
  const tablePartList = computed<PbiPart[]>(() =>
    comparing.value ? compareParts.value : filteredPartList.value
  );

  // ---------------- 列宽与固定列 ----------------

  /** 表格横向滚动容器 */
  const tableWrapRef = ref<HTMLElement>();
  /** 滚动容器当前可用宽度（ResizeObserver 实时更新） */
  const wrapWidth = ref(0);
  /** 横向滚动位置是否已离开起点（用于控制固定列右侧阴影） */
  const wrapScrolled = ref(false);
  let resizeObserver: ResizeObserver | null = null;

  // 横向滚动时切换固定列阴影
  const handleTableScroll = (event: Event) => {
    wrapScrolled.value = (event.target as HTMLElement).scrollLeft > 2;
  };

  /** 第一列宽度上下限及左右内边距（16px * 2） */
  const FIRST_COL_MIN = 140;
  const FIRST_COL_MAX = 260;
  const FIRST_COL_PADDING = 32;
  /** 部件列最小宽度：部件很多时每列固定为此宽度并出现横向滚动条 */
  const PART_COL_MIN = 200;

  /**
   * 第一列（特性参数列）固定宽度：
   * 用 canvas 按真实字体测量全部属性配置中最长的 param/displayName 文本宽度 + 内边距，夹取上下限；
   * 基于全量配置而非当前展示行计算，勾选过滤复选框时宽度保持稳定
   */
  const firstColumnWidth = computed(() => {
    let maxTextWidth = 0;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        for (const item of configList.value) {
          ctx.font = '600 13px "PingFang SC", "Microsoft YaHei", sans-serif';
          maxTextWidth = Math.max(maxTextWidth, ctx.measureText(item.param || "").width);
          if (item.displayName) {
            ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
            maxTextWidth = Math.max(maxTextWidth, ctx.measureText(item.displayName).width);
          }
        }
      }
    } catch {
      // canvas 不可用时回退到最小宽度
    }
    return Math.min(FIRST_COL_MAX, Math.max(FIRST_COL_MIN, Math.ceil(maxTextWidth) + FIRST_COL_PADDING));
  });

  /**
   * 部件列宽：
   * 部件少时将容器剩余宽度均摊给各列（表格铺满，图片/编号居中更舒展）；
   * 部件多时保持 PART_COL_MIN 固定宽度，表格总宽超出容器即出现横向滚动条
   */
  const partColumnWidth = computed(() => {
    const count = tablePartList.value.length;
    if (count === 0 || wrapWidth.value === 0) return PART_COL_MIN;
    const available = wrapWidth.value - firstColumnWidth.value;
    return Math.max(PART_COL_MIN, Math.floor(available / count));
  });

  /** 表格总宽：第一列 + 所有部件列宽度求和（table-layout:fixed 下即为最终渲染宽度） */
  const tableWidth = computed(
    () => firstColumnWidth.value + tablePartList.value.length * partColumnWidth.value
  );

  /** col 列宽硬约束：width/min/max 同值，避免横向滚动时浏览器重新分配列宽 */
  const colStyle = (width: number) => ({
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`
  });

  // ---------------- 型号对比 ----------------

  // 部件是否已加入对比集
  const isCompared = (part: PbiPart) => compareParts.value.some((item) => item.wtPartNumber === part.wtPartNumber);

  // 点击表头对比按钮：已加入则移出，未加入则追加（保持添加顺序）
  const toggleCompare = (part: PbiPart) => {
    if (isCompared(part)) {
      compareParts.value = compareParts.value.filter((item) => item.wtPartNumber !== part.wtPartNumber);
    } else {
      compareParts.value = [...compareParts.value, part];
    }
  };

  // 从对比集移除单个部件
  const removeCompare = (part: PbiPart) => {
    compareParts.value = compareParts.value.filter((item) => item.wtPartNumber !== part.wtPartNumber);
  };

  // 清空对比集
  const clearCompare = () => {
    compareParts.value = [];
  };

  // ---------------- 选择竞品（三级级联：一级分类 → 二级分类 → 产品型号） ----------------

  /** 竞品级联节点 */
  interface CompetitorOption {
    /** 节点值：一级/二级为分类内部 name，叶子为接口返回的"编号,名称" */
    value: string;
    /** 节点展示文本：分类显示名 / 叶子部件编号 */
    label: string;
    /** 一级节点携带：一级分类显示名（查询部件接口的 firstCategory） */
    firstCategory?: string;
    /** 叶子节点携带：部件编号（"编号,名称"逗号前的部分） */
    partNumber?: string;
    /** 是否叶子节点（控制级联是否继续展开下一级） */
    isLeaf?: boolean;
    /** 懒加载中的状态标记（Cascader 据此显示加载态） */
    loading?: boolean;
    /** 二级节点持有：第三级产品叶子的全量列表（搜索过滤的数据源，与 children 区分） */
    rawLeaves?: CompetitorOption[];
    children?: CompetitorOption[];
  }

  /** 级联选项树（一级懒加载后常驻；二、三级展开时逐级加载） */
  const competitorTree = ref<CompetitorOption[]>([]);
  /** 级联当前选中路径（选中叶子加入对比后立即清空，便于连续添加） */
  const competitorPath = ref<string[]>([]);
  /** 第三级产品搜索关键字（仅过滤当前展开的产品列表） */
  const productKeyword = ref("");
  /** 当前展开第三列对应的二级节点引用（搜索过滤作用于该节点） */
  const currentProductNode = ref<CompetitorOption | null>(null);
  /** 跨分类完整部件缓存：key = firstCategory|productClassification，避免重复请求 */
  const competitorPartsCache = new Map<string, PbiPart[]>();

  /** 型号对比标签/标题统一文案：编号, 名称（名称为空时只显示编号） */
  const formatCompareLabel = (part: PbiPart) =>
    part.name ? `${part.wtPartNumber}, ${part.name}` : part.wtPartNumber;

  /** 加载一级分类（node1 末尾的 ALL 兜底节点不属于真实分类，过滤掉） */
  const loadFirstCategories = async () => {
    if (competitorTree.value.length > 0) return;
    const list = await tlaApi.getCategoryList();
    const nodes = list
      .filter((node) => node.name !== "ALL")
      .map((node) => ({
        value: node.name,
        label: node.displayName || node.name,
        firstCategory: node.displayName || node.name,
        isLeaf: false
      }));
    // 无一级分类时展示禁用占位项，避免点开空白无反馈
    competitorTree.value =
      nodes.length > 0 ? nodes : [buildEmptyOption("empty-category", "暂无分类")];
  };

  /** 构造级联空态占位节点：灰色禁用、不可选中、不再展开下一级 */
  const buildEmptyOption = (value: string, label: string): CompetitorOption => ({
    value,
    label,
    disabled: true,
    isLeaf: true
  });

  /**
   * 级联懒加载（rc-cascader 每次展开非叶子节点都会回调，不区分 children 是否已加载）：
   * 选中一级 → 按一级内部 name 加载二级分类；
   * 选中二级 → 按一级显示名 + 二级内部 name 加载"编号,名称"产品型号选项；
   * 任一级查询结果为空时插入"暂无XX"禁用占位项。
   * 注意：二级节点即使产品已缓存，每次展开也必须把搜索作用域切到当前节点，
   * 否则搜索框会一直过滤上一个型号的列表
   */
  const loadCompetitorData = async (selectedOptions: CompetitorOption[]) => {
    const current = selectedOptions[selectedOptions.length - 1];
    if (!current) return;

    // 二级节点展开：加载（或复用缓存）产品，并把搜索框作用域指向当前节点
    if (selectedOptions.length === 2) {
      current.loading = true;
      try {
        // 切换到不同型号时清空上次的搜索关键字（watch 会顺带恢复旧节点的全量列表）
        if (currentProductNode.value?.value !== current.value) {
          productKeyword.value = "";
        }
        currentProductNode.value = current;
        if (!current.rawLeaves) {
          const firstCategory = selectedOptions[0].firstCategory || selectedOptions[0].value;
          const options = await tlaApi.getPartOptions(firstCategory, current.value);
          // 无产品时只标记全量列表为空，占位项由 applyProductFilter 统一生成，避免被过滤逻辑覆盖
          const comparedNumbers = new Set(compareParts.value.map((part) => part.wtPartNumber));
          current.rawLeaves = (options || []).map((option) => {
            const commaIndex = option.indexOf(",");
            const partNumber = commaIndex >= 0 ? option.slice(0, commaIndex) : option;
            const partName = commaIndex >= 0 ? option.slice(commaIndex + 1) : "";
            return {
              value: option,
              label: partName ? `${partNumber}, ${partName}` : partNumber,
              partNumber,
              isLeaf: true,
              disabled: comparedNumbers.has(partNumber)
            };
          });
        }
        applyProductFilter(current);
      } catch {
        // 加载失败时置空子级（非占位），菜单重新展开可再次触发加载重试
        current.children = [];
      } finally {
        current.loading = false;
      }
      return;
    }

    // 一级节点展开：二级分类已加载则直接复用
    if (current.children) return;
    current.loading = true;
    try {
      const list = await tlaApi.getSeriesList(current.value);
      if (!list || list.length === 0) {
        current.children = [buildEmptyOption(`empty-series-${current.value}`, "暂无型号")];
        return;
      }
      current.children = list.map((node) => ({
        value: node.name,
        label: node.displayName || node.name,
        isLeaf: false
      }));
    } catch {
      // 加载失败时置空子级（非占位），菜单重新展开可再次触发加载重试
      current.children = [];
    } finally {
      current.loading = false;
    }
  };

  /**
   * 按搜索框关键字过滤当前二级节点的产品叶子，只作用于当前列表的下拉值：
   * 同时匹配下拉显示文本（编号, 名称）与原始值（编号,名称），忽略大小写，
   * 避免逗号后是否带空格、名称内部含逗号导致漏匹配；
   * 关键字为空恢复全量；该分类无产品时展示"暂无产品"；有关键字但无匹配时展示"暂无匹配产品"
   */
  const applyProductFilter = (node: CompetitorOption) => {
    const leaves = node.rawLeaves || [];
    // 该分类本身没有任何产品时，无论是否输入关键字都提示"暂无产品"
    if (leaves.length === 0) {
      node.children = [buildEmptyOption(`empty-product-${node.value}`, "暂无产品")];
      return;
    }
    const keyword = productKeyword.value.trim().toLowerCase();
    if (!keyword) {
      node.children = leaves;
      return;
    }
    const matched = leaves.filter((leaf) =>
      `${leaf.label} ${leaf.value}`.toLowerCase().includes(keyword)
    );
    node.children =
      matched.length > 0 ? matched : [buildEmptyOption(`empty-match-${node.value}`, "暂无匹配产品")];
  };

  // 搜索关键字变化时实时过滤当前产品列表
  watch(productKeyword, () => {
    if (currentProductNode.value) applyProductFilter(currentProductNode.value);
  });

  // 级联弹层关闭时清空搜索关键字（watch 会同步把已缓存节点的产品列表恢复全量）
  const handleCompetitorPopupChange = (open: boolean) => {
    if (!open) productKeyword.value = "";
  };

  /**
   * Cascader 弹层自定义渲染（Cascader 不支持 dropdownRender 插槽，必须用 prop 渲染函数）：
   * 在多列菜单外层包一层容器，并注入悬浮于第三列顶部的产品搜索框
   */
  const renderCompetitorDropdown = ({ menuNode }: { menuNode?: unknown }) =>
    h("div", { class: "competitor-dropdown" }, [
      h(AInput, {
        value: productKeyword.value,
        "onUpdate:value": (value: string) => {
          productKeyword.value = value;
        },
        size: "small",
        allowClear: true,
        placeholder: "搜索编号或名称",
        class: "competitor-product-search",
        // 阻止 mousedown 冒泡，避免点击搜索框被误判为菜单交互导致焦点丢失或路径切换
        onMousedown: (event: Event) => event.stopPropagation()
      }),
      menuNode as never
    ]);

  /**
   * 获取竞品完整部件：
   * 当前分类直接复用已加载的 partList；其他分类按需调用产品型号接口并缓存
   */
  const resolveCompetitorPart = async (
    firstCategory: string,
    productClassification: string,
    partNumber: string
  ): Promise<PbiPart | undefined> => {
    if (firstCategory === props.firstCategory && productClassification === props.productClassification) {
      return partList.value.find((part) => part.wtPartNumber === partNumber);
    }
    const cacheKey = `${firstCategory}|${productClassification}`;
    let list = competitorPartsCache.get(cacheKey);
    if (!list) {
      list = await tlaApi.getPartsByClassification(firstCategory, productClassification);
      competitorPartsCache.set(cacheKey, list || []);
    }
    return list.find((part) => part.wtPartNumber === partNumber);
  };

  /** 选中叶子型号后拉取完整部件加入对比集，并重置级联选择器 */
  const handleCompetitorChange = async (value: string[], selectedOptions: CompetitorOption[]) => {
    competitorPath.value = [];
    if (!value || value.length !== 3) return;
    const firstCategory = selectedOptions[0]?.firstCategory || value[0];
    const productClassification = value[1];
    const partNumber = selectedOptions[2]?.partNumber || value[2].split(",")[0];
    const part = await resolveCompetitorPart(firstCategory, productClassification, partNumber);
    if (part && !isCompared(part)) {
      compareParts.value = [...compareParts.value, part];
    }
  };

  // 对比集变化时，同步已加载的型号叶子禁用态（移除后叶子恢复可选）；
  // rawLeaves（全量）与 children（搜索过滤后）都要同步，避免被关键字隐藏的叶子状态遗漏
  watch(compareParts, (parts) => {
    const numbers = new Set(parts.map((part) => part.wtPartNumber));
    const syncLeaf = (leaf: CompetitorOption) => {
      if (leaf.partNumber) leaf.disabled = numbers.has(leaf.partNumber);
    };
    for (const level1 of competitorTree.value) {
      for (const level2 of level1.children || []) {
        (level2.rawLeaves || []).forEach(syncLeaf);
        (level2.children || []).forEach(syncLeaf);
      }
    }
  });

  // 开始对比：至少选择 2 款型号
  const startCompare = () => {
    if (compareParts.value.length < 2) return;
    comparing.value = true;
  };

  // 左上角返回：对比模式退出对比页，普通模式返回系列列表
  const handleBack = () => {
    if (comparing.value) {
      comparing.value = false;
    } else {
      emit("back");
    }
  };

  /**
   * 属性行状态：基于当前表格展示的部件列统计每个属性行（internalName）的取值
   * - empty：所有部件值均为空（暂无内容）
   * - same：所有部件都有值且完全一致（相同参数，要求完全相等，含空值的行不算相同）
   * - diff：其他情况——非空值存在差异，或部分部件有值、部分为空
   */
  type RowState = "empty" | "same" | "diff";
  const rowStateMap = computed<Map<string, RowState>>(() => {
    const stateMap = new Map<string, RowState>();
    for (const group of groupList.value) {
      for (const item of group.items) {
        const cellTexts = tablePartList.value.map((part) => {
          const value = getAttrValue(part, item.columnName);
          return isEmptyValue(value) ? null : String(value).trim();
        });
        const nonEmptyValues = cellTexts.filter((text): text is string => text !== null);
        if (nonEmptyValues.length === 0) {
          // 整行值都是 null/空：暂无内容
          stateMap.set(item.internalName, "empty");
        } else if (nonEmptyValues.length === cellTexts.length && new Set(nonEmptyValues).size === 1) {
          // 每个部件都有值且完全一致：相同参数
          stateMap.set(item.internalName, "same");
        } else {
          // 取值不一致，或存在空值：不同参数
          stateMap.set(item.internalName, "diff");
        }
      }
    }
    return stateMap;
  });

  /**
   * 应用左侧属性过滤后的分组与属性行：
   * 隐藏暂无内容 → 去掉 empty 行；隐藏相同参数 → 去掉 same 行；组内无可见行时整组不展示
   */
  const displayGroups = computed<ParamGroup[]>(() => {
    return groupList.value
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const state = rowStateMap.value.get(item.internalName);
          if (hideEmpty.value && state === "empty") return false;
          if (hideSame.value && state === "same") return false;
          return true;
        })
      }))
      .filter((group) => group.items.length > 0);
  });

  /**
   * 判断某属性行是否需要按“不同参数”高亮：
   * 只要行内有一个部件的值与其他不一致（或存在空值）即为 diff，整行属性值单元格统一高亮
   */
  const isDiffRow = (item: PbiParamConfigItem) => rowStateMap.value.get(item.internalName) === "diff";

  // 并行加载特性参数展示配置、产品型号列表与筛选属性（筛选属性按二级分类节点查询）
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
      // 分类变化重新加载后重置对比状态，避免残留旧分类的部件
      comparing.value = false;
      compareParts.value = [];
      competitorPath.value = [];
    } finally {
      loading.value = false;
    }
  };

  watch(() => [props.firstCategory, props.productClassification], loadData);

  onMounted(() => {
    loadData();
    // 预加载竞品级联的一级分类
    loadFirstCategories();
    // 监听表格容器宽度变化（窗口缩放、侧边栏折叠等），驱动部件列宽自适应
    if (tableWrapRef.value) {
      wrapWidth.value = tableWrapRef.value.clientWidth;
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          wrapWidth.value = entry.contentRect.width;
        }
      });
      resizeObserver.observe(tableWrapRef.value);
    }
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
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

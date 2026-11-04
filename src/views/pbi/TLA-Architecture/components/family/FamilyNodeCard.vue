<template>
  <!-- 图谱节点卡片：卡片头按状态/阶段着色 + DOC/DPF/SCR 规格标签（属性名/值双色区分） + 实际发货量 -->
  <div class="family-node">
    <div class="family-node__header" :class="{ 'is-light': isLightHeader }" :style="{ background: headerBackground }">
      <span class="family-node__icon">
        <!-- 部件图片：复用参数配置同款 AImage，点击悬浮放大预览；地址为空时展示四宫格模块图标；图片加载失败由 fallback 回退同款图标 -->
        <AImage
          v-if="data.image"
          :src="data.image"
          :fallback="iconFallback"
          :alt="data.wtPartNumber"
          :preview="{ title: data.wtPartNumber }"
          class="family-node__img"
        />
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
        </svg>
      </span>
      <div class="family-node__titles">
        <!-- 部件编号可点击：进入该部件的详细特性参数页 -->
        <button
          type="button"
          class="family-node__pn"
          title="查看产品详细信息"
          @click="emit('part-click', data.wtPartNumber)"
        >
          PN：{{ data.wtPartNumber }}
        </button>
        <div class="family-node__state">状态：{{ stateText }}</div>
      </div>
    </div>
    <!-- 规格区：DOC/DPF/SCR 三个标签始终展示、一行一个、统一整行等宽（有值无值左右边缘对齐）；值含逗号只显示首个逗号前内容 -->
    <div class="family-node__body">
      <!-- 规格标签：左侧深蓝灰属性名块 + 右侧白色值块，双色区分 -->
      <span class="family-spec">
        <span class="family-spec__name">DOC</span>
        <span class="family-spec__value">{{ docText }}</span>
      </span>
      <span class="family-spec">
        <span class="family-spec__name">DPF</span>
        <span class="family-spec__value">{{ dpfText }}</span>
      </span>
      <span class="family-spec">
        <span class="family-spec__name">SCR</span>
        <span class="family-spec__value">{{ scrText }}</span>
      </span>
    </div>
    <!-- 实际发货量：始终展示，后端未返回或为空时显示 0（0 本身为有效值） -->
    <div class="family-node__footer">实际发货量：{{ shipmentText }}</div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { Image as AImage } from "ant-design-vue";
  import type { FamilyTreeNode } from "@/api/pbi/model";

  defineOptions({ name: "FamilyNodeCard" });
  const props = defineProps<{ data: FamilyTreeNode }>();
  /** 点击部件编号：向上抛出部件编号，由图谱页跳转详细特性参数页 */
  const emit = defineEmits<{ (e: "part-click", wtPartNumber: string): void }>();

  /**
   * 四宫格模块图标的内联 SVG data URI，作为 AImage 加载失败时的 fallback，
   * 保证坏图与"无地址"展示完全一致（白色图标，置于图标块半透明白底上）
   */
  const iconFallback = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="#fff"/>' +
      '<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="#fff"/>' +
      '<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="#fff"/>' +
      '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="#fff"/>' +
      "</svg>"
  )}`;

  /**
   * 规格值展示格式化：无值（undefined/null/空串）返回空串；
   * 有值时只显示第一个逗号（兼容中英文逗号）之前的内容并去除首尾空白
   * 如 "12*3.5,YIXING+BASF,..." -> "12*3.5"
   */
  const formatSpec = (value?: string) => {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    return value.split(/[,，]/)[0].trim();
  };

  const releasePhaseText = computed(() => formatSpec(props.data.releasePhaseCode));

  /** 默认卡片头背景（非RELEASED/阶段未匹配时保持原红色渐变） */
  const DEFAULT_HEADER_BACKGROUND = "linear-gradient(90deg, #d43030 0%, #c62828 100%)";

  /** 阶段值对应卡片头颜色（兼容完整名称、缩写与带括号写法，匹配时忽略大小写和空格） */
  const PHASE_COLOR_MAP: Record<string, string> = {
    "PRODUCTION(P)": "#00aee8",
    PRODUCTION: "#00aee8",
    P: "#00aee8",
    "LIMITED(L)": "#00a86b",
    LIMITED: "#00a86b",
    L: "#00a86b",
    "DEVELOPMENT(D)": "#96d05b",
    DEVELOPMENT: "#96d05b",
    D: "#96d05b",
    "EXPERIMENTAL(E)": "#d7e8d4",
    EXPERIMENTAL: "#d7e8d4",
    E: "#d7e8d4",
    "CONCEPT(X)": "#d7e8d4",
    CONCEPT: "#d7e8d4",
    X: "#d7e8d4"
  };

  /** 浅色卡片头：需要切换为深色文字，保证白底浅绿场景可读 */
  const LIGHT_HEADER_COLORS = new Set(["#96d05b", "#d7e8d4"]);

  /** 卡片头底色：OBSOLETE=灰色；RELEASED按阶段值着色；其他状态或阶段未匹配保持默认红色渐变 */
  const headerColor = computed(() => {
    if (props.data.state === "OBSOLETE") {
      return "#808080";
    }
    if (props.data.state === "RELEASED") {
      const phaseKey = releasePhaseText.value.replaceAll(/\s+/g, "").toUpperCase();
      return PHASE_COLOR_MAP[phaseKey] ?? "";
    }
    return "";
  });

  const headerBackground = computed(() => headerColor.value || DEFAULT_HEADER_BACKGROUND);
  const isLightHeader = computed(() => LIGHT_HEADER_COLORS.has(headerColor.value));

  /** 生命周期状态中文映射：RELEASED=已发布（阶段为空时的兜底）、OBSOLETE=已废弃 */
  const STATE_TEXT_MAP: Record<string, string> = {
    RELEASED: "已发布",
    OBSOLETE: "已废弃"
  };

  const docText = computed(() => formatSpec(props.data.doc));
  const dpfText = computed(() => formatSpec(props.data.dpf));
  const scrText = computed(() => formatSpec(props.data.scrAsc));

  /** 状态展示：RELEASED 时显示阶段值（阶段为空回退已发布），OBSOLETE 显示已废弃，其他原样展示 */
  const stateText = computed(() => {
    if (props.data.state === "RELEASED") {
      return releasePhaseText.value || STATE_TEXT_MAP.RELEASED;
    }
    return STATE_TEXT_MAP[props.data.state] ?? props.data.state ?? "";
  });

  /** 实际发货量：缺失/空串时显示 0，0 等其它有效值原样展示 */
  const shipmentText = computed(() =>
    props.data.shipment === undefined || props.data.shipment === null || props.data.shipment === ""
      ? 0
      : props.data.shipment
  );
</script>

<style lang="less" scoped>
  // 卡片尺寸需与布局常量 FAMILY_NODE_W/H 保持一致，Vue Flow 据此计算连线锚点
  .family-node {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 220px;
    height: 160px;
    padding: 0;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    // 悬停浮起过渡
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  // 悬停效果：卡片轻微上浮 + 红色描边 + 红色系投影
  .family-node:hover {
    z-index: 10;
    transform: translateY(-3px);
    border-color: #f5222d;
    box-shadow: 0 10px 24px rgba(212, 48, 48, 0.22);
  }

  // ---------- 卡片头：按状态/阶段着色 ----------
  .family-node__header {
    display: flex;
    align-items: center;
    height: 48px;
    padding: 0 12px;
    background: linear-gradient(90deg, #d43030 0%, #c62828 100%);
  }

  // 浅色卡片头（亮绿/浅绿阶段）：文字与图标底色改为深色，保证可读性
  .family-node__header.is-light {
    .family-node__pn,
    .family-node__state {
      color: #1f2937;
    }

    .family-node__icon {
      color: #1f2937;
      background: rgba(31, 41, 55, 0.12);
    }
  }

  .family-node__icon {
    display: inline-flex;
    flex: 0 0 26px;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-right: 8px;
    overflow: hidden;
    color: #fff;
    background: rgba(255, 255, 255, 0.22);
    border-radius: 6px;
  }

  // AImage 组件填满图标块：wrapper 与内部 img 均铺满，保持比例居中裁剪并继承圆角
  .family-node__img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 6px;

    :deep(.ant-image-img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }
  }

  .family-node__titles {
    min-width: 0;
  }

  // 部件编号：用 button 承载点击，样式重置为与原文本一致，hover 下划线提示可点击
  .family-node__pn {
    display: block;
    width: 100%;
    padding: 0;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    color: #fff;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .family-node__state {
    font-size: 11px;
    line-height: 16px;
    color: rgba(255, 255, 255, 0.85);
  }

  // 规格区：三个标签纵向一行一个、统一整行等宽
  .family-node__body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 12px 2px;
  }

  // ---------- 规格标签（属性名深蓝灰底 / 值白底，整行等宽） ----------
  .family-spec {
    display: flex;
    align-items: stretch;
    width: 100%;
    height: 22px;
    overflow: hidden;
    font-size: 11px;
    line-height: 22px;
    background: #f7f8fa;
    border: 1px solid #e3e6ec;
    border-radius: 5px;
    white-space: nowrap;
  }

  // 属性名：深蓝灰底白色字，固定宽度三标签上下对齐
  .family-spec__name {
    display: inline-flex;
    flex: 0 0 42px;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: #fff;
    background: #5a6577;
  }

  // 属性值：浅灰底深色加粗字，占满标签剩余宽度，左对齐、超长省略
  .family-spec__value {
    display: inline-flex;
    flex: 1 1 auto;
    align-items: center;
    min-width: 0;
    padding: 0 10px;
    overflow: hidden;
    font-weight: 700;
    color: #353535;
    text-overflow: ellipsis;
    background: #f7f8fa;
  }

  .family-node__footer {
    margin-top: auto;
    padding: 4px 12px 8px;
    font-size: 11px;
    color: #9ca3af;
  }
</style>

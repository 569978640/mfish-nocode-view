<template>
  <!-- 参数配置表格：每个部件一列，超出宽度出现横向滚动条；第一列固定不随横向滚动 -->
  <div
    :ref="(el) => setWrapEl(el)"
    class="param-table-wrap flex-1 overflow-auto mfish-page-content"
    :class="{ 'is-scrolled': wrapScrolled }"
    @scroll="(event) => onScroll(event)"
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
                v-if="!isDetail"
                class="part-number part-number-link"
                title="查看产品详细信息"
                @click="emit('open-detail', part)"
              >
                {{ part.wtPartNumber }}
              </a>
              <div v-else class="part-number" :title="part.wtPartNumber">{{ part.wtPartNumber }}</div>
              <div v-if="part.name" class="part-name" :title="part.name">{{ part.name }}</div>
              <!-- 详情模式：保留 Windchill 信息页外链入口（新标签页打开，URL 已含 Basic 认证凭据） -->
              <AButton
                v-if="isDetail && part.pageUrl"
                size="small"
                class="part-info-btn"
                @click="emit('open-info-page', part)"
              >
                Windchill 信息页
              </AButton>
              <!-- 对比按钮：已选为实心红底，未选为红色描边；对比/详情模式下隐藏 -->
              <AButton
                v-if="!comparing && !isDetail"
                size="small"
                class="part-compare-btn"
                :type="isCompared(part) ? 'primary' : 'default'"
                danger
                @click="emit('toggle-compare', part)"
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
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiParamTable" });
  defineProps<{
    /** 数据加载中 */
    loading: boolean;
    /** 属性过滤后实际展示的属性分组 */
    displayGroups: ParamGroup[];
    /** 空数据提示文案 */
    emptyText: string;
    /** 表格实际展示的部件列（详情/对比/普通模式由容器计算） */
    tablePartList: PbiPart[];
    /** 表格总宽（px） */
    tableWidth: number;
    /** 第一列（特性参数列）固定宽度（px） */
    firstColumnWidth: number;
    /** 部件列宽度（px） */
    partColumnWidth: number;
    /** col 列宽硬约束样式 */
    colStyle: (width: number) => Record<string, string>;
    /** 横向滚动是否已离开起点（控制固定列阴影） */
    wrapScrolled: boolean;
    /** 是否高亮不同参数 */
    highlightDiff: boolean;
    /** 判断属性行是否为差异行 */
    isDiffRow: (item: PbiParamConfigItem) => boolean;
    /** 判断部件是否已加入对比集（控制对比按钮实心/描边） */
    isCompared: (part: PbiPart) => boolean;
    /** 是否处于型号对比模式 */
    comparing: boolean;
    /** 是否产品详情模式（单列） */
    isDetail: boolean;
    /** 表格滚动容器 ref 回调（卸载时 el 为 null） */
    setWrapEl: (el: unknown) => void;
    /** 横向滚动事件回调（切换固定列阴影） */
    onScroll: (event: Event) => void;
  }>();
  const emit = defineEmits<{
    /** 点击部件编号：打开产品详细信息 */
    (e: "open-detail", part: PbiPart): void;
    /** 点击表头对比按钮：加入/移出对比集 */
    (e: "toggle-compare", part: PbiPart): void;
    /** 详情模式点击 Windchill 信息页：新标签页打开外链 */
    (e: "open-info-page", part: PbiPart): void;
  }>();
  import { Spin as ASpin, Empty as AEmpty, Button as AButton, Image as AImage } from "ant-design-vue";
  import type { PbiParamConfigItem, PbiPart } from "@/api/pbi/model";
  import type { ParamGroup } from "../../hooks/useParamTable";
  import { formatValue, getAttrValue, isEmptyValue } from "../../utils/partValue";
  import defaultImg from "../../image/default.png";
</script>

<style lang="less" scoped>
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

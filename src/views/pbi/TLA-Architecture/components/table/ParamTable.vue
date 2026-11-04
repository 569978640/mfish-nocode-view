<template>
  <!-- 参数配置表格：每个部件一列，超出宽度出现横向滚动条；第一列固定不随横向滚动 -->
  <div
    :ref="handleWrapEl"
    class="param-table-wrap flex-1 overflow-auto mfish-page-content"
    :class="{ 'is-scrolled': wrapScrolled }"
    @scroll="(event) => onScroll(event)"
  >
    <ASpin :spinning="loading">
      <table v-if="displayGroups.length > 0" class="param-table" :style="{ width: `${effectiveTableWidth}px` }">
        <!-- 列宽硬约束：第一列固定，部件列等宽；双图部件列加宽以并排展示两张原尺寸图片 -->
        <colgroup>
          <col :style="colStyle(firstColumnWidth)" />
          <col
            v-for="(part, index) in tablePartList"
            :key="`col-${part.wtPartNumber}-${index}`"
            :style="colStyle(partColumnWidths[index] ?? partColumnWidth)"
          />
        </colgroup>
        <thead>
          <tr>
            <th class="param-corner sticky-col">特性参数</th>
            <!-- 部件列：图片 + 部件编号 + 部件名称 + 对比按钮 -->
            <th v-for="(part, index) in tablePartList" :key="`${part.wtPartNumber}-${index}`" class="part-head">
              <div class="part-image-wrap" :class="{ 'is-multi': (partImages[part.wtPartNumber]?.length ?? 0) > 1 }">
                <!-- 点击图片在悬浮窗中放大预览；双图并排展示，无图或全部加载失败时回退默认图 -->
                <AImage
                  v-for="(src, imgIndex) in displayImages(part)"
                  :key="`${part.wtPartNumber}-img-${imgIndex}`"
                  :src="src"
                  :fallback="defaultImg"
                  :alt="part.wtPartNumber"
                  :preview="{ title: imgIndex > 0 ? `${part.wtPartNumber} 图${imgIndex + 1}` : part.wtPartNumber }"
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
          <template v-for="(group, groupIndex) in displayGroups" :key="group.name">
            <!-- 属性组标题行：拆为固定列格（随第一列锁定）+ 跨列格（随横向滚动）；可折叠组整行可点击 -->
            <tr class="group-row" :class="{ 'is-foldable': group.allowFold }" @click="toggleGroup(group)">
              <td class="sticky-col group-cell-fixed" :style="{ backgroundColor: group.bgColor }">
                <span v-if="group.allowFold" class="group-fold-icon">
                  <RightOutlined v-if="isGroupCollapsed(group)" />
                  <DownOutlined v-else />
                </span>
                <span class="group-bar"></span>
                <span class="group-name">{{ group.name }}</span>
              </td>
              <!-- 折叠后按部件列展示组头汇总值；未折叠或无有效汇总配置时保持整行空白 -->
              <template v-if="isGroupCollapsed(group) && group.foldConfig">
                <td
                  v-for="(part, partIndex) in tablePartList"
                  :key="`fold-${group.name}-${partIndex}`"
                  class="group-cell-part"
                  :style="{ backgroundColor: group.bgColor }"
                >
                  {{ getFoldSummaryValue(part, group) }}
                </td>
              </template>
              <td
                v-else
                class="group-cell-rest"
                :colspan="tablePartList.length"
                :style="{ backgroundColor: group.bgColor }"
              ></td>
            </tr>
            <!-- 组内属性行：折叠后隐藏，仅保留组头一行；第一个属性组的前两行纵向滚动时固定在表头下方 -->
            <template v-if="!isGroupCollapsed(group)">
              <tr
                v-for="(item, itemIndex) in group.items"
                :key="item.internalName"
                class="param-row"
                :class="{
                  'pin-row-1': groupIndex === 0 && itemIndex === 0,
                  'pin-row-2': groupIndex === 0 && itemIndex === 1
                }"
              >
                <td
                  class="param-label sticky-col"
                  :class="{ 'is-diff': highlightDiff && isDiffRow(item) }"
                  :style="{
                    backgroundColor:
                      highlightDiff && isDiffRow(item) ? '#fff1f0' : item.paramColor ? `#${item.paramColor}` : '#fff'
                  }"
                >
                  <div class="param-name">
                    {{ item.param }}
                    <span v-if="item.displayName" class="param-display-name">({{ item.displayName }})</span>
                  </div>
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
          </template>
        </tbody>
      </table>
      <AEmpty v-else-if="!loading" class="mt-12" :description="emptyText" />
    </ASpin>
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, watch } from "vue";
  import { Spin as ASpin, Empty as AEmpty, Button as AButton, Image as AImage } from "ant-design-vue";
  import { DownOutlined, RightOutlined } from "@ant-design/icons-vue";
  import type { PbiParamConfigItem, PbiPart } from "@/api/pbi/model";
  import type { ParamGroup } from "../../hooks/useParamTable";
  import { formatValue, getAttrValue, isEmptyValue } from "../../utils/partValue";
  import defaultImg from "../../image/default.png";

  defineOptions({ name: "PbiParamTable" });

  const props = defineProps<{
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

  /** 双图部件列宽度：单图最大184px × 2 + 图片间距6px + 图片区内边距16px + 表头内边距20px */
  const DOUBLE_IMAGE_PART_WIDTH = 410;

  /** 可折叠属性组的折叠状态：key 为组名，可折叠组首次出现时默认折叠 */
  const collapsedGroups = reactive(new Set<string>());
  /** 已初始化折叠状态的组名，避免属性过滤导致组重新出现时重置用户操作 */
  const knownGroups = new Set<string>();

  /** 该属性组当前是否处于折叠状态 */
  const isGroupCollapsed = (group: ParamGroup): boolean => collapsedGroups.has(group.name);

  // 属性组首次出现时按 allowFold 初始化：为"是"的组默认折叠，不可折叠组保持展开
  watch(
    () => props.displayGroups,
    (groups) => {
      groups.forEach((group) => {
        if (knownGroups.has(group.name)) return;
        knownGroups.add(group.name);
        if (group.allowFold) collapsedGroups.add(group.name);
      });
    },
    { immediate: true }
  );

  /**
   * 折叠组头汇总值：按分组阶段解析好的属性列取值；
   * 带序号时按英文逗号分段取对应段（序号从 1 开始），空值或越界统一显示短横线
   */
  const getFoldSummaryValue = (part: PbiPart, group: ParamGroup): string => {
    const fold = group.foldConfig;
    if (!fold) return "";
    const value = getAttrValue(part, fold.columnName);
    if (isEmptyValue(value)) return formatValue(value);
    const text = String(value);
    if (fold.index === undefined) return text;
    const segments = text.split(",").map((segment) => segment.trim());
    return formatValue(segments[fold.index - 1]);
  };

  /** 第二张图片存在性缓存：key为图片地址，跨页面复用避免重复探测；true=存在，false=不存在 */
  const secondImageExists = reactive(new Map<string, boolean>());

  /** 正在探测中的图片地址，避免重复发起加载 */
  const probingImages = new Set<string>();

  /** 探测第二张图片是否存在：静态目录无文件清单，只能通过实际加载结果判断 */
  const probeSecondImage = (url?: string) => {
    if (!url || secondImageExists.has(url) || probingImages.has(url)) return;
    probingImages.add(url);
    const image = new Image();
    image.addEventListener("load", () => {
      secondImageExists.set(url, true);
      probingImages.delete(url);
    });
    image.addEventListener("error", () => {
      secondImageExists.set(url, false);
      probingImages.delete(url);
    });
    image.src = url;
  };

  /** 每个部件实际展示的图片：第一张始终展示，第二张确认存在后才加入 */
  const partImages = computed<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};
    props.tablePartList.forEach((part) => {
      const urls = part.images?.length ? part.images : part.image ? [part.image] : [];
      // 第二张图需探测确认存在才渲染，避免加载失败的破损图占位
      result[part.wtPartNumber] = urls.filter((url, index) => index === 0 || secondImageExists.get(url) === true);
    });
    return result;
  });

  /** 表头图片列表：无可用图片时回退默认图 */
  const displayImages = (part: PbiPart): string[] => {
    const urls = partImages.value[part.wtPartNumber] ?? [];
    return urls.length > 0 ? urls : [defaultImg];
  };

  /** 每个部件列宽度：双图部件列加宽，保证两张图与单图保持相同尺寸 */
  const partColumnWidths = computed(() =>
    props.tablePartList.map((part) =>
      (partImages.value[part.wtPartNumber]?.length ?? 0) > 1
        ? Math.max(props.partColumnWidth, DOUBLE_IMAGE_PART_WIDTH)
        : props.partColumnWidth
    )
  );

  /** 表格总宽：父级计算的单图总宽 + 双图列额外增加的宽度 */
  const effectiveTableWidth = computed(
    () => props.tableWidth + partColumnWidths.value.reduce((total, width) => total + width - props.partColumnWidth, 0)
  );

  // 部件列变化时探测第二张图是否存在，加载成功后自动展开并加宽对应列
  watch(
    () => props.tablePartList,
    (parts) => parts.forEach((part) => probeSecondImage(part.images?.[1])),
    { immediate: true }
  );

  let wrapEl: HTMLElement | null = null;
  let bodyObserver: ResizeObserver | null = null;

  /**
   * 计算表格滚动区域的最大高度：
   * 页面本身可能随内容撑高导致整页滚动，此时表头 sticky 不会生效；
   * 这里按表格在文档中的位置限制其高度，让表格区域内部滚动，表头即可固定悬浮。
   */
  const syncWrapMaxHeight = () => {
    if (!wrapEl) return;
    const top = wrapEl.getBoundingClientRect().top + window.scrollY;
    const available = window.innerHeight - top - 16;
    const nextMaxHeight = `${Math.max(320, available)}px`;
    if (wrapEl.style.maxHeight !== nextMaxHeight) {
      wrapEl.style.maxHeight = nextMaxHeight;
    }
  };

  /**
   * 计算首个属性组前两行的固定位置：
   * 第一行紧贴表头底部，第二行紧贴第一行底部；表头高度随窗口宽度变化时保持对齐。
   */
  const syncPinnedOffsets = () => {
    if (!wrapEl) return;
    const headerRow = wrapEl.querySelector<HTMLElement>("thead tr");
    if (!headerRow) return;
    const headerHeight = headerRow.getBoundingClientRect().height;
    const firstRow = wrapEl.querySelector<HTMLElement>("tbody tr.pin-row-1");
    const secondRow = wrapEl.querySelector<HTMLElement>("tbody tr.pin-row-2");
    const firstTop = `${headerHeight}px`;
    if (wrapEl.style.getPropertyValue("--pin-top-1") !== firstTop) {
      wrapEl.style.setProperty("--pin-top-1", firstTop);
    }
    if (firstRow && secondRow) {
      const secondTop = `${headerHeight + firstRow.getBoundingClientRect().height}px`;
      if (wrapEl.style.getPropertyValue("--pin-top-2") !== secondTop) {
        wrapEl.style.setProperty("--pin-top-2", secondTop);
      }
    }
  };

  /** 同步表格整体布局：滚动区域高度 + 首个属性组固定行偏移 */
  const syncTableLayout = () => {
    syncWrapMaxHeight();
    syncPinnedOffsets();
  };

  /** 点击组头折叠/展开：不可折叠组不响应，折叠状态变化后重新测量固定行偏移 */
  const toggleGroup = (group: ParamGroup) => {
    if (!group.allowFold) return;
    if (collapsedGroups.has(group.name)) {
      collapsedGroups.delete(group.name);
    } else {
      collapsedGroups.add(group.name);
    }
    nextTick(syncPinnedOffsets);
  };

  /** 滚动容器挂载/卸载：同步 ref 给父级，并监听页面布局变化动态更新可用高度 */
  const handleWrapEl = (el: unknown) => {
    props.setWrapEl(el);
    wrapEl = (el as HTMLElement) || null;
    bodyObserver?.disconnect();
    bodyObserver = null;
    if (!wrapEl) return;
    nextTick(syncTableLayout);
    if (typeof ResizeObserver !== "undefined") {
      bodyObserver = new ResizeObserver(() => requestAnimationFrame(syncTableLayout));
      bodyObserver.observe(document.body);
    }
  };

  // 属性过滤、部件列变化后行高可能改变，重新测量固定行的偏移
  watch(
    () => [props.displayGroups, props.tablePartList, props.loading],
    () => nextTick(syncPinnedOffsets)
  );

  onBeforeUnmount(() => {
    window.removeEventListener("resize", syncTableLayout);
    bodyObserver?.disconnect();
    bodyObserver = null;
  });

  onMounted(() => {
    window.addEventListener("resize", syncTableLayout);
    nextTick(syncTableLayout);
  });
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

  // 左上角“特性参数”表头：纵向滚动悬浮顶部，横向滚动锁定左侧（需高于普通表头）
  .param-corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 5;
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

  // 部件列表头：纵向滚动时与“特性参数”一起悬浮在顶部，盖住下方数据行
  .part-head {
    position: sticky;
    top: 0;
    z-index: 4;
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
    gap: 6px;
    box-sizing: border-box;
    width: 100%;
    max-width: 200px;
    height: 120px;
    margin: 0 auto;
    padding: 8px;
    background: #f5f6fa;
    border-radius: 8px;
  }

  // 双图部件列：图片区固定为两张单图宽度，不再随列宽铺满（详情页单列很宽时防止图片被放大）
  .part-image-wrap.is-multi {
    max-width: 390px;
  }

  // AImage 根节点为 span.ant-image，内部 img 由组件渲染；统一固定为单图尺寸 184×104，双图/单图视觉一致
  .part-image {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 184px;
    max-width: 100%;
    height: 104px;
    overflow: hidden;

    :deep(.ant-image-img) {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  // 并排两张图时各占一半宽度，单张最大184px，与单图展示尺寸一致
  .part-image-wrap.is-multi .part-image {
    max-width: calc(50% - 3px);
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
    height: 32px;
    padding: 0;
    white-space: nowrap;
    border-left: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  .group-cell-rest {
    height: 32px;
    padding: 0;
    border-bottom: 1px solid #ebeef5;
    border-right: 1px solid #f0f0f0;
  }

  // 折叠后组头按部件列展示的汇总值单元格，与数据列对齐并居中显示
  .group-cell-part {
    height: 32px;
    padding: 0 10px;
    overflow: hidden;
    font-size: 13px;
    color: #1f2937;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  // 可折叠组头：整行可点击，折叠箭头位于组名左侧、组色竖条之前
  .group-row.is-foldable {
    cursor: pointer;
    user-select: none;
  }

  .group-row.is-foldable .group-bar {
    margin-left: 8px;
  }

  .group-fold-icon {
    display: inline-flex;
    align-items: center;
    margin-left: 10px;
    font-size: 12px;
    color: #595959;
    vertical-align: middle;
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
    padding: 6px 16px;
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
    padding: 6px 10px;
  }

  // 首个属性组前两行：纵向滚动时固定在表头下方，关键标识始终可见
  .param-row.pin-row-1 > td,
  .param-row.pin-row-2 > td {
    position: sticky;
    z-index: 3;
  }

  // 固定行的第一列需高于同一行的部件单元格，否则横向滚动时会被部件列覆盖
  .param-row.pin-row-1 > .param-label,
  .param-row.pin-row-2 > .param-label {
    left: 0;
    z-index: 4;
  }

  .param-row.pin-row-1 > td {
    top: var(--pin-top-1, 0px);
  }

  .param-row.pin-row-2 > td {
    top: var(--pin-top-2, 0px);
  }

  // 固定列右侧分隔阴影：仅在表格发生横向滚动后显示
  .param-table-wrap.is-scrolled .sticky-col {
    box-shadow: 6px 0 8px -6px rgba(15, 23, 42, 0.2);
  }

  .param-name {
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // 中文名与英文名同一行展示，作为英文后的补充说明
  .param-display-name {
    margin-left: 2px;
    font-size: 12px;
    font-weight: 400;
    color: #9ca3af;
  }

  // 部件属性值单元格
  .part-cell {
    padding: 6px 10px;
    font-size: 13px;
    line-height: 18px;
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

<template>
  <!-- 左侧分类面板：一级分类为第一层菜单，二级分类（产品系列）为第二层菜单 -->
  <div class="category-drawer" :class="`category-drawer--${menuTheme}`">
    <!-- 面板标题栏 -->
    <div class="category-drawer__header">
      <span class="category-drawer__title">产品分类</span>
      <AButton class="category-drawer__close" type="text" size="small" aria-label="收起分类菜单" @click="handleClose">
        <CloseOutlined />
      </AButton>
    </div>

    <!-- 两层级联菜单：点击一级分类切换当前分类，点击二级分类打开对应参数配置页面 -->
    <AMenu
      class="category-drawer__menu"
      mode="inline"
      :theme="menuTheme"
      :open-keys="openKeys"
      :selected-keys="selectedKeys"
      @open-change="handleOpenChange"
      @click="handleMenuClick"
    >
      <AMenu.SubMenu v-for="category in categories" :key="category.id">
        <template #icon>
          <ApartmentOutlined />
        </template>
        <template #title>{{ category.displayName || category.name }}</template>
        <AMenu.Item v-for="series in seriesByCategory[category.id] || []" :key="seriesKey(category.id, series.name)">
          <span class="category-drawer__item">
            <BarsOutlined class="category-drawer__item-icon" />
            <span class="category-drawer__item-label">{{ series.displayName || series.name }}</span>
          </span>
        </AMenu.Item>
        <AMenu.Item v-if="loadingByCategory[category.id]" :key="`${category.id}::loading`" disabled>
          加载中...
        </AMenu.Item>
        <AMenu.Item
          v-else-if="(seriesByCategory[category.id] || []).length === 0"
          :key="`${category.id}::empty`"
          disabled
        >
          暂无二级分类
        </AMenu.Item>
      </AMenu.SubMenu>
    </AMenu>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from "vue";
  import { Menu as AMenu, Button as AButton, type MenuProps } from "ant-design-vue";
  import { ApartmentOutlined, BarsOutlined, CloseOutlined } from "@ant-design/icons-vue";
  import { useMenuSetting } from "@mfish/core/hooks";
  import type { TlaCategory, TlaSeries } from "@/api/pbi/model";

  defineOptions({ name: "TlaCategoryDrawerMenu" });

  const props = defineProps<{
    /** 分类面板是否展开 */
    open: boolean;
    /** 一级分类列表 */
    categories: TlaCategory[];
    /** 一级分类 id → 二级分类（产品系列）列表 */
    seriesByCategory: Record<string, TlaSeries[]>;
    /** 一级分类 id → 二级分类加载状态 */
    loadingByCategory: Record<string, boolean>;
    /** 当前选中的一级分类 id */
    activeCategory: string;
    /** 当前激活页签对应的二级分类内部名（空串表示无二级选中） */
    activeSeriesName: string;
  }>();

  const emit = defineEmits<{
    /** 更新面板展开状态 */
    (e: "update:open", value: boolean): void;
    /** 点击一级分类：切换当前分类 */
    (e: "select-category", categoryId: string): void;
    /** 点击二级分类：打开对应参数配置页面 */
    (e: "open-config", series: TlaSeries): void;
  }>();

  /** 二级菜单项 key 分隔符（分类 id 与系列内部名拼接，保证全局唯一） */
  const SERIES_KEY_SEPARATOR = "::";
  const seriesKey = (categoryId: string, seriesName: string) => `${categoryId}${SERIES_KEY_SEPARATOR}${seriesName}`;

  // 复用系统「界面风格 - 菜单主题」配置：背景色随 --sider-bg-color 实时变化，明暗主题由全局菜单设置决定
  const { getMenuTheme } = useMenuSetting();
  const menuTheme = computed<"light" | "dark">(() => (getMenuTheme.value === "dark" ? "dark" : "light"));

  /** 当前展开的一级分类 */
  const openKeys = ref<string[]>([]);
  /** 当前点击的二级分类 */
  const selectedKeys = ref<string[]>([]);

  // 页签切换或侧栏重新展开时，按当前一级/二级分类同步展开与选中状态：
  // 有激活二级分类则展开所属一级分类并选中该二级项；无二级分类时清除选中，首次进入首页保持全部折叠
  watch(
    [() => props.open, () => props.activeCategory, () => props.activeSeriesName],
    ([open, categoryId, seriesName]) => {
      if (!open) return;
      if (categoryId && seriesName) {
        openKeys.value = [categoryId];
        selectedKeys.value = [seriesKey(categoryId, seriesName)];
      } else {
        selectedKeys.value = [];
      }
    },
    { immediate: true }
  );

  /**
   * 展开/收起一级分类：
   * 本次新展开的分组即视为点击了一级分类，通知页面切换该分类并展示其系列卡片。
   */
  const handleOpenChange = (keys: string[]) => {
    const nextKeys = keys as string[];
    const newlyOpened = nextKeys.find((key) => !openKeys.value.includes(key));
    openKeys.value = nextKeys;
    if (newlyOpened) {
      emit("select-category", newlyOpened);
    }
  };

  /** 点击二级分类：打开该系列的参数配置标签页（面板保持展开，返回首页时导航状态不变） */
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const [categoryId, seriesName] = String(key).split(SERIES_KEY_SEPARATOR);
    if (!categoryId || !seriesName || seriesName === "empty" || seriesName === "loading") return;
    const series = (props.seriesByCategory[categoryId] || []).find((item) => item.name === seriesName);
    if (!series) return;
    selectedKeys.value = [String(key)];
    emit("open-config", series);
  };

  const handleClose = () => emit("update:open", false);
</script>

<style lang="less" scoped>
  .category-drawer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--sider-bg-color);
    border-right: 1px solid var(--sider-darken-bg-color);
  }

  .category-drawer__header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sider-darken-bg-color);
  }

  .category-drawer__title {
    font-size: 15px;
    font-weight: 600;
    color: rgb(0 0 0 / 88%);
  }

  .category-drawer--dark .category-drawer__title {
    color: rgb(255 255 255 / 85%);
  }

  .category-drawer--dark .category-drawer__close {
    color: rgb(255 255 255 / 75%);
  }

  .category-drawer--dark .category-drawer__close:hover {
    color: #fff;
  }

  .category-drawer__menu {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: transparent;
    border-inline-end: none;
  }

  .category-drawer__item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .category-drawer__item-icon {
    font-size: 14px;
  }

  .category-drawer__menu :deep(.ant-menu-submenu-title) {
    font-weight: 600;
  }
</style>

<template>
  <!-- PBI 全局分类侧栏：位于所有 PBI 标签页之外，切换标签时常驻不重新加载 -->
  <div class="pbi-sidebar" :class="{ 'pbi-sidebar--collapsed': !menuOpen }">
    <div class="pbi-sidebar__panel">
      <CategoryDrawerMenu
        v-model:open="menuOpen"
        class="pbi-sidebar__menu"
        :categories="categoryList"
        :series-by-category="seriesByCategory"
        :loading-by-category="seriesLoading"
        :active-category="activeCategory"
        :active-series-name="activeSeriesName"
        @select-category="handleCategoryChange"
        @open-config="openConfig"
      />
    </div>
    <!-- 收起后的左侧悬浮把手：任意 PBI 标签页均可重新展开分类侧栏 -->
    <button
      v-if="!menuOpen"
      type="button"
      class="pbi-sidebar__handle"
      aria-label="展开分类菜单"
      @click="menuOpen = true"
    >
      <MenuOutlined />
    </button>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "PbiGlobalSidebar" });

  import { onMounted, watch } from "vue";
  import { useRoute } from "vue-router";
  import { MenuOutlined } from "@ant-design/icons-vue";
  import CategoryDrawerMenu from "@/views/pbi/TLA-Architecture/components/CategoryDrawerMenu.vue";
  import { useTlaArchitecture } from "@/views/pbi/TLA-Architecture/hooks/useTlaArchitecture";

  const {
    categoryList,
    activeCategory,
    activeSeriesName,
    seriesByCategory,
    seriesLoading,
    menuOpen,
    ensureLoaded,
    syncFromRoute,
    handleCategoryChange,
    openConfig
  } = useTlaArchitecture();

  const route = useRoute();

  // 首次进入任意 PBI 页签时加载分类；内部幂等，与首页同时触发也只请求一次
  onMounted(() => {
    void ensureLoaded();
  });

  // 切换系统页签时，侧栏一级/二级选中态跟随当前页签对应显示
  watch(
    () => route.fullPath,
    () => {
      void syncFromRoute(route);
    },
    { immediate: true }
  );
</script>

<style lang="less" scoped>
  .pbi-sidebar {
    position: relative;
    flex-shrink: 0;
    width: 180px;
    height: 100%;
    transition: width 0.22s ease;
  }

  .pbi-sidebar--collapsed {
    width: 0;
  }

  // 固定面板宽度，避免收起动画过程中菜单内容被压缩变形
  .pbi-sidebar__panel {
    width: 180px;
    height: 100%;
    overflow: hidden;
  }

  .pbi-sidebar__menu {
    display: block;
    width: 100%;
    height: 100%;
  }

  .pbi-sidebar__handle {
    position: absolute;
    top: 10px;
    left: 0;
    z-index: 20;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 36px;
    padding: 0;
    color: #5a6577;
    cursor: pointer;
    background: #fff;
    border: 0;
    border-radius: 0 6px 6px 0;
    box-shadow: 2px 0 8px rgba(15, 23, 42, 0.16);
  }
</style>

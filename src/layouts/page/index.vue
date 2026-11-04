<template>
  <div class="page-layout">
    <!-- PBI 模块全局分类侧栏：独立于标签页之外，仅 /pbi 路由显示 -->
    <PbiGlobalSidebar v-if="isPbiRoute" />
    <div class="page-layout__content">
      <RouterView>
        <template #default="{ Component, route }">
          <transition :name="getTransitionName(route, getEnableTransition, getBasicTransition)" mode="out-in" appear>
            <keep-alive v-if="openCache" :include="getCaches">
              <component :is="setName(route, Component)" :key="route.fullPath" />
            </keep-alive>
            <component v-else :is="Component" :key="route.fullPath" />
          </transition>
        </template>
      </RouterView>
      <FrameLayout v-if="getCanEmbedIFramePage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, unref } from "vue";
  import { useRoute } from "vue-router";
  import FrameLayout from "@/layouts/iframe/index.vue";
  import PbiGlobalSidebar from "@/layouts/pbi/index.vue";
  import { useMultipleTabSetting, useRootSetting, useTransitionSetting } from "@mfish/core/hooks";
  import { useMultipleTabStore } from "@mfish/stores/modules";
  import { RouterTransitionEnum } from "@mfish/core/enums";

  defineOptions({ name: "PageLayout" });

  const route = useRoute();
  /** 仅 PBI 路由挂载分类侧栏，其他模块保持原有布局 */
  const isPbiRoute = computed(() => /^\/pbi(?:\/|$)/.test(route.path));

  const { getShowMultipleTab } = useMultipleTabSetting();
  const tabStore = useMultipleTabStore();
  const { getOpenKeepAlive, getCanEmbedIFramePage } = useRootSetting();

  const { getBasicTransition, getEnableTransition } = useTransitionSetting();

  function setName(route, Component) {
    //由于添加时无法获取到组件名称，所以此处操作滞后设置
    const name = Component?.type?.name;
    if (name) {
      tabStore.addCacheTab(route, name);
      tabStore.openEnd(route.name);
    }
    return Component;
  }

  const openCache = computed(() => unref(getOpenKeepAlive) && unref(getShowMultipleTab));

  const getCaches = computed((): string[] => {
    if (!unref(getOpenKeepAlive)) {
      return [];
    }
    return tabStore.getCachedTabList;
  });

  function getTransitionName(route, enableTransition: boolean, def: string): string | undefined {
    if (!enableTransition) {
      return undefined;
    }
    // 缓存路由打开时使用默认过渡动画，否则可能会造成组件大小计算有误
    if (tabStore.getNewOpenTab !== route.name) {
      return RouterTransitionEnum.FADE;
    }
    return def || RouterTransitionEnum.FADE_SIDE_LEFT;
  }
</script>

<style lang="less" scoped>
  .page-layout {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  // 路由内容区：侧栏收起后自动占满，保持原有 h-full 页面高度链路
  .page-layout__content {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
  }
</style>

<template>
  <div class="h-full w-full p-4 bg-white flex flex-col">
    <!-- 顶部工具栏：展示当前一级分类（分类切换由布局级全局侧栏完成） -->
    <div v-if="activeCategoryName" class="flex items-center gap-2">
      <span class="text-gray-400">当前分类</span>
      <span class="font-medium">{{ activeCategoryName }}</span>
    </div>

    <!-- 产品系列卡片列表区 -->
    <div class="mfish-page-content mt-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <ARow :gutter="16">
        <ACol :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-for="series in seriesList" :key="series.id">
          <ACard hoverable class="mb-4">
            <template #cover>
              <div class="w-full flex justify-center items-center bg-gray-50 p-2 overflow-hidden" style="height: 300px">
                <img
                  :src="series.imageUrl || defaultImg"
                  :alt="series.name"
                  style="max-width: 100%; max-height: 100%; object-fit: contain"
                />
              </div>
            </template>
            <ACardMeta :title="series.displayName || series.name">
              <template #description>
                <div class="truncate-2-lines h-10" :title="series.description">
                  {{ series.description }}
                </div>
              </template>
            </ACardMeta>
            <template #actions>
              <!-- 参数配置 / 产品图谱：分别打开独立系统标签页 -->
              <AButton type="link" @click="openConfig(series)">参数配置</AButton>
              <AButton type="link" @click="openFamilyTree(series)">产品图谱</AButton>
            </template>
          </ACard>
        </ACol>
      </ARow>
      <AEmpty v-if="seriesList.length === 0" description="暂无产品系列" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "TLAArchitecture" });
  import { onMounted } from "vue";
  import {
    Row as ARow,
    Col as ACol,
    Card as ACard,
    CardMeta as ACardMeta,
    Empty as AEmpty,
    Button as AButton
  } from "ant-design-vue";
  // 系列编辑弹窗：编辑入口已下线（后端保存接口未就绪），组件文件保留，接口就绪后在卡片 actions 重新挂载
  // import SeriesModal from "./components/SeriesModal.vue";
  // 系列卡片无图时的默认兜底图（API 层不感知视图资源，空地址在此层兜底）
  import defaultImg from "./image/default.png";
  import { useTlaArchitecture } from "./hooks/useTlaArchitecture";

  const { activeCategoryName, seriesList, ensureLoaded, openConfig, openFamilyTree } = useTlaArchitecture();

  // 布局级侧栏也会触发初始化，内部幂等；首页挂载时确保分类/系列已加载
  onMounted(() => {
    void ensureLoaded();
  });
</script>

<style lang="less" scoped>
  .truncate-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

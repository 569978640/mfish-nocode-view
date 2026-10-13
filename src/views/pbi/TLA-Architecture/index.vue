<template>
  <div class="h-full w-full p-4 bg-white flex flex-col">
    <div v-if="!currentConfig" class="flex flex-col h-full">
      <!-- 顶部分类标签导航区 -->
      <ATabs v-model:active-key="activeCategory" @change="handleCategoryChange">
        <ATabPane v-for="cat in categoryList" :key="cat.id" :tab="cat.displayName || cat.name" />
      </ATabs>

      <!-- 产品系列卡片列表区 -->
      <div class="mfish-page-content mt-4 flex-1 overflow-auto">
        <ARow :gutter="16">
          <ACol :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-for="series in seriesList" :key="series.id">
            <ACard hoverable class="mb-4">
              <template #cover>
                <div
                  class="w-full flex justify-center items-center bg-gray-50 p-2 overflow-hidden"
                  style="height: 300px"
                >
                  <img
                    :src="series.imageUrl"
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
                <AButton type="link" @click="handleConfig(series)">参数配置</AButton>
                <AButton type="link" @click="handleEdit(series)">编辑</AButton>
              </template>
            </ACard>
          </ACol>
        </ARow>
        <AEmpty v-if="seriesList.length === 0" description="暂无产品系列" />
      </div>

      <!-- 产品系列信息维护弹窗 -->
      <SeriesModal @register="registerModal" @success="loadSeries" />
    </div>

    <!-- 产品参数配置详情区：firstCategory 取二级分类 parentDisplayName，productClassification 取二级分类原始 name -->
    <ParameterConfig
      v-else
      :first-category="currentConfig.firstCategory"
      :product-classification="currentConfig.productClassification"
      @back="currentConfig = null"
    />
  </div>
</template>

<script lang="ts" setup>
  defineOptions({ name: "TLAArchitecture" });
  import { ref, onMounted } from "vue";
  import {
    Tabs as ATabs,
    TabPane as ATabPane,
    Row as ARow,
    Col as ACol,
    Card as ACard,
    CardMeta as ACardMeta,
    Empty as AEmpty,
    Button as AButton
  } from "ant-design-vue";
  import { useModal } from "@mfish/core/components/Modal";
  import SeriesModal from "./components/SeriesModal.vue";
  import ParameterConfig from "./components/ParameterConfig.vue";
  import { tlaApi } from "@/api/pbi/tla";
  import type { TlaCategory, TlaSeries } from "@/api/pbi/model/TlaModel";

  const categoryList = ref<TlaCategory[]>([]);
  const activeCategory = ref<string>("");
  const seriesList = ref<TlaSeries[]>([]);

  // 当前进入参数配置的分类信息：一级分类取二级分类的 parentDisplayName，产品分类取二级分类原始 name
  const currentConfig = ref<{ firstCategory: string; productClassification: string } | null>(null);

  const [registerModal, { openModal }] = useModal();

  const loadCategories = async () => {
    categoryList.value = await tlaApi.getCategoryList();
    if (categoryList.value.length > 0) {
      activeCategory.value = categoryList.value[0].id;
      loadSeries();
    }
  };

  const loadSeries = async () => {
    if (!activeCategory.value) return;
    seriesList.value = await tlaApi.getSeriesList(activeCategory.value);
  };

  const handleCategoryChange = (key: any) => {
    activeCategory.value = key;
    loadSeries();
  };

  // 点击参数配置：firstCategory 取二级分类的 parentDisplayName，productClassification 取二级分类内部名称 name
  const handleConfig = (series: TlaSeries) => {
    currentConfig.value = {
      firstCategory: series.parentDisplayName || series.parentName || "",
      productClassification: series.name
    };
  };

  const handleEdit = (record: TlaSeries) => {
    openModal(true, {
      isUpdate: true,
      record
    });
  };

  onMounted(() => {
    loadCategories();
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

import type { HeaderSetting } from "@mfish/types/src/type/config";
import { computed, unref } from "vue";
import { useAppStore, useUserStore } from "@mfish/stores/modules";
import { useFullContent, useMenuSetting, useRootSetting } from "@core/hooks";
import { MenuModeEnum } from "../../enums";

export function useHeaderSetting() {
  const { getFullContent } = useFullContent();
  const appStore = useAppStore();

  const getShowFullHeaderRef = computed(() => {
    return (
      !unref(getFullContent) &&
      unref(getShowMixHeaderRef) &&
      unref(getShowHeader) &&
      !unref(getIsTopMenu) &&
      !unref(getIsMixSidebar)
    );
  });

  const getUnFixedAndFull = computed(() => !unref(getFixed) && !unref(getShowFullHeaderRef));

  const getShowInsetHeaderRef = computed(() => {
    const need = !unref(getFullContent) && unref(getShowHeader);
    return (need && !unref(getShowMixHeaderRef)) || (need && unref(getIsTopMenu)) || (need && unref(getIsMixSidebar));
  });

  const { getMenuMode, getSplit, getShowHeaderTrigger, getIsSidebarType, getIsMixSidebar, getIsTopMenu } =
    useMenuSetting();
  const { getShowBreadCrumb, getShowLogo } = useRootSetting();

  const getShowMixHeaderRef = computed(() => !unref(getIsSidebarType) && unref(getShowHeader));

  const getShowDoc = computed(() => appStore.getHeaderSetting.showDoc);

  const getHeaderTheme = computed(() => appStore.getHeaderSetting.theme);

  const getShowHeader = computed(() => {
    const userStore = useUserStore();
    // 普通用户固定隐藏顶栏；管理员读数据库配置控制
    if (userStore.getUserInfo?.account !== "admin") return false;
    return appStore.getHeaderSetting.show;
  });

  const getFixed = computed(() => appStore.getHeaderSetting.fixed);

  const getHeaderBgColor = computed(() => appStore.getHeaderSetting.bgColor);

  const getShowSearch = computed(() => appStore.getHeaderSetting.showSearch);

  const getUseLockPage = computed(() => appStore.getHeaderSetting.useLockPage);

  const getShowFullScreen = computed(() => appStore.getHeaderSetting.showFullScreen);

  const getShowNotice = computed(() => {
    const userStore = useUserStore();
    // 普通用户固定隐藏消息通知；管理员读数据库配置控制
    if (userStore.getUserInfo?.account !== "admin") return false;
    return appStore.getHeaderSetting.showNotice;
  });

  const getShowTenant = computed(() => {
    const userStore = useUserStore();
    // 普通用户固定隐藏租户切换；管理员读数据库配置控制
    if (userStore.getUserInfo?.account !== "admin") return false;
    return appStore.getHeaderSetting.showTenant;
  });

  const getShowBread = computed(() => {
    return unref(getMenuMode) !== MenuModeEnum.HORIZONTAL && unref(getShowBreadCrumb) && !unref(getSplit);
  });

  const getShowHeaderLogo = computed(() => {
    return unref(getShowLogo) && !unref(getIsSidebarType) && !unref(getIsMixSidebar);
  });

  const getShowContent = computed(() => {
    return unref(getShowBread) || unref(getShowHeaderTrigger);
  });

  // Set header configuration
  function setHeaderSetting(headerSetting: Partial<HeaderSetting>) {
    appStore.setProjectConfig({ headerSetting });
  }

  return {
    setHeaderSetting,

    getShowDoc,
    getShowSearch,
    getHeaderTheme,
    getUseLockPage,
    getShowFullScreen,
    getShowNotice,
    getShowTenant,
    getShowBread,
    getShowContent,
    getShowHeaderLogo,
    getShowHeader,
    getFixed,
    getShowMixHeaderRef,
    getShowFullHeaderRef,
    getShowInsetHeaderRef,
    getUnFixedAndFull,
    getHeaderBgColor
  };
}

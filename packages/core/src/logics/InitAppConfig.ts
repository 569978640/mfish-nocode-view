/**
 * Application configuration
 */
import type { ProjectConfig } from "@mfish/types/src/type/config";
import projectSetting from "@core/settings/ProjectSetting.ts";
import { updateHeaderBgColor, updateSidebarBgColor } from "@core/logics/theme/UpdateBackground.ts";
import { updateColorWeak } from "@core/logics/theme/UpdateColorWeak.ts";
import { updateGrayMode } from "@core/logics/theme/UpdateGrayMode.ts";
import { updateDarkTheme } from "@core/logics/theme/Dark.ts";
import { changeTheme } from "@core/logics/theme/UpdateTheme.ts";
import { getCommonStoragePrefix, getStorageShortName } from "@core/utils/Env.ts";
import { ThemeEnum } from "@core/enums";
import { getSysConfig } from "@/api/sys/SysConfig.ts";
import { useAppStore, useTableSettingStore, useUserStoreWithOut } from "@mfish/stores/modules";
import { deepMerge } from "@core/utils/index.ts";
import { cloneDeep } from "lodash-es";
import { watch } from "vue";

export async function initAppConfigStore() {
  // 设置本地样式
  changeAppConfig(projectSetting);
  // 获取服务端样式配置
  const userStore = useUserStoreWithOut();

  // 监听登录用户变化：刷新后恢复登录、SPA 内退出并切换账号都会触发，
  // 确保每个用户登录后都按其角色与数据库记录重新初始化界面配置。
  // 不能只在应用启动时执行一次——退出登录仅路由跳转、不刷新页面，
  // 切换账号后若不重新初始化会沿用上一个用户的菜单折叠等配置。
  watch(
    () => userStore.getUserInfo?.account,
    (account) => {
      if (account) {
        setAppConfigStore(userStore).then();
      }
    },
    { immediate: true }
  );
}

// 初始化项目配置
async function setAppConfigStore(userStore: ReturnType<typeof useUserStoreWithOut>) {
  let projCfg: ProjectConfig = projectSetting;
  try {
    const sysConfigs = await getSysConfig();
    if (sysConfigs && sysConfigs.length > 0) {
      for (const sysConfig of sysConfigs) {
        if (sysConfig.type === 1 && sysConfig && sysConfig.config) {
          useTableSettingStore().setTableSetting(JSON.parse(sysConfig.config));
        } else if (sysConfig.type === 0 && sysConfig.config) {
          const dbCfg = JSON.parse(sysConfig.config) as ProjectConfig;
          // 以本地默认配置为底，数据库配置覆盖合并（顶栏/消息通知/租户的显隐由此读取数据库值）
          projCfg = deepMerge(cloneDeep(projectSetting), dbCfg);
        }
      }
    }
  } catch (error) {
    // 配置接口异常时不阻塞，使用本地默认配置继续应用角色默认值
    console.log("加载系统界面配置失败：", error);
  }
  // 左侧菜单折叠：普通用户默认折叠（会话内仍可手动展开，刷新/重新登录后恢复折叠）；
  // 管理员读数据库配置，数据库无配置时取本地默认值 false（不折叠）
  if (userStore.getUserInfo?.account !== "admin") {
    // 克隆避免直接修改模块级默认配置单例
    projCfg = cloneDeep(projCfg);
    projCfg.menuSetting.collapsed = true;
  }
  changeAppConfig(projCfg);
}

export function changeAppConfig(projCfg: ProjectConfig) {
  const { darkMode, colorWeak, grayMode, themeColor } = projCfg;
  try {
    if (themeColor) {
      changeTheme(themeColor).then();
    }
    grayMode && updateGrayMode(grayMode);
    colorWeak && updateColorWeak(colorWeak);
  } catch (error) {
    console.log(error);
  }
  useAppStore().setProjectConfig(projCfg);
  setDarkTheme(darkMode);
  setTimeout(() => {
    clearObsoleteStorage();
  }, 16);
}

// 设置深色浅色模式
export function setDarkTheme(darkMode: ThemeEnum) {
  updateDarkTheme(darkMode).then();
  updateHeaderBgColor();
  updateSidebarBgColor();
}

/**
 * As the version continues to iterate, there will be more and more cache keys stored in localStorage.
 * This method is used to delete useless keys
 */
export function clearObsoleteStorage() {
  const commonPrefix = getCommonStoragePrefix();
  const shortPrefix = getStorageShortName();

  [localStorage, sessionStorage].forEach((item: Storage) => {
    Object.keys(item).forEach((key) => {
      if (key && key.startsWith(commonPrefix) && !key.startsWith(shortPrefix)) {
        item.removeItem(key);
      }
    });
  });
}

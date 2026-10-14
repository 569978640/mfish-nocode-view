import type { Router } from "vue-router";
import { usePermissionStoreWithOut, useUserStoreWithOut } from "@mfish/stores/modules";
import { PageEnum } from "@core/enums";
import { PAGE_NOT_FOUND_ROUTE, RootRoute } from "@core/router";
import { curLoginType, oauth2Config } from "@core/settings/LoginSetting";
import type { Recordable } from "@mfish/types";

const ROOT_PATH = RootRoute().path;
const whitePathList: Set<PageEnum> = new Set([
  PageEnum.BASE_LOGIN,
  PageEnum.OAUTH_LOGIN,
  PageEnum.ERROR_LOGIN,
  PageEnum.GITEE_LOGIN,
  PageEnum.GITHUB_LOGIN
]);

export function createPermissionGuard(router: Router) {
  const userStore = useUserStoreWithOut();
  const permissionStore = usePermissionStoreWithOut();
  router.beforeEach(async (to, from) => {
    // 外部系统免登跳转：URL 中携带 access_token 时（如旧 JSP 系统通过 password 模式换取令牌后 302 跳转），
    // 先写入本地令牌缓存并拉取用户信息、动态注册路由，校验通过后清除地址栏令牌参数再继续跳转
    const ssoAccessToken = to.query?.access_token as string;
    if (ssoAccessToken) {
      userStore.setToken(ssoAccessToken);
      const ssoRefreshToken = to.query?.refresh_token as string;
      if (ssoRefreshToken) {
        userStore.setRefreshToken(ssoRefreshToken);
      }
      try {
        // 拉取用户信息并动态注册路由，同时完成令牌有效性校验
        await userStore.getAccountInfo();
      } catch {
        // 令牌无效：清空缓存并回落到正常登录页，redirect 不能再携带令牌参数避免死循环
        userStore.setToken(undefined);
        userStore.setRefreshToken(undefined);
        return { path: PageEnum.BASE_LOGIN, replace: true };
      }
      // 清除地址栏中的令牌参数，避免令牌残留在浏览器历史、截图与刷新重复写入
      const cleanQuery = { ...to.query };
      delete cleanQuery.access_token;
      delete cleanQuery.refresh_token;
      return { path: to.path, query: cleanQuery, hash: to.hash, replace: true };
    }
    const token = userStore.getToken;
    const refreshToken = userStore.getRefreshToken;
    if (!token && refreshToken) {
      // 如果token过期，刷新token
      try {
        await userStore.refreshTokenAction();
        return to.path;
      } catch {
        userStore.setRefreshToken(undefined);
      }
    }
    // 白名单路径允许直接访问
    if (whitePathList.has(to.path as PageEnum)) {
      // 如果访问登陆页面且token存在，判断token是否有效直接进入redirect地址或首页地址
      if (to.path === PageEnum.BASE_LOGIN && token) {
        // 增加try catch方式请求异常造成无法返回首页
        try {
          //获取用户信息成功，进入首页，失败如果返回401会自动刷新
          await userStore.getAccountInfo();
          return (to.query?.redirect as string) || "/";
        } catch {
          userStore.setToken(undefined);
        }
        if (refreshToken) {
          // 如果token过期，刷新token
          try {
            await userStore.refreshTokenAction();
            return to.query?.redirect as string;
          } catch {
            userStore.setRefreshToken(undefined);
          }
        }
      }
      // 如果登录类型为code方式走统一认证登录
      if (to.path === PageEnum.BASE_LOGIN && curLoginType === "authorization_code") {
        let url = `${oauth2Config.url}?`;
        const redirect_uri = to.redirectedFrom?.fullPath;
        Object.keys(oauth2Config).forEach((key) => {
          if (key === "url" || key === "client_secret") return;
          // 如果存在当前域的重定向地址，补充回调地址。否则使用默认回调地址
          url +=
            key === "redirect_uri" && redirect_uri
              ? `${key}=${oauth2Config[key]}?redirect=${redirect_uri}&`
              : `${key}=${oauth2Config[key]}&`;
        });
        if (url.endsWith("&")) {
          url = url.slice(0, Math.max(0, url.length - 1));
        }
        if (userStore.getIsLogout) {
          url += "&force_login=1";
          userStore.setIsLogout(false);
        }
        globalThis.location.href = url;
        return false;
      }
      return true;
    }
    const user = userStore.getUserInfo;
    // 如果token或者user不存在
    if (!token || !user) {
      // 如果设置ignoreAuth为true，允许直接访问
      if (to.meta.ignoreAuth) {
        return true;
      }
      // 重定向到登录页面
      const redirectData: { path: string; replace: boolean; query?: Recordable<string> } = {
        path: PageEnum.BASE_LOGIN,
        replace: true
      };
      if (to.path) {
        redirectData.query = { redirect: to.fullPath };
      }
      return redirectData;
    }
    if (permissionStore.getIsDynamicAddedRoute) {
      return true;
    }
    await permissionStore.addRouter(router);
    if (from.path === ROOT_PATH && to.path === PageEnum.BASE_HOME && permissionStore.homePath !== PageEnum.BASE_HOME) {
      return permissionStore.homePath;
    }
    if (to.name === PAGE_NOT_FOUND_ROUTE.name) {
      // 动态添加路由后，此处应当重定向到fullPath，否则会加载404页面内容
      return { path: to.fullPath, replace: true, query: to.query };
    } else {
      const redirectPath = (from.query.redirect || to.path) as string;
      const redirect = decodeURIComponent(redirectPath);
      const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect };
      return nextData;
    }
  });
}

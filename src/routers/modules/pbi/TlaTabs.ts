/**
 * @description PBI/TLA 架构业务子标签路由
 * 四个页面均挂在默认布局（侧边栏 + 系统多标签栏）内展示，不进入左侧菜单（hideMenu），
 * 仅由 TLA-Architecture 首页卡片与页面内按钮通过路由打开；
 * 开启 keepAlive 保证切换标签后页面内容（筛选条件、家谱画布、对比选择）不丢失。
 * 同路径标签在多标签 store 中按 path 去重复用：每类业务标签最多一个，切换系列时以新 query 复用刷新。
 */
import type { AppRouteRecordRaw } from "@mfish/core/router";
import { LAYOUT } from "@mfish/core/router";

const tlaTabsRoutes: AppRouteRecordRaw = {
  path: "/pbi/tla",
  name: "PbiTlaTabs",
  component: LAYOUT,
  meta: {
    title: "TLA",
    hideMenu: true,
    menuSort: 999
  },
  children: [
    {
      path: "config",
      name: "PbiTlaConfig",
      component: () => import("@/views/pbi/tla/ConfigPage.vue"),
      meta: {
        title: "参数配置",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      path: "family",
      name: "PbiTlaFamily",
      component: () => import("@/views/pbi/tla/FamilyPage.vue"),
      meta: {
        title: "产品家谱",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      path: "part",
      name: "PbiTlaPart",
      component: () => import("@/views/pbi/tla/PartDetailPage.vue"),
      meta: {
        title: "部件编号",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      path: "compare",
      name: "PbiTlaCompare",
      component: () => import("@/views/pbi/tla/ComparePage.vue"),
      meta: {
        title: "型号对比",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    }
  ]
};

export default tlaTabsRoutes;

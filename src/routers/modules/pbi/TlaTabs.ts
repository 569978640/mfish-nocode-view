/**
 * @description PBI/TLA 架构业务子标签路由
 * 四个页面均挂在默认布局（侧边栏 + 系统多标签栏）内展示，不进入左侧菜单（hideMenu），
 * 仅由 TLA-Architecture 首页卡片与页面内按钮通过路由打开；
 * 开启 keepAlive 保证切换标签后页面内容（筛选条件、图谱画布、对比选择）不丢失。
 *
 * 参数配置/产品图谱/部件编号的标签唯一标识放在 path 参数中（二级分类内部名 / 部件编号）：
 * 多标签 store 按 path 去重，不同系列或不同部件对应不同 path，会各自新建独立标签并加载独立内容；
 * 标签显示名由路由变化监听动态写入（见 useTlaTabs 的 resolveTlaTabTitle），不使用静态 meta.title。
 */
import type { AppRouteRecordRaw } from "@mfish/core/router";
import { LAYOUT } from "@mfish/core/router";
import { TLA_ROUTE_NAMES } from "@/views/pbi/tla/hooks/useTlaTabs";

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
      // :classification 为二级分类内部名（PRODUCTCLASSIFICATION，URL 编码），不同系列各开一个标签
      path: "config/:classification",
      name: TLA_ROUTE_NAMES.CONFIG,
      component: () => import("@/views/pbi/tla/ConfigPage.vue"),
      meta: {
        title: "参数配置",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      // :classification 为二级分类内部名（PRODUCTCLASSIFICATION，URL 编码），不同系列各开一个标签
      path: "family/:classification",
      name: TLA_ROUTE_NAMES.FAMILY,
      component: () => import("@/views/pbi/tla/FamilyPage.vue"),
      meta: {
        title: "产品图谱",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      // :wtPartNumber 为部件编号（URL 编码），不同部件各开一个标签
      path: "part/:wtPartNumber",
      name: TLA_ROUTE_NAMES.PART,
      component: () => import("@/views/pbi/tla/PartDetailPage.vue"),
      meta: {
        title: "部件编号",
        title_en: "Part Detail",
        hideMenu: true,
        keepAlive: true,
        menuSort: 999
      }
    },
    {
      // 型号对比全局只保留一个标签：再次发起对比覆盖会话内容，页面响应式刷新
      path: "compare",
      name: TLA_ROUTE_NAMES.COMPARE,
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

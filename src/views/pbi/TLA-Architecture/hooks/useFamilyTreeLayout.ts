import { computed, type Ref } from "vue";
import type { Edge, Node } from "@vue-flow/core";
import type { FamilyTreeNode } from "@/api/pbi/model";

/** 节点卡片碰撞盒宽高（px） */
export const FAMILY_NODE_W = 264;
export const FAMILY_NODE_H = 160;
/** 同层兄弟节点水平间距 */
const SIBLING_GAP = 36;
/** 相邻层级垂直间距（内含正交折线的水平段） */
const LEVEL_GAP = 72;

/** 自定义边类型：父子正交直角折线（无箭头） */
export const FAMILY_EDGE_TYPE = "familyOrthogonal";
/** 自定义节点类型：家谱卡片 */
export const FAMILY_NODE_TYPE = "familyCard";

interface LayoutUnit {
  /** Vue Flow 节点 id */
  id: string;
  /** 业务节点数据 */
  data: FamilyTreeNode;
  /** 层级深度（根为 0） */
  depth: number;
  /** 子树覆盖的首个叶子序号 */
  firstLeaf: number;
  /** 子树覆盖的末个叶子序号 */
  lastLeaf: number;
}

/** 递归布局结果：节点 id 与子树叶子序号范围 */
interface LayoutResult {
  id: string;
  firstLeaf: number;
  lastLeaf: number;
}

/**
 * 产品家谱树布局：
 * 叶序紧凑树——叶子从左到右等距排列，父节点水平居中于其子树首末叶子之间；
 * 深度决定纵向层级。输出 Vue Flow 的 nodes/edges（节点为自定义卡片，边为正交折线）。
 * 节点坐标为碰撞盒左上角，后续接口数据替换 root 后布局自动重算。
 */
export const useFamilyTreeLayout = (root: Ref<FamilyTreeNode | null>) => {
  const graph = computed(() => {
    const units: LayoutUnit[] = [];
    const edges: Edge[] = [];
    if (!root.value) return { nodes: [] as Node<FamilyTreeNode>[], edges };

    /** 叶子全局序号（DFS 左到右连续编号） */
    let leafSeq = 0;
    /** 节点自增序号（生成唯一 id，部件编号可能重复） */
    let nodeSeq = 0;
    /** 单个叶子占用的水平步进（卡片宽 + 兄弟间距） */
    const leafStep = FAMILY_NODE_W + SIBLING_GAP;

    /** 后序遍历：先布局子节点得到子树叶子范围，父节点按首末叶子居中 */
    const layout = (data: FamilyTreeNode, depth: number): LayoutResult => {
      const id = `family-node-${nodeSeq++}`;
      const children = data.children || [];
      let result: LayoutResult;

      if (children.length === 0) {
        // 叶子：占用当前序号并自增
        result = { id, firstLeaf: leafSeq, lastLeaf: leafSeq };
        leafSeq += 1;
      } else {
        const childResults = children.map((child) => layout(child, depth + 1));
        for (const childResult of childResults) {
          edges.push({
            id: `${id}->${childResult.id}`,
            source: id,
            target: childResult.id,
            type: FAMILY_EDGE_TYPE
          });
        }
        result = {
          id,
          firstLeaf: childResults[0].firstLeaf,
          lastLeaf: childResults[childResults.length - 1].lastLeaf
        };
      }

      units.push({ id, data, depth, firstLeaf: result.firstLeaf, lastLeaf: result.lastLeaf });
      return result;
    };

    layout(root.value, 0);

    // 叶子中心 x = leafIndex * leafStep + NODE_W/2；父节点中心 = 首末叶子中心的中点
    const leafCenter = (leafIndex: number) => leafIndex * leafStep + FAMILY_NODE_W / 2;
    const nodes: Node<FamilyTreeNode>[] = units.map((unit) => {
      const centerX = (leafCenter(unit.firstLeaf) + leafCenter(unit.lastLeaf)) / 2;
      return {
        id: unit.id,
        type: FAMILY_NODE_TYPE,
        position: {
          x: centerX - FAMILY_NODE_W / 2,
          y: unit.depth * (FAMILY_NODE_H + LEVEL_GAP)
        },
        data: unit.data,
        // 家谱层级结构固定，不允许节点自由拖动造成错位；画布平移与缩放不受影响
        draggable: false,
        connectable: false
      };
    });

    return { nodes, edges };
  });

  return {
    nodes: computed(() => graph.value.nodes),
    edges: computed(() => graph.value.edges)
  };
};

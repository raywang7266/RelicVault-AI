import ExploreGrid from "@/components/artifacts/explore-grid";

// 探索/典藏阁统一入口：复用 ExploreGrid（瀑布流、搜索、#标签、多维筛选、
// 详情弹窗含地图图钉、点赞与评论）。原独立的 gallery 实现已并入此组件。
export default function GalleryPage() {
  return <ExploreGrid />;
}

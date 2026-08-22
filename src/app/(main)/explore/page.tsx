import ExploreGrid from "@/components/artifacts/explore-grid";

export const dynamic = "force-dynamic";

export default function ExplorePage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams?.tag;
  return <ExploreGrid initialTag={tag} />;
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ConnectionsView from "@/components/social/connections-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关注与粉丝 · RelicVault",
};

export default function ConnectionsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const id = params?.id;
  if (!id) notFound();
  const tab = searchParams?.tab === "followers" ? "followers" : "following";
  return <ConnectionsView userId={id} initialTab={tab} />;
}

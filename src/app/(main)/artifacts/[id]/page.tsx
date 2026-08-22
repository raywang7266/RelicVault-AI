import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerUser } from "@/lib/auth/server";
import { getArtifact } from "@/lib/store/artifacts";
import ArtifactDetailPage from "@/components/artifacts/artifact-detail-page";
import { getServerTranslation } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArtifactPage({
  params,
}: {
  params: { id: string };
}) {
  const current = await getServerUser();
  // 关键：把当前 userId 传给 getArtifact，让 docToArtifact 计算
  // likedByMe / favoritedByMe，否则两个布尔永远为 false，UI 会显示
  // 「UI 是未点赞，但点赞数 +1」的割裂状态。
  const artifact = await getArtifact(params.id, current?.id ?? null);
  if (!artifact) notFound();

  const { t } = getServerTranslation();
  await connectDB();
  const ownerDoc = await User.findById(artifact.ownerId).lean();
  const owner = ownerDoc
    ? {
        username: (ownerDoc.username as string) || undefined,
        displayName: (ownerDoc.displayName as string) || t("common.unknownUser"),
        avatarUrl: (ownerDoc.avatarUrl as string) || "",
      }
    : {
        username: undefined,
        displayName: t("common.unknownUser"),
        avatarUrl: "",
      };

  const isOwner = !!current && current.id === artifact.ownerId;

  return (
    <ArtifactDetailPage artifact={artifact} isOwner={isOwner} owner={owner} />
  );
}

import PublicProfileView from "@/components/social/public-profile-view";

export const metadata = {
  title: "用户主页",
};

export default function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <PublicProfileView userId={params.id} />;
}

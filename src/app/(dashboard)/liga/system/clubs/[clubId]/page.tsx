import { redirect } from "next/navigation";

export default async function ClubCategoriasPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  redirect(`/liga/clubs/${clubId}`);
}

import { ResourceRoute } from "@/screens/ResourceRoute";

export default async function Page({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  return <ResourceRoute resource={resource} mode="new" />;
}

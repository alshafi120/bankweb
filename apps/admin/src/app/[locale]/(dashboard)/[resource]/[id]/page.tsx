import { ResourceRoute } from "@/screens/ResourceRoute";

export default async function Page({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  return <ResourceRoute resource={resource} id={id} mode="edit" />;
}

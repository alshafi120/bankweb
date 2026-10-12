import { PageBuilderScreen } from "@/screens/builder/PageBuilderScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageBuilderScreen id={id} />;
}

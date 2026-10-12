import { Suspense } from "react";
import { InboxScreen } from "@/screens/inbox/InboxScreen";
export default function Page() { return <Suspense><InboxScreen kind="complaints" /></Suspense>; }

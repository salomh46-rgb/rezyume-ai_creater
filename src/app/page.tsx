import { Suspense } from "react";
import { Landing } from "@/components/landing";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <Landing initialAuthOpen={sp.auth === "1"} next={sp.next} />
    </Suspense>
  );
}

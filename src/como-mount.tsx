import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const ComoApp = lazy(() => import("./como-app"));

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function ComoMount() {
  return (
    <ClientOnly fallback={<Loader />}>
      <Suspense fallback={<Loader />}>
        <ComoApp />
      </Suspense>
    </ClientOnly>
  );
}

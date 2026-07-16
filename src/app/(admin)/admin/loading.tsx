import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sedona-sand px-6 text-sedona-pineSoft">
      <LoadingState
        className="min-h-[280px] w-full max-w-md border-0 bg-white shadow-card"
        description="Checking your admin session before loading reporting and content tools."
        title="Preparing admin"
      />
    </main>
  );
}

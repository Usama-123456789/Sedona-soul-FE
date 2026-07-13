import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F4EFE6] px-6 py-10 text-[#16352B]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">{children}</div>
    </main>
  );
}

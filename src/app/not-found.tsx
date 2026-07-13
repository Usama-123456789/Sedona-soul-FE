import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4EFE6] p-6 text-center text-[#16352B]">
      <div className="max-w-sm space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A89A82]">Not found</p>
        <h1 className="font-serif text-4xl">This page is not available.</h1>
        <Link className="inline-flex rounded-full bg-[#16352B] px-5 py-3 text-sm font-semibold text-[#F4EFE6]" href="/app/home">
          Return home
        </Link>
      </div>
    </main>
  );
}

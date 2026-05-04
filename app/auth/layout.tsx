import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      <nav className="px-8 py-6">
        <Link href="/" className="font-display text-2xl text-[#141414]">
          WalkGraph
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}

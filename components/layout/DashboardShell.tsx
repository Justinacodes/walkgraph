"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import Link from "next/link";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 bg-[#141414] px-4 py-4 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="text-white/70 hover:text-white p-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard">
            <span className="font-display text-white text-xl">WalkGraph</span>
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden overflow-y-auto bg-[#F1F5F9]">
          {children}
        </main>
      </div>
    </div>
  );
}

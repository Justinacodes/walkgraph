"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, LayoutDashboard, Map, LogOut, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
  { href: "/explore", label: "Explore Maps", icon: Map },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        // Desktop: always visible in normal flow
        "lg:relative lg:translate-x-0 lg:flex",
        // Mobile: fixed overlay, slides in/out
        "fixed inset-y-0 left-0 z-50 lg:z-auto",
        "transform transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "w-64 min-h-screen bg-[#141414] flex flex-col shrink-0"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" onClick={onClose}>
          <span className="font-display text-white text-2xl">WalkGraph</span>
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-white/40 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                active
                  ? "bg-white text-[#141414]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && <ChevronRight className="ml-auto w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

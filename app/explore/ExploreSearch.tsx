"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function ExploreSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/explore?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search buildings, hospitals, schools…"
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl px-5 py-3 pl-11 focus:outline-none focus:border-white/40 text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-[#3B82F6] text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-500 transition-colors text-sm"
      >
        Search
      </button>
    </form>
  );
}

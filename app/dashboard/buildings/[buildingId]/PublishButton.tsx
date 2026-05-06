"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Globe, EyeOff } from "lucide-react";

export function PublishButton({ buildingId, status }: { buildingId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/buildings/${buildingId}/publish`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setError(data?.error ?? "Unable to update publication status.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={toggle}
        loading={loading}
        variant={status === "PUBLISHED" ? "secondary" : "blue"}
        size="md"
      >
        {status === "PUBLISHED" ? (
          <><EyeOff className="w-4 h-4" /> Unpublish</>
        ) : (
          <><Globe className="w-4 h-4" /> Publish Map</>
        )}
      </Button>
      {error ? <p className="max-w-xs text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

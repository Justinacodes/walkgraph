"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Globe, EyeOff } from "lucide-react";

export function PublishButton({ buildingId, status }: { buildingId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/buildings/${buildingId}/publish`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
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
  );
}

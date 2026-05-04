"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function NewFloorModal({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", levelNumber: "0", description: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, buildingId, levelNumber: parseInt(form.levelNumber) }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      setOpen(false);
      setForm({ name: "", levelNumber: "0", description: "" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="blue" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add Floor
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Floor">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Floor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ground Floor" required />
          <Input label="Level number" type="number" value={form.levelNumber} onChange={(e) => setForm({ ...form, levelNumber: e.target.value })} hint="0 = ground floor, 1 = first floor, -1 = basement" required />
          <Textarea label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Add Floor</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

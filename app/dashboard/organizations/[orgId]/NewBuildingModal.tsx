"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { generateSlug } from "@/lib/utils/slug";

export function NewBuildingModal({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", slug: "", description: "", address: "", category: "office", visibility: "PUBLIC",
  });

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: generateSlug(name) });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId: orgId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed");
        return;
      }
      const b = await res.json();
      setOpen(false);
      router.push(`/dashboard/buildings/${b.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="blue" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> New Building
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Building" size="md">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Building name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Main Campus Block A" required />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="main-campus-block-a" required />
          <Textarea label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <Input label="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 University Ave" />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: "office", label: "Office" },
              { value: "school", label: "School / University" },
              { value: "hospital", label: "Hospital / Clinic" },
              { value: "church", label: "Church / Religious" },
              { value: "mall", label: "Mall / Retail" },
              { value: "event", label: "Event Center" },
              { value: "hotel", label: "Hotel" },
              { value: "other", label: "Other" },
            ]}
          />
          <Select
            label="Visibility"
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            options={[
              { value: "PUBLIC", label: "Public" },
              { value: "PRIVATE", label: "Private" },
            ]}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Building</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { generateSlug } from "@/lib/utils/slug";

export default function NewOrgPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", visibility: "PUBLIC" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: generateSlug(name) });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create organization");
        return;
      }

      const org = await res.json();
      router.push(`/dashboard/organizations/${org.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="New Organization" subtitle="Create a new organization to manage buildings" />
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label="Organization name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme University"
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="acme-university"
            hint="Used in URLs. Must be lowercase with hyphens."
            required
          />
          <Select
            label="Visibility"
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            options={[
              { value: "PUBLIC", label: "Public — anyone can see your buildings" },
              { value: "PRIVATE", label: "Private — only you can see it" },
            ]}
          />

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create organization
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

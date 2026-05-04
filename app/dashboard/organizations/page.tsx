import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";

export const metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  const orgs = await db.organization.findMany({
    where: { ownerId: session!.user.id },
    include: { _count: { select: { buildings: true, members: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="Manage organizations and their buildings"
        actions={
          <Link href="/dashboard/organizations/new">
            <Button variant="blue">
              <Plus className="w-4 h-4" /> New Organization
            </Button>
          </Link>
        }
      />

      {orgs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No organizations yet"
          description="Create an organization to start mapping buildings."
          action={
            <Link href="/dashboard/organizations/new">
              <Button>Create organization</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
              <Card hover className="h-full">
                <div className="w-12 h-12 bg-[#141414] rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4">
                  {org.name[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold">{org.name}</h3>
                <p className="font-mono text-xs text-slate-400 mt-1">/{org.slug}</p>
                <div className="flex gap-4 mt-4 font-mono text-xs text-slate-400">
                  <span>{org._count.buildings} buildings</span>
                  <span>{org._count.members} members</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

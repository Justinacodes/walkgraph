import { OrgRole } from "@prisma/client";
import { db } from "@/lib/db";

const ROLE_RANK: Record<OrgRole, number> = {
  VIEWER: 0,
  MAPPER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const ORG_WRITE_ROLES: OrgRole[] = ["OWNER", "ADMIN"];
export const MAP_EDIT_ROLES: OrgRole[] = ["OWNER", "ADMIN", "MAPPER"];

export function roleAllows(actualRole: OrgRole, allowedRoles: OrgRole[]) {
  return allowedRoles.some((role) => ROLE_RANK[actualRole] >= ROLE_RANK[role]);
}

export async function getOrgRole(organizationId: string, userId: string): Promise<OrgRole | null> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      ownerId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!org) return null;
  if (org.ownerId === userId) return "OWNER";
  return org.members[0]?.role ?? null;
}

export async function canAccessOrg(organizationId: string, userId: string, allowedRoles: OrgRole[] = ["OWNER", "ADMIN", "MAPPER", "VIEWER"]) {
  const role = await getOrgRole(organizationId, userId);
  return role ? roleAllows(role, allowedRoles) : false;
}

export async function canAccessBuilding(buildingId: string, userId: string, allowedRoles: OrgRole[] = ["OWNER", "ADMIN", "MAPPER", "VIEWER"]) {
  const building = await db.building.findUnique({
    where: { id: buildingId },
    select: { organizationId: true },
  });

  if (!building) return { allowed: false, exists: false };
  const allowed = await canAccessOrg(building.organizationId, userId, allowedRoles);
  return { allowed, exists: true, organizationId: building.organizationId };
}

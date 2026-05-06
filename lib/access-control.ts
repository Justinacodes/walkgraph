import { db } from "@/lib/db";
import { canAccessBuilding } from "@/lib/permissions";

export interface BuildingReadAccess {
  exists: boolean;
  allowed: boolean;
  isPublic: boolean;
  memberAccess: boolean;
  organizationId?: string;
}

export async function canReadBuildingGraph(buildingId: string, userId?: string | null): Promise<BuildingReadAccess> {
  const building = await db.building.findUnique({
    where: { id: buildingId },
    select: { organizationId: true, status: true, visibility: true },
  });

  if (!building) return { exists: false, allowed: false, isPublic: false, memberAccess: false };

  const isPublic = building.status === "PUBLISHED" && building.visibility === "PUBLIC";
  let memberAccess = false;
  if (userId) {
    const access = await canAccessBuilding(buildingId, userId);
    memberAccess = access.allowed;
  }

  return {
    exists: true,
    allowed: isPublic || memberAccess,
    isPublic,
    memberAccess,
    organizationId: building.organizationId,
  };
}

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QRNavigator } from "./QRNavigator";

interface QRResolution {
  status: "idle" | "resolved" | "inactive" | "invalid";
  requestedCode: string | null;
  message: string | null;
  checkpointLabel?: string | null;
}

export default async function NavigatePage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ node?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const building = await db.building.findUnique({
    where: { id: resolvedParams.buildingId },
    include: {
      floors: { orderBy: { levelNumber: "asc" } },
      nodes: {
        where: { searchable: true, restricted: false },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          aliases: true,
          tags: true,
          floor: { select: { name: true, levelNumber: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!building || building.status !== "PUBLISHED" || building.visibility !== "PUBLIC") {
    notFound();
  }

  let currentNodeId: string | null = null;
  let qrResolution: QRResolution = {
    status: "idle",
    requestedCode: resolvedSearchParams.node ?? null,
    message: null,
  };

  if (resolvedSearchParams.node) {
    const checkpoint = await db.qRCheckpoint.findUnique({
      where: { code: resolvedSearchParams.node },
      select: {
        code: true,
        label: true,
        active: true,
        buildingId: true,
        node: {
          select: {
            id: true,
            searchable: true,
            restricted: true,
          },
        },
      },
    });

    if (!checkpoint || checkpoint.buildingId !== resolvedParams.buildingId) {
      qrResolution = {
        status: "invalid",
        requestedCode: resolvedSearchParams.node,
        message: "This checkpoint is invalid for this building. Choose your starting point manually.",
      };
    } else if (!checkpoint.active) {
      qrResolution = {
        status: "inactive",
        requestedCode: resolvedSearchParams.node,
        checkpointLabel: checkpoint.label,
        message: "This checkpoint is no longer active. Choose your starting point manually.",
      };
    } else if (!checkpoint.node || !checkpoint.node.searchable || checkpoint.node.restricted) {
      qrResolution = {
        status: "invalid",
        requestedCode: resolvedSearchParams.node,
        checkpointLabel: checkpoint.label,
        message: "This checkpoint is unavailable right now. Choose your starting point manually.",
      };
    } else {
      currentNodeId = checkpoint.node.id;
      qrResolution = {
        status: "resolved",
        requestedCode: resolvedSearchParams.node,
        checkpointLabel: checkpoint.label,
        message: checkpoint.label ? `Checkpoint ready: ${checkpoint.label}.` : "Checkpoint ready.",
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <div className="bg-[#141414] px-5 py-5 text-white safe-area-top">
        <Link
          href={`/explore/${resolvedParams.buildingId}`}
          className="mb-4 flex w-fit items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to building
        </Link>
        <h1 className="text-2xl font-bold">{building.name}</h1>
        <p className="mt-1 text-sm text-white/50">Indoor Navigation</p>
      </div>

      <QRNavigator
        buildingId={building.id}
        nodes={building.nodes}
        floors={building.floors}
        currentNodeId={currentNodeId}
        qrResolution={qrResolution}
      />
    </div>
  );
}

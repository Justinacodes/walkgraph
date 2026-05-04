"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QrCode, Download } from "lucide-react";
import Image from "next/image";

interface Node {
  id: string;
  name: string;
  type: string;
  floor?: { name: string; levelNumber: number } | null;
  qrCheckpoints: { id: string; code: string }[];
}

export function QRManager({ buildingId, nodes }: { buildingId: string; nodes: Node[] }) {
  const [qrData, setQrData] = useState<Record<string, { dataUrl: string; code: string }>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function generateQR(nodeId: string) {
    setLoading(nodeId);
    const res = await fetch(`/api/qr/${nodeId}`);
    if (res.ok) {
      const data = await res.json();
      setQrData((prev) => ({ ...prev, [nodeId]: { dataUrl: data.dataUrl, code: data.code } }));
    }
    setLoading(null);
  }

  function downloadQR(nodeId: string, nodeName: string) {
    const { dataUrl } = qrData[nodeId];
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${nodeName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  return (
    <div>
      <PageHeader
        title="QR Codes"
        subtitle="Generate printable QR codes for navigation checkpoints"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const qr = qrData[node.id];
          const hasExisting = node.qrCheckpoints.length > 0;

          return (
            <Card key={node.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">{node.name}</p>
                  {node.floor && <p className="font-mono text-xs text-slate-400">{node.floor.name}</p>}
                </div>
                {hasExisting && !qr && (
                  <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">Has QR</span>
                )}
              </div>

              {qr ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-2xl p-4 flex justify-center">
                    <img src={qr.dataUrl} alt={`QR for ${node.name}`} className="w-32 h-32" />
                  </div>
                  <p className="font-mono text-xs text-slate-400 text-center truncate">{qr.code}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadQR(node.id, node.name)}
                  >
                    <Download className="w-3 h-3" /> Download PNG
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border border-dashed border-slate-200"
                  onClick={() => generateQR(node.id)}
                  loading={loading === node.id}
                >
                  <QrCode className="w-4 h-4" />
                  {hasExisting ? "Show QR Code" : "Generate QR Code"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <QrCode className="w-10 h-10 mx-auto mb-3" />
          <p>Add searchable nodes first to generate QR codes.</p>
        </div>
      )}
    </div>
  );
}

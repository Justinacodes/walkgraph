"use client";

import { useMemo, useState } from "react";
import { Download, Printer, QrCode } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface QRNode {
  id: string;
  name: string;
  type: string;
  floor: { id: string; name: string; levelNumber: number } | null;
  qrCheckpoints: { id: string; code: string; label: string | null; active: boolean }[];
}

interface QRPayload {
  dataUrl: string;
  code: string;
  shortCode: string;
  qrData: string;
  building: { id: string; name: string };
  floor: { id: string; name: string; levelNumber: number };
  node: { id: string; name: string; type: string };
  checkpoint: { id: string; label: string; active: boolean };
}

export function QRManager({
  building,
  nodes,
}: {
  building: { id: string; name: string };
  nodes: QRNode[];
}) {
  const [qrData, setQrData] = useState<Record<string, QRPayload>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const printableQrs = useMemo(() => Object.values(qrData), [qrData]);

  async function generateQR(nodeId: string) {
    setLoading(nodeId);
    setError("");

    try {
      const res = await fetch(`/api/qr/${nodeId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate QR code.");
        return;
      }

      setQrData((prev) => ({ ...prev, [nodeId]: data as QRPayload }));
    } catch {
      setError("Failed to generate QR code.");
    } finally {
      setLoading(null);
    }
  }

  function downloadQR(nodeId: string, nodeName: string) {
    const qr = qrData[nodeId];
    if (!qr) return;

    const a = document.createElement("a");
    a.href = qr.dataUrl;
    a.download = `qr-${nodeName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  function printSheet() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="QR Codes" subtitle="Generate printable QR codes for navigation checkpoints" />

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button variant="secondary" size="sm" onClick={printSheet} disabled={printableQrs.length === 0}>
          <Printer className="w-4 h-4" /> Print loaded QR sheet
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
        {nodes.map((node) => {
          const qr = qrData[node.id];
          const hasExisting = node.qrCheckpoints.length > 0;

          return (
            <Card key={node.id}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{node.name}</p>
                  {node.floor ? <p className="font-mono text-xs text-slate-400">{node.floor.name}</p> : null}
                </div>
                {hasExisting && !qr ? (
                  <span className="rounded-lg bg-green-50 px-2 py-1 font-mono text-xs text-green-700">Has QR</span>
                ) : null}
              </div>

              {qr ? (
                <div className="space-y-3">
                  <div className="flex justify-center rounded-2xl bg-slate-50 p-4">
                    <img src={qr.dataUrl} alt={`QR for ${node.name}`} className="h-32 w-32" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="font-mono text-xs text-slate-400">Code {qr.shortCode}</p>
                    <p className="truncate text-xs text-slate-500">{qr.qrData}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => downloadQR(node.id, node.name)}>
                      <Download className="w-3 h-3" /> PNG
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full border border-slate-200" onClick={printSheet}>
                      <Printer className="w-3 h-3" /> Print
                    </Button>
                  </div>
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
                  {hasExisting ? "Load QR code" : "Generate QR code"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {nodes.length === 0 ? (
        <div className="py-16 text-center text-slate-400 print:hidden">
          <QrCode className="mx-auto mb-3 h-10 w-10" />
          <p>Add searchable nodes first to generate QR codes.</p>
        </div>
      ) : null}

      {printableQrs.length > 0 ? (
        <div className="hidden print:block">
          <div className="mb-6 border-b border-slate-300 pb-4">
            <h1 className="text-2xl font-bold text-black">{building.name} QR Checkpoints</h1>
            <p className="text-sm text-slate-700">Scan to start indoor directions from here.</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {printableQrs.map((qr) => (
              <div key={qr.checkpoint.id} className="break-inside-avoid rounded-2xl border border-slate-300 p-5 text-black">
                <div className="space-y-1">
                  <p className="text-lg font-bold">{qr.checkpoint.label}</p>
                  <p className="text-sm">{qr.node.name}</p>
                  <p className="text-sm">{qr.floor.name}</p>
                </div>
                <div className="my-4 flex justify-center">
                  <img src={qr.dataUrl} alt={`Printable QR for ${qr.node.name}`} className="h-48 w-48" />
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Manual code: {qr.shortCode}</p>
                  <p>{qr.qrData}</p>
                  <p>Scan to start indoor directions from here.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

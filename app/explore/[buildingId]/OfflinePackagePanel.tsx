"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCcw, Trash2 } from "lucide-react";
import {
  deleteOfflinePackage,
  downloadOfflinePackage,
  getOfflineRegistryEntry,
  markOfflinePackageStatus,
  type OfflinePackageRegistryEntry,
} from "@/lib/offline-browser";

interface OfflinePackagePanelProps {
  buildingId: string;
  latestPackageVersion: number;
}

export function OfflinePackagePanel({ buildingId, latestPackageVersion }: OfflinePackagePanelProps) {
  const [entry, setEntry] = useState<OfflinePackageRegistryEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Visitors can save this published building for account-free, read-only offline search and routing in this browser.");

  useEffect(() => {
    setEntry(getOfflineRegistryEntry(buildingId));
    markOfflinePackageStatus(buildingId, latestPackageVersion).then((next) => {
      if (next) setEntry({ ...next });
    });
  }, [buildingId, latestPackageVersion]);

  async function download() {
    setBusy(true);
    setMessage("Downloading offline package…");
    try {
      const pkg = await downloadOfflinePackage(buildingId);
      await markOfflinePackageStatus(buildingId, latestPackageVersion);
      setEntry(getOfflineRegistryEntry(buildingId));
      setMessage(`Saved version ${pkg.packageVersion}. Offline use depends on browser/PWA storage availability.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed. Try again while online.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    await deleteOfflinePackage(buildingId);
    setEntry(null);
    setMessage("Offline package removed from this browser.");
    setBusy(false);
  }

  const stale = entry?.status === "stale";
  const unsupported = entry?.status === "unsupported";

  return (
    <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#141414]">Offline building package</p>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
          {entry ? (
            <p className="mt-2 text-xs font-mono text-slate-400">
              Downloaded v{entry.packageVersion} · {stale ? "Update available" : unsupported ? "Unsupported schema" : "Current"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={download} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-[#141414] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {stale ? <RefreshCcw className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {entry ? stale || unsupported ? "Update" : "Re-download" : "Download"}
          </button>
          {entry ? (
            <button onClick={remove} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

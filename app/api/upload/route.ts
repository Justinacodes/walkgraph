import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { canAccessBuilding, MAP_EDIT_ROLES } from "@/lib/permissions";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const BUCKET = "floor-plans";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export async function POST(req: Request) {
  const limited = rateLimit(`upload:${getClientIp(req)}`, 20, 60 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many upload attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limited) });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const floorId = formData.get("floorId");

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (typeof floorId !== "string" || !floorId) return NextResponse.json({ error: "floorId required" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Invalid file type. Use PNG, JPG, or WebP." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const floor = await db.floor.findUnique({ where: { id: floorId }, select: { buildingId: true } });
  if (!floor) return NextResponse.json({ error: "Floor not found" }, { status: 404 });

  const access = await canAccessBuilding(floor.buildingId, session.user.id, MAP_EDIT_ROLES);
  if (!access.allowed) return NextResponse.json({ error: access.exists ? "Forbidden" : "Not found" }, { status: access.exists ? 403 : 404 });

  const ext = file.type === "image/jpeg" || file.type === "image/jpg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
  const path = `${floor.buildingId}/${floorId}/${Date.now()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRole } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const ownerIdRaw = formData.get("owner_id");
  const ownerId = typeof ownerIdRaw === "string" ? ownerIdRaw.trim() : "";

  if (!ownerId || !(file instanceof File)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = isAdminRole(profile?.role);

  if (!isAdmin && ownerId !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const fileExt = file.name.split(".").pop() ?? "bin";
  const fileName = `${ownerId}/${randomUUID()}.${fileExt}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("profile-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from("profile-images").getPublicUrl(fileName);

  return NextResponse.json({ path: fileName, publicUrl: data.publicUrl });
}

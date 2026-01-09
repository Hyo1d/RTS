import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth/roles";

const MAX_PER_PAGE = 200;

const requireAdmin = async () => {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.role)) {
    return null;
  }

  return user;
};

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPageRaw = Number(searchParams.get("perPage") ?? MAX_PER_PAGE.toString());
  const perPage = Number.isFinite(perPageRaw)
    ? Math.min(Math.max(perPageRaw, 1), MAX_PER_PAGE)
    : MAX_PER_PAGE;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data.users, total: data.total });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : undefined
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.user) {
    const profilePayload = {
      id: data.user.id,
      email,
      full_name: fullName || null,
      role: "employee"
    };

    await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
    await admin
      .from("employees")
      .update({ user_id: data.user.id })
      .ilike("email", email)
      .is("user_id", null);
  }

  return NextResponse.json({ data: data.user });
}

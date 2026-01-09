import { NextRequest, NextResponse } from "next/server";
import { onboardingSchema } from "@/lib/schemas/onboarding";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: null, last_name: null };
  }
  const [first, ...rest] = parts;
  return {
    first_name: first ?? null,
    last_name: rest.length > 0 ? rest.join(" ") : null
  };
};

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { full_name, email, dni, phone, date_of_birth } = parsed.data;
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name,
      dni,
      phone,
      date_of_birth,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const { first_name, last_name } = splitName(full_name);

  const { data: existingByUser } = await admin
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingByUser?.id) {
    const { error: updateError } = await admin
      .from("employees")
      .update({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth
      })
      .eq("id", existingByUser.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, employeeId: existingByUser.id });
  }

  const { data: existingByEmail } = await admin
    .from("employees")
    .select("id, user_id")
    .ilike("email", email)
    .maybeSingle();

  if (existingByEmail?.user_id && existingByEmail.user_id !== user.id) {
    return NextResponse.json(
      { error: "El email ya esta asociado a otro empleado" },
      { status: 409 }
    );
  }

  if (existingByEmail?.id) {
    const { error: updateError } = await admin
      .from("employees")
      .update({
        user_id: user.id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth
      })
      .eq("id", existingByEmail.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, employeeId: existingByEmail.id });
  }

  const { data: createdEmployee, error: createError } = await admin
    .from("employees")
    .insert({
      user_id: user.id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      status: "active"
    })
    .select("id")
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, employeeId: createdEmployee?.id ?? null });
}

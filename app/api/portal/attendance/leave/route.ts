import { NextRequest, NextResponse } from "next/server";
import { getPortalContext } from "@/lib/auth/portal";
import { createServerClient } from "@/lib/supabase/server";
import { ensureProfileId } from "@/lib/db/profiles";

const MAX_DAYS = 31;

const getDatesInRange = (start: string, end: string) => {
  const dates: string[] = [];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return dates;
  }
  let current = startDate;
  while (current <= endDate && dates.length < MAX_DAYS) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 86400000);
  }
  return dates;
};

export async function POST(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const startDate = typeof body.start_date === "string" ? body.start_date : "";
  const endDate = typeof body.end_date === "string" ? body.end_date : "";
  const status =
    typeof body.status === "string" && ["sick_leave", "vacation"].includes(body.status)
      ? body.status
      : "sick_leave";
  const notes = typeof body.notes === "string" ? body.notes : null;

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Fechas requeridas" }, { status: 400 });
  }

  const dates = getDatesInRange(startDate, endDate);
  if (dates.length === 0) {
    return NextResponse.json({ error: "Rango invalido" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const profileId = await ensureProfileId(supabase);

  const rows = dates.map((date) => ({
    employee_id: employee.id,
    attendance_date: date,
    status,
    source: "manual",
    notes,
    created_by: profileId ?? null
  }));

  const { data, error } = await supabase
    .from("attendance_records")
    .insert(rows)
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

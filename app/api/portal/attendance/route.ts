import { NextRequest, NextResponse } from "next/server";
import { getPortalContext } from "@/lib/auth/portal";
import { createAttendanceRecord, getAttendanceRecords } from "@/lib/db/attendance";
import { attendanceSchema } from "@/lib/schemas/attendance";

export async function GET(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "10");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 10;

  const { data, count } = await getAttendanceRecords({
    employeeId: employee.id,
    status,
    startDate,
    endDate,
    page,
    pageSize
  });

  return NextResponse.json({ data, count });
}

export async function POST(request: NextRequest) {
  const { user, employee } = await getPortalContext();
  if (!user || !employee) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = attendanceSchema.safeParse({
    ...body,
    employee_id: employee.id
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const record = await createAttendanceRecord(parsed.data);

  return NextResponse.json({ data: record });
}

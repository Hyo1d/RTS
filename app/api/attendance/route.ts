import { NextResponse } from "next/server";
import { attendanceSchema } from "@/lib/schemas/attendance";
import { createAttendanceRecord, getAttendanceRecords } from "@/lib/db/attendance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "10");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 10;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const { data, count } = await getAttendanceRecords({
    page,
    pageSize,
    employeeId,
    status,
    startDate,
    endDate
  });

  return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const record = await createAttendanceRecord(parsed.data);
  return NextResponse.json({ data: record });
}

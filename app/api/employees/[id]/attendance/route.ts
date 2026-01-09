import { NextRequest, NextResponse } from "next/server";
import { attendanceSchema } from "@/lib/schemas/attendance";
import { createAttendanceRecord, getAttendanceByEmployee } from "@/lib/db/attendance";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const records = await getAttendanceByEmployee(id);
  return NextResponse.json({ data: records });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = attendanceSchema.safeParse({ ...body, employee_id: id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const record = await createAttendanceRecord(parsed.data);
  return NextResponse.json({ data: record });
}

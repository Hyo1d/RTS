import { NextRequest, NextResponse } from "next/server";
import { attendanceSchema } from "@/lib/schemas/attendance";
import { updateAttendanceRecord, deleteAttendanceRecord } from "@/lib/db/attendance";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = attendanceSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const record = await updateAttendanceRecord(id, parsed.data);
  return NextResponse.json({ data: record });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteAttendanceRecord(id);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { deleteSalary, updateSalary } from "@/lib/db/salaries";
import { salarySchema } from "@/lib/schemas/salary";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = salarySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const salary = await updateSalary(id, parsed.data);
  return NextResponse.json({ data: salary });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteSalary(id);
  return NextResponse.json({ success: true });
}

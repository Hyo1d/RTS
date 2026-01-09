import { NextRequest, NextResponse } from "next/server";
import { deleteSalaryReceipt, updateSalaryReceipt } from "@/lib/db/salaries";
import { salaryReceiptSchema } from "@/lib/schemas/salary";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = salaryReceiptSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receipt = await updateSalaryReceipt(id, parsed.data);
  return NextResponse.json({ data: receipt });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteSalaryReceipt(id);
  return NextResponse.json({ success: true });
}

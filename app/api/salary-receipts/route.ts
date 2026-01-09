import { NextResponse } from "next/server";
import { createSalaryReceipt, getSalaryReceiptsFiltered } from "@/lib/db/salaries";
import { salaryReceiptSchema } from "@/lib/schemas/salary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "10");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 200)
    : 10;

  const { data, count } = await getSalaryReceiptsFiltered({
    employeeId,
    status,
    startDate,
    endDate,
    page,
    pageSize
  });
  return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = salaryReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const receipt = await createSalaryReceipt(parsed.data);
  return NextResponse.json({ data: receipt });
}

import { NextResponse } from "next/server";
import { createSalary, getSalariesFiltered } from "@/lib/db/salaries";
import { salarySchema } from "@/lib/schemas/salary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const currentOnly = searchParams.get("currentOnly") === "true";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "10");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 200)
    : 10;

  const { data, count } = await getSalariesFiltered({
    employeeId,
    currentOnly,
    page,
    pageSize
  });
  return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = salarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const salary = await createSalary(parsed.data);
  return NextResponse.json({ data: salary });
}

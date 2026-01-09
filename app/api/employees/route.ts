import { NextResponse } from "next/server";
import { getEmployees, createEmployee } from "@/lib/db/employees";
import { employeeSchema } from "@/lib/schemas/employee";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? "10");
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 10;
  const search = searchParams.get("search") ?? undefined;
  const department = searchParams.get("department") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const { data, count } = await getEmployees({
    page,
    pageSize,
    search,
    department,
    status
  });

  return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const employee = await createEmployee(parsed.data);
  return NextResponse.json({ data: employee });
}

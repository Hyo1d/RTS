import { NextRequest, NextResponse } from "next/server";
import { addEmployeeDocument, getEmployeeDocuments } from "@/lib/db/employees";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const docs = await getEmployeeDocuments(id);
  return NextResponse.json({ data: docs });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const doc = await addEmployeeDocument({
    ...body,
    employee_id: id
  });
  return NextResponse.json({ data: doc });
}

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { isMasterDataTable, tableHasParent, createMasterDataItem } from "@/lib/master-data-registry";

export async function POST(request: Request, { params }: { params: { table: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isMasterDataTable(params.table)) {
    return NextResponse.json({ error: "Unknown master data table." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const parentId = typeof body?.parentId === "string" ? body.parentId.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (tableHasParent(params.table) && !parentId) {
    return NextResponse.json({ error: "Please select a parent." }, { status: 400 });
  }

  try {
    const item = await createMasterDataItem(params.table, name, parentId);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error(`Failed to create ${params.table} row:`, error);
    return NextResponse.json({ error: "Failed to create row. It may already exist." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { isMasterDataTable, tableHasParent, updateMasterDataItem, deleteMasterDataItem } from "@/lib/master-data-registry";

export async function PATCH(request: Request, { params }: { params: { table: string; id: string } }) {
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
    const item = await updateMasterDataItem(params.table, params.id, name, parentId);
    return NextResponse.json({ item });
  } catch (error) {
    console.error(`Failed to update ${params.table} row ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to save changes." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { table: string; id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isMasterDataTable(params.table)) {
    return NextResponse.json({ error: "Unknown master data table." }, { status: 404 });
  }

  const result = await deleteMasterDataItem(params.table, params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Unable to delete this row." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}

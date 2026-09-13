import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteAdmin } from "@/lib/queries/admin-users";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (session.user.id === params.id) {
    return NextResponse.json(
      { error: "You can't delete your own account. Ask another admin to remove it." },
      { status: 400 }
    );
  }

  try {
    await deleteAdmin(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Failed to delete admin ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to delete admin account." }, { status: 500 });
  }
}

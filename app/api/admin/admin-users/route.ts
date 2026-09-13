import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createAdmin } from "@/lib/queries/admin-users";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const { admin, tempPassword } = await createAdmin(email, name);
    return NextResponse.json({ admin, tempPassword }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });
    }
    console.error("Failed to create admin:", error);
    return NextResponse.json({ error: "Failed to create admin account." }, { status: 500 });
  }
}

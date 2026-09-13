import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.orderedIds) || !body.orderedIds.every((id: unknown) => typeof id === "string")) {
    return NextResponse.json({ error: "orderedIds (string[]) is required." }, { status: 400 });
  }

  const orderedIds: string[] = body.orderedIds;

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.heroImage.update({ where: { id }, data: { sortOrder: index } }))
  );

  return NextResponse.json({ ok: true });
}

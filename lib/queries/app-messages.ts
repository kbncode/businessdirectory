import { prisma } from "@/lib/prisma";

export async function getAppMessage(key: string): Promise<string | null> {
  const row = await prisma.appMessage.findUnique({ where: { key } });
  return row?.text ?? null;
}

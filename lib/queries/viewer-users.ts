import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import type { CursorPage } from "@/lib/queries/business";

// Admin-facing queries over signed-up viewer accounts (the User model).
// Deliberately separate from lib/queries/admin-users.ts, which manages
// Admin accounts (a different model entirely) — naming these both "users"
// would be confusing given the app already has two distinct account types.

const VIEWER_LIST_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  businesses: { select: { status: true } },
} satisfies Prisma.UserSelect;

export type ViewerListItem = Prisma.UserGetPayload<{ select: typeof VIEWER_LIST_SELECT }>;

export type ViewerListingStatus = "active" | "deleted" | "not_listed";

// A viewer's "listing status" summarizes across all businesses they've
// submitted: any APPROVED listing makes them "active" (something is live
// right now); otherwise any REJECTED one (which also covers admin
// "unpublish", since that reuses the REJECTED status) makes them
// "deleted"; anything else (nothing submitted, or only PENDING) is
// "not_listed".
export function getViewerListingStatus(businesses: { status: string }[]): ViewerListingStatus {
  if (businesses.some((b) => b.status === "APPROVED")) return "active";
  if (businesses.some((b) => b.status === "REJECTED")) return "deleted";
  return "not_listed";
}

const PAGE_SIZE = 20;

export async function getViewerUsersForAdmin(cursorToken?: string): Promise<CursorPage<ViewerListItem>> {
  const cursor = cursorToken ? decodeCursor(cursorToken) : null;
  const where: Prisma.UserWhereInput = cursor
    ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }
    : {};

  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    select: VIEWER_LIST_SELECT,
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function getViewerUserForAdmin(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      businesses: {
        select: { id: true, businessName: true, status: true, city: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export interface DeleteViewerResult {
  ok: boolean;
  message?: string;
}

export async function deleteViewerUser(id: string): Promise<DeleteViewerResult> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { ok: false, message: "User not found." };

  const businessCount = await prisma.business.count({ where: { submittedById: id } });
  if (businessCount > 0) {
    return {
      ok: false,
      message: `Can't delete "${user.email}" — they have ${businessCount} business listing${
        businessCount === 1 ? "" : "s"
      }. Delete those listings first.`,
    };
  }

  await prisma.user.delete({ where: { id } });
  return { ok: true };
}

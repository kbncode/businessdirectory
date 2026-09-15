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
  /** Blob URLs (photos/brochures) whose businesses were just removed —
   * the caller deletes these from storage after the DB transaction commits. */
  deletedAssetUrls: string[];
}

// Deleting a user also removes every business they submitted (live listings
// included) — an account gone from the directory shouldn't leave its
// content behind. Businesses' own child rows (sub-category links, etc.)
// already cascade on businessId at the DB level; only the User -> Business
// edge isn't a cascade, so that side is deleted explicitly here, in the
// same transaction as the user row so a failure can't leave orphans.
export async function deleteViewerUser(id: string): Promise<DeleteViewerResult> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { businesses: { select: { photoUrl: true, brochureUrl: true } } },
  });
  if (!user) return { ok: false, message: "User not found.", deletedAssetUrls: [] };

  const deletedAssetUrls = user.businesses.flatMap((b) => [b.photoUrl, b.brochureUrl].filter((url): url is string => Boolean(url)));

  await prisma.$transaction([
    prisma.business.deleteMany({ where: { submittedById: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return { ok: true, deletedAssetUrls };
}

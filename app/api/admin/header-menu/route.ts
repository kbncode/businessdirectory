import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { validateHeaderMenuItemForm, type HeaderMenuItemFormValues } from "@/lib/header-menu-validation";
import { createHeaderMenuItem } from "@/lib/queries/admin-header-menu";

function parseValues(body: unknown): HeaderMenuItemFormValues {
  const b = body as Record<string, unknown> | null;
  return {
    label: typeof b?.label === "string" ? b.label.trim() : "",
    linkType: b?.linkType === "PAGE" || b?.linkType === "EXTERNAL" || b?.linkType === "SYSTEM" ? b.linkType : "SYSTEM",
    pageSlug: typeof b?.pageSlug === "string" ? b.pageSlug : "",
    systemRoute: typeof b?.systemRoute === "string" ? b.systemRoute : "",
    externalUrl: typeof b?.externalUrl === "string" ? b.externalUrl.trim() : "",
    openInNewTab: Boolean(b?.openInNewTab),
    isCta: Boolean(b?.isCta),
  };
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const values = parseValues(body);

  const fieldErrors = validateHeaderMenuItemForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const item = await createHeaderMenuItem(values);
  return NextResponse.json({ item }, { status: 201 });
}

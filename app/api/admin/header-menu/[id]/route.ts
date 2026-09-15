import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { validateHeaderMenuItemForm, type HeaderMenuItemFormValues } from "@/lib/header-menu-validation";
import { updateHeaderMenuItem, setHeaderMenuItemActive, deleteHeaderMenuItem } from "@/lib/queries/admin-header-menu";

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  // A bare { isActive } toggle from the list view skips full-form
  // validation entirely — it isn't touching label/link fields.
  const b = body as Record<string, unknown> | null;
  if (b && typeof b.isActive === "boolean" && Object.keys(b).length === 1) {
    const item = await setHeaderMenuItemActive(params.id, b.isActive);
    return NextResponse.json({ item });
  }

  const values = parseValues(body);
  const fieldErrors = validateHeaderMenuItemForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const item = await updateHeaderMenuItem(params.id, values);
  if (!item) {
    return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await deleteHeaderMenuItem(params.id);
  return NextResponse.json({ ok: true });
}

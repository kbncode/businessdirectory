import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { validateFooterLinkForm, type FooterLinkFormValues } from "@/lib/footer-link-validation";
import { updateFooterLink, setFooterLinkActive, deleteFooterLink } from "@/lib/queries/admin-footer-links";

function parseValues(body: unknown): FooterLinkFormValues {
  const b = body as Record<string, unknown> | null;
  return {
    section: typeof b?.section === "string" ? b.section.trim() : "",
    label: typeof b?.label === "string" ? b.label.trim() : "",
    url: typeof b?.url === "string" ? b.url.trim() : "",
    icon: typeof b?.icon === "string" ? b.icon : "",
  };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  const b = body as Record<string, unknown> | null;
  if (b && typeof b.isActive === "boolean" && Object.keys(b).length === 1) {
    const link = await setFooterLinkActive(params.id, b.isActive);
    return NextResponse.json({ link });
  }

  const values = parseValues(body);
  const fieldErrors = validateFooterLinkForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const link = await updateFooterLink(params.id, values);
  if (!link) {
    return NextResponse.json({ error: "Footer link not found." }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await deleteFooterLink(params.id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { validatePageForm, type PageFormValues } from "@/lib/page-validation";
import { getPageForAdmin, updatePage, deleteCustomPage } from "@/lib/queries/admin-pages";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const page = await getPageForAdmin(params.id);
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  return NextResponse.json({ page });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getPageForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const values: PageFormValues = {
    title: typeof body?.title === "string" ? body.title.trim() : "",
    // The About page's slug is fixed server-side regardless of what's
    // submitted — validate against its real slug so the form never shows a
    // spurious format error for a field it can't actually edit.
    slug: existing.type === "ABOUT" ? existing.slug : typeof body?.slug === "string" ? slugify(body.slug) : "",
    content: typeof body?.content === "string" ? body.content : "",
    status: body?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    seoTitle: typeof body?.seoTitle === "string" ? body.seoTitle.trim() : "",
    seoDescription: typeof body?.seoDescription === "string" ? body.seoDescription.trim() : "",
  };

  const fieldErrors = validatePageForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const result = await updatePage(params.id, values);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  if (result.page) {
    // Both slugs are revalidated: the old one in case it changed (so a
    // stale ISR cache doesn't keep serving content at a slug that no
    // longer resolves) and the new/current one so the fresh content is
    // immediately visible instead of waiting out the cache window.
    if (existing.slug !== result.page.slug) revalidatePath(`/${existing.slug}`);
    revalidatePath(`/${result.page.slug}`);
  }

  return NextResponse.json({ page: result.page });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getPageForAdmin(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  const result = await deleteCustomPage(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Unable to delete this page." }, { status: 409 });
  }

  revalidatePath(`/${existing.slug}`);
  return NextResponse.json({ ok: true });
}

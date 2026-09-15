import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { validatePageForm, type PageFormValues } from "@/lib/page-validation";
import { createCustomPage } from "@/lib/queries/admin-pages";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const values: PageFormValues = {
    title: typeof body?.title === "string" ? body.title.trim() : "",
    slug: typeof body?.slug === "string" ? slugify(body.slug) : "",
    content: typeof body?.content === "string" ? body.content : "",
    status: body?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    seoTitle: typeof body?.seoTitle === "string" ? body.seoTitle.trim() : "",
    seoDescription: typeof body?.seoDescription === "string" ? body.seoDescription.trim() : "",
  };

  const fieldErrors = validatePageForm(values);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the errors below.", fieldErrors }, { status: 400 });
  }

  const result = await createCustomPage(values);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  if (result.page && result.page.status === "PUBLISHED") {
    revalidatePath(`/${result.page.slug}`);
  }

  return NextResponse.json({ page: result.page }, { status: 201 });
}

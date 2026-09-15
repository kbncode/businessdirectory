import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichContent } from "@/components/cms/RichContent";
import { getPublishedPageBySlug } from "@/lib/queries/pages";

// ISR, same as the business detail page — admin edits also call
// revalidatePath() directly, so published changes show up immediately
// instead of waiting out the timer.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageBySlug("about-us");
  if (!page) notFound();

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function AboutUsPage() {
  const page = await getPublishedPageBySlug("about-us");
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{page.title}</h1>
      <div className="mt-8">
        <RichContent html={page.content} />
      </div>
    </div>
  );
}

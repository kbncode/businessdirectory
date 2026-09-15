import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichContent } from "@/components/cms/RichContent";
import { getPublishedCustomPageBySlug } from "@/lib/queries/pages";

// Lowest-priority route in the (public) group — Next.js always resolves a
// static segment (e.g. /browse, /register) before falling through to a
// dynamic one at the same level, so this only ever runs for slugs that
// don't match any other route. Only serves CUSTOM pages; the About page
// has its own fixed /about-us route.
export const revalidate = 300;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPublishedCustomPageBySlug(params.slug);
  if (!page) notFound();

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function CustomPage({ params }: Props) {
  const page = await getPublishedCustomPageBySlug(params.slug);
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

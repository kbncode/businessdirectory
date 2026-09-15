// Pure validation logic, no Node-only or browser-only APIs, so it can run
// unmodified in the client editor (inline errors) and the API route (server
// re-validation) without duplicating the rules in two places.

export interface PageFormValues {
  title: string;
  slug: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string;
  seoDescription: string;
}

export type PageFormErrors = Partial<Record<keyof PageFormValues, string>>;

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

export function validatePageForm(values: PageFormValues): PageFormErrors {
  const errors: PageFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Slug is required.";
  } else if (!SLUG_REGEX.test(values.slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only (e.g. our-story).";
  }

  const textContent = values.content.replace(/<[^>]*>/g, "").trim();
  if (!textContent) {
    errors.content = "Page content can't be empty.";
  }

  if (values.seoTitle.length > SEO_TITLE_MAX) {
    errors.seoTitle = `Keep it under ${SEO_TITLE_MAX} characters.`;
  }
  if (values.seoDescription.length > SEO_DESCRIPTION_MAX) {
    errors.seoDescription = `Keep it under ${SEO_DESCRIPTION_MAX} characters.`;
  }

  return errors;
}

// Pure validation + shared constants for HeaderMenuItem, no Node-only or
// browser-only APIs, so it can run unmodified in the client admin form and
// the API route (server re-validation) without duplicating the rules.

export type HeaderMenuLinkType = "PAGE" | "EXTERNAL" | "SYSTEM";

export const SYSTEM_ROUTES = [
  { value: "/browse", label: "Directory" },
  { value: "/gallery", label: "Gallery" },
  { value: "/events", label: "Events" },
  { value: "/contact", label: "Contact Us" },
  { value: "/register", label: "List Your Business" },
] as const;

export interface HeaderMenuItemFormValues {
  label: string;
  linkType: HeaderMenuLinkType;
  pageSlug: string;
  systemRoute: string;
  externalUrl: string;
  openInNewTab: boolean;
  isCta: boolean;
}

export type HeaderMenuItemFormErrors = Partial<Record<keyof HeaderMenuItemFormValues, string>>;

const URL_REGEX = /^https?:\/\/[^\s]+\.[^\s]+$/i;

export function validateHeaderMenuItemForm(values: HeaderMenuItemFormValues): HeaderMenuItemFormErrors {
  const errors: HeaderMenuItemFormErrors = {};

  if (!values.label.trim()) {
    errors.label = "Label is required.";
  }

  if (values.linkType === "PAGE" && !values.pageSlug) {
    errors.pageSlug = "Choose a page.";
  }
  if (values.linkType === "SYSTEM" && !values.systemRoute) {
    errors.systemRoute = "Choose a route.";
  }
  if (values.linkType === "EXTERNAL") {
    if (!values.externalUrl.trim()) {
      errors.externalUrl = "URL is required.";
    } else if (!URL_REGEX.test(values.externalUrl.trim())) {
      errors.externalUrl = "Enter a full URL, e.g. https://example.com";
    }
  }

  return errors;
}

interface HrefResolvable {
  linkType: HeaderMenuLinkType;
  pageSlug: string | null;
  systemRoute: string | null;
  externalUrl: string | null;
}

// Shared by the live admin preview and the real public header so both ever
// compute a target the same way.
export function resolveHeaderMenuHref(item: HrefResolvable): string {
  switch (item.linkType) {
    case "PAGE":
      return item.pageSlug ? `/${item.pageSlug}` : "#";
    case "SYSTEM":
      return item.systemRoute ?? "#";
    case "EXTERNAL":
      return item.externalUrl ?? "#";
    default:
      return "#";
  }
}

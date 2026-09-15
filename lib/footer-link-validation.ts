// Pure validation + shared constants for FooterLink, no Node-only or
// browser-only APIs — same client-form/server-route dual use as
// header-menu-validation.ts.

export const FOOTER_ICON_OPTIONS = [
  { value: "", label: "None" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "mail", label: "Mail" },
  { value: "phone", label: "Phone" },
  { value: "globe", label: "Globe" },
] as const;

export interface FooterLinkFormValues {
  section: string;
  label: string;
  url: string;
  icon: string;
}

export type FooterLinkFormErrors = Partial<Record<keyof FooterLinkFormValues, string>>;

export function validateFooterLinkForm(values: FooterLinkFormValues): FooterLinkFormErrors {
  const errors: FooterLinkFormErrors = {};

  if (!values.section.trim()) {
    errors.section = "Section is required.";
  }
  if (!values.label.trim()) {
    errors.label = "Label is required.";
  }
  if (!values.url.trim()) {
    errors.url = "URL is required.";
  }

  return errors;
}

// Pure validation logic, no Node-only or browser-only APIs, so it can run
// unmodified in the client editor (inline errors) and the API route (server
// re-validation) without duplicating the rules in two places.

export interface EventFormValues {
  title: string;
  slug: string;
  description: string;
  eventDate: string; // datetime-local value, "" if unset
  endDate: string; // datetime-local value, "" if none
  location: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  isFeatured: boolean;
  status: "DRAFT" | "PUBLISHED";
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

export function validateEventForm(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Slug is required.";
  } else if (!SLUG_REGEX.test(values.slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only (e.g. spring-mixer-2026).";
  }

  const textContent = values.description.replace(/<[^>]*>/g, "").trim();
  if (!textContent) {
    errors.description = "Description can't be empty.";
  }

  const eventDate = values.eventDate ? new Date(values.eventDate) : null;
  if (!eventDate || Number.isNaN(eventDate.getTime())) {
    errors.eventDate = "A valid event date is required.";
  }

  if (values.endDate) {
    const endDate = new Date(values.endDate);
    if (Number.isNaN(endDate.getTime())) {
      errors.endDate = "Enter a valid end date.";
    } else if (eventDate && endDate.getTime() < eventDate.getTime()) {
      errors.endDate = "End date can't be before the event date.";
    }
  }

  if (values.contactEmail.trim() && !EMAIL_REGEX.test(values.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid email address.";
  }
  if (values.contactPhone.trim() && !PHONE_REGEX.test(values.contactPhone.trim())) {
    errors.contactPhone = "Enter a valid phone number.";
  }

  return errors;
}

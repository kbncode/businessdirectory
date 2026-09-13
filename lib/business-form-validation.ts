// Pure validation logic, no Node-only or browser-only APIs, so it can run
// unmodified in the client form (inline errors) and the API route (server
// re-validation) without duplicating the rules in two places.

export interface BusinessFormValues {
  ownerName: string;
  businessName: string;
  establishedYear: string;
  entityId: string;
  typeId: string;
  businessPhone: string;
  personalPhone: string;
  email: string;
  website: string;
  mainCategoryId: string;
  subCategoryIds: string[];
  countryId: string;
  stateId: string;
  city: string;
  area: string;
  nativePlace: string;
  address: string;
  about: string;
  productsServices: string;
  experience: string;
  socialLinks: string;
  additionalNote: string;
}

export type BusinessFormErrors = Partial<Record<keyof BusinessFormValues, string>>;

const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidateBusinessFormOptions {
  stateRequired: boolean;
}

export function validateBusinessForm(
  values: BusinessFormValues,
  { stateRequired }: ValidateBusinessFormOptions
): BusinessFormErrors {
  const errors: BusinessFormErrors = {};

  if (!values.ownerName.trim()) errors.ownerName = "Enter your name.";
  if (!values.businessName.trim()) errors.businessName = "Enter the business name.";

  if (values.establishedYear.trim()) {
    const year = Number(values.establishedYear);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      errors.establishedYear = `Enter a year between 1900 and ${currentYear}.`;
    }
  }

  if (!values.entityId) errors.entityId = "Select a business entity.";
  if (!values.typeId) errors.typeId = "Select a business type.";

  if (!values.businessPhone.trim()) {
    errors.businessPhone = "Enter your business phone number.";
  } else if (!PHONE_REGEX.test(values.businessPhone.trim())) {
    errors.businessPhone = "Enter a valid phone number.";
  }

  if (values.personalPhone.trim() && !PHONE_REGEX.test(values.personalPhone.trim())) {
    errors.personalPhone = "Enter a valid phone number.";
  }

  if (values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.website.trim()) {
    try {
      new URL(values.website.trim());
    } catch {
      errors.website = "Enter a valid URL, including https://";
    }
  }

  if (!values.mainCategoryId) errors.mainCategoryId = "Select a main category.";
  if (values.subCategoryIds.length === 0) {
    errors.subCategoryIds = "Select at least one sub-category.";
  }

  if (!values.countryId) errors.countryId = "Select a country.";
  if (stateRequired && !values.stateId) errors.stateId = "Select a state.";
  if (!values.city.trim()) errors.city = "Enter a city.";

  if (!values.about.trim()) errors.about = "Describe the business.";
  if (!values.productsServices.trim()) errors.productsServices = "Describe your products or services.";

  return errors;
}

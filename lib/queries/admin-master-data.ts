import crypto from "crypto";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

// Admin-only master-data CRUD (countries/states/cities/entities/types/
// categories/sub-categories). None of these ids have a @default(cuid())
// in schema.prisma — they're the human-assigned seed codes (e.g. "C1",
// "MC7") — so new rows created here get a generated id instead.
function newId() {
  return crypto.randomUUID();
}

export interface DeleteResult {
  ok: boolean;
  message?: string;
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// ---------- Countries ----------

export async function listCountries() {
  return prisma.country.findMany({ orderBy: { name: "asc" } });
}

export async function createCountry(name: string) {
  const country = await prisma.country.create({ data: { id: newId(), name } });
  revalidateTag("master-data-countries");
  return country;
}

export async function updateCountry(id: string, name: string) {
  const country = await prisma.country.update({ where: { id }, data: { name } });
  revalidateTag("master-data-countries");
  return country;
}

export async function deleteCountry(id: string): Promise<DeleteResult> {
  const country = await prisma.country.findUnique({ where: { id } });
  if (!country) return { ok: false, message: "Country not found." };

  const [stateCount, businessCount] = await Promise.all([
    prisma.state.count({ where: { countryId: id } }),
    prisma.business.count({ where: { countryId: id } }),
  ]);

  const blockers = [
    stateCount > 0 ? pluralize(stateCount, "state") : null,
    businessCount > 0 ? pluralize(businessCount, "listing") : null,
  ].filter((b): b is string => Boolean(b));

  if (blockers.length > 0) {
    return { ok: false, message: `Can't delete "${country.name}" — ${blockers.join(" and ")} use this country.` };
  }

  await prisma.country.delete({ where: { id } });
  revalidateTag("master-data-countries");
  return { ok: true };
}

// ---------- States ----------

export async function listStates(countryId?: string) {
  return prisma.state.findMany({
    where: countryId ? { countryId } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createState(name: string, countryId: string) {
  const state = await prisma.state.create({ data: { id: newId(), name, countryId } });
  revalidateTag("master-data-states");
  return state;
}

export async function updateState(id: string, name: string, countryId: string) {
  const state = await prisma.state.update({ where: { id }, data: { name, countryId } });
  revalidateTag("master-data-states");
  return state;
}

export async function deleteState(id: string): Promise<DeleteResult> {
  const state = await prisma.state.findUnique({ where: { id } });
  if (!state) return { ok: false, message: "State not found." };

  const [cityCount, businessCount] = await Promise.all([
    prisma.city.count({ where: { stateId: id } }),
    prisma.business.count({ where: { stateId: id } }),
  ]);

  const blockers = [
    cityCount > 0 ? pluralize(cityCount, "city") : null,
    businessCount > 0 ? pluralize(businessCount, "listing") : null,
  ].filter((b): b is string => Boolean(b));

  if (blockers.length > 0) {
    return { ok: false, message: `Can't delete "${state.name}" — ${blockers.join(" and ")} use this state.` };
  }

  await prisma.state.delete({ where: { id } });
  revalidateTag("master-data-states");
  return { ok: true };
}

// ---------- Cities ----------
// Business.city is a free-text string (not a foreign key), so "in use" is
// a name match rather than a relation count.

// MasterDataManager paginates/searches client-side (it needs the full list
// up front for instant search-as-you-type and the parent-name dropdown),
// but the query itself still gets a hard cap so a runaway table can't blow
// up the response — these tables sit at ~150-200 rows today, well under it.
const MASTER_DATA_LIST_CAP = 1000;

export async function listCities(stateId?: string) {
  return prisma.city.findMany({
    where: stateId ? { stateId } : undefined,
    orderBy: { name: "asc" },
    take: MASTER_DATA_LIST_CAP,
  });
}

export async function createCity(name: string, stateId: string) {
  const city = await prisma.city.create({ data: { id: newId(), name, stateId } });
  revalidateTag("master-data-cities");
  return city;
}

export async function updateCity(id: string, name: string, stateId: string) {
  const city = await prisma.city.update({ where: { id }, data: { name, stateId } });
  revalidateTag("master-data-cities");
  return city;
}

export async function deleteCity(id: string): Promise<DeleteResult> {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return { ok: false, message: "City not found." };

  const businessCount = await prisma.business.count({
    where: { city: { equals: city.name, mode: "insensitive" } },
  });

  if (businessCount > 0) {
    return {
      ok: false,
      message: `Can't delete "${city.name}" — ${pluralize(businessCount, "listing")} ${
        businessCount === 1 ? "uses" : "use"
      } this city.`,
    };
  }

  await prisma.city.delete({ where: { id } });
  revalidateTag("master-data-cities");
  return { ok: true };
}

// ---------- Business Entities ----------

export async function listBusinessEntities() {
  return prisma.businessEntity.findMany({ orderBy: { name: "asc" } });
}

export async function createBusinessEntity(name: string) {
  const entity = await prisma.businessEntity.create({ data: { id: newId(), name } });
  revalidateTag("master-data-business-entities");
  return entity;
}

export async function updateBusinessEntity(id: string, name: string) {
  const entity = await prisma.businessEntity.update({ where: { id }, data: { name } });
  revalidateTag("master-data-business-entities");
  return entity;
}

export async function deleteBusinessEntity(id: string): Promise<DeleteResult> {
  const entity = await prisma.businessEntity.findUnique({ where: { id } });
  if (!entity) return { ok: false, message: "Business entity not found." };

  const businessCount = await prisma.business.count({ where: { entityId: id } });
  if (businessCount > 0) {
    return {
      ok: false,
      message: `Can't delete "${entity.name}" — ${pluralize(businessCount, "listing")} use this entity type.`,
    };
  }

  await prisma.businessEntity.delete({ where: { id } });
  revalidateTag("master-data-business-entities");
  return { ok: true };
}

// ---------- Business Types ----------

export async function listBusinessTypes() {
  return prisma.businessType.findMany({ orderBy: { name: "asc" } });
}

export async function createBusinessType(name: string) {
  const type = await prisma.businessType.create({ data: { id: newId(), name } });
  revalidateTag("master-data-business-types");
  return type;
}

export async function updateBusinessType(id: string, name: string) {
  const type = await prisma.businessType.update({ where: { id }, data: { name } });
  revalidateTag("master-data-business-types");
  return type;
}

export async function deleteBusinessType(id: string): Promise<DeleteResult> {
  const type = await prisma.businessType.findUnique({ where: { id } });
  if (!type) return { ok: false, message: "Business type not found." };

  const businessCount = await prisma.business.count({ where: { typeId: id } });
  if (businessCount > 0) {
    return {
      ok: false,
      message: `Can't delete "${type.name}" — ${pluralize(businessCount, "listing")} use this business type.`,
    };
  }

  await prisma.businessType.delete({ where: { id } });
  revalidateTag("master-data-business-types");
  return { ok: true };
}

// ---------- Business Main Categories ----------

export async function listBusinessMainCategories() {
  return prisma.businessMainCategory.findMany({ orderBy: { name: "asc" } });
}

export async function createBusinessMainCategory(name: string) {
  const category = await prisma.businessMainCategory.create({ data: { id: newId(), name } });
  revalidateTag("master-data-business-main-categories");
  return category;
}

export async function updateBusinessMainCategory(id: string, name: string) {
  const category = await prisma.businessMainCategory.update({ where: { id }, data: { name } });
  revalidateTag("master-data-business-main-categories");
  return category;
}

export async function deleteBusinessMainCategory(id: string): Promise<DeleteResult> {
  const category = await prisma.businessMainCategory.findUnique({ where: { id } });
  if (!category) return { ok: false, message: "Main category not found." };

  const [subCategoryCount, businessCount] = await Promise.all([
    prisma.businessSubCategory.count({ where: { mainCategoryId: id } }),
    prisma.business.count({ where: { mainCategoryId: id } }),
  ]);

  const blockers = [
    subCategoryCount > 0 ? pluralize(subCategoryCount, "sub-category") : null,
    businessCount > 0 ? pluralize(businessCount, "listing") : null,
  ].filter((b): b is string => Boolean(b));

  if (blockers.length > 0) {
    return { ok: false, message: `Can't delete "${category.name}" — ${blockers.join(" and ")} use this category.` };
  }

  await prisma.businessMainCategory.delete({ where: { id } });
  revalidateTag("master-data-business-main-categories");
  return { ok: true };
}

// ---------- Business Sub-Categories ----------

export async function listBusinessSubCategories(mainCategoryId?: string) {
  return prisma.businessSubCategory.findMany({
    where: mainCategoryId ? { mainCategoryId } : undefined,
    orderBy: { name: "asc" },
    take: MASTER_DATA_LIST_CAP,
  });
}

export async function createBusinessSubCategory(name: string, mainCategoryId: string) {
  const subCategory = await prisma.businessSubCategory.create({ data: { id: newId(), name, mainCategoryId } });
  revalidateTag("master-data-business-sub-categories");
  return subCategory;
}

export async function updateBusinessSubCategory(id: string, name: string, mainCategoryId: string) {
  const subCategory = await prisma.businessSubCategory.update({ where: { id }, data: { name, mainCategoryId } });
  revalidateTag("master-data-business-sub-categories");
  return subCategory;
}

export async function deleteBusinessSubCategory(id: string): Promise<DeleteResult> {
  const subCategory = await prisma.businessSubCategory.findUnique({ where: { id } });
  if (!subCategory) return { ok: false, message: "Sub-category not found." };

  const usageCount = await prisma.businessSubCategoryMap.count({ where: { subCategoryId: id } });
  if (usageCount > 0) {
    return {
      ok: false,
      message: `Can't delete "${subCategory.name}" — ${pluralize(usageCount, "listing")} use this sub-category.`,
    };
  }

  await prisma.businessSubCategory.delete({ where: { id } });
  revalidateTag("master-data-business-sub-categories");
  return { ok: true };
}

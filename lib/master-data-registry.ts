import * as md from "@/lib/queries/admin-master-data";

export const MASTER_DATA_TABLES = [
  "countries",
  "states",
  "cities",
  "business-entities",
  "business-types",
  "business-main-categories",
  "business-sub-categories",
] as const;

export type MasterDataTableSlug = (typeof MASTER_DATA_TABLES)[number];

export function isMasterDataTable(value: string): value is MasterDataTableSlug {
  return (MASTER_DATA_TABLES as readonly string[]).includes(value);
}

const TABLES_WITH_PARENT: ReadonlySet<MasterDataTableSlug> = new Set<MasterDataTableSlug>([
  "states",
  "cities",
  "business-sub-categories",
]);

export function tableHasParent(table: MasterDataTableSlug) {
  return TABLES_WITH_PARENT.has(table);
}

export async function createMasterDataItem(table: MasterDataTableSlug, name: string, parentId: string) {
  switch (table) {
    case "countries":
      return md.createCountry(name);
    case "states":
      return md.createState(name, parentId);
    case "cities":
      return md.createCity(name, parentId);
    case "business-entities":
      return md.createBusinessEntity(name);
    case "business-types":
      return md.createBusinessType(name);
    case "business-main-categories":
      return md.createBusinessMainCategory(name);
    case "business-sub-categories":
      return md.createBusinessSubCategory(name, parentId);
  }
}

export async function updateMasterDataItem(table: MasterDataTableSlug, id: string, name: string, parentId: string) {
  switch (table) {
    case "countries":
      return md.updateCountry(id, name);
    case "states":
      return md.updateState(id, name, parentId);
    case "cities":
      return md.updateCity(id, name, parentId);
    case "business-entities":
      return md.updateBusinessEntity(id, name);
    case "business-types":
      return md.updateBusinessType(id, name);
    case "business-main-categories":
      return md.updateBusinessMainCategory(id, name);
    case "business-sub-categories":
      return md.updateBusinessSubCategory(id, name, parentId);
  }
}

export async function deleteMasterDataItem(table: MasterDataTableSlug, id: string): Promise<md.DeleteResult> {
  switch (table) {
    case "countries":
      return md.deleteCountry(id);
    case "states":
      return md.deleteState(id);
    case "cities":
      return md.deleteCity(id);
    case "business-entities":
      return md.deleteBusinessEntity(id);
    case "business-types":
      return md.deleteBusinessType(id);
    case "business-main-categories":
      return md.deleteBusinessMainCategory(id);
    case "business-sub-categories":
      return md.deleteBusinessSubCategory(id);
  }
}

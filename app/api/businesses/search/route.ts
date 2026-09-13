import { NextResponse } from "next/server";
import { searchApprovedBusinessesCursor, type BusinessFilters } from "@/lib/queries/business";

// Backs the "Load more" cursor pagination on /browse. Page size is hard
// capped inside searchApprovedBusinessesCursor regardless of what a client
// asks for here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const filters: BusinessFilters = {
    country: params.get("country") || undefined,
    state: params.get("state") || undefined,
    city: params.get("city") || undefined,
    area: params.get("area") || undefined,
    mainCategory: params.get("mainCategory") || undefined,
    subCategories: params.getAll("subCategory").filter(Boolean),
    q: params.get("q") || undefined,
  };

  const cursor = params.get("cursor") || undefined;

  const page = await searchApprovedBusinessesCursor(filters, cursor);
  return NextResponse.json(page);
}

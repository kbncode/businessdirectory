import { redirect } from "next/navigation";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    for (const val of Array.isArray(value) ? value : [value]) {
      params.append(key, val);
    }
  }

  const qs = params.toString();
  redirect(qs ? `/browse?${qs}` : "/browse");
}

import { getFooterLinksForAdmin } from "@/lib/queries/admin-footer-links";
import { FooterLinksManager } from "./FooterLinksManager";

export default async function AdminFooterPage() {
  const links = await getFooterLinksForAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Footer</h1>
      <p className="mt-1 text-sm text-stone">Manage the links shown in the site footer, grouped by section.</p>

      <div className="mt-6">
        <FooterLinksManager initialLinks={links} />
      </div>
    </div>
  );
}

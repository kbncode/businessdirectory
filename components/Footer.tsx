import Image from "next/image";
import Link from "next/link";
import { getActiveFooterLinksGrouped } from "@/lib/queries/footer-links";
import { resolveFooterIcon } from "@/components/icons/resolveFooterIcon";

export async function Footer() {
  const sections = await getActiveFooterLinksGrouped();

  return (
    <footer className="border-t border-sand bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {sections.length > 0 && (
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {sections.map(({ section, links }) => (
              <div key={section}>
                <h3 className="font-display text-xs font-bold uppercase tracking-widest text-stone">{section}</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {links.map((link) => {
                    const Icon = resolveFooterIcon(link.icon);
                    const external = /^https?:\/\//i.test(link.url) || link.url.startsWith("mailto:");
                    return (
                      <li key={link.id}>
                        <Link
                          href={link.url}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink"
                        >
                          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-sand pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="shrink-0">
            <Image
              src="/kbn-logo.png"
              alt="KBN - Kadiya Business Networking"
              height={28}
              width={0}
              sizes="100vw"
              style={{ height: "28px", width: "auto" }}
            />
          </Link>
          <span className="text-sm text-stone">&copy; {new Date().getFullYear()} KBN Business Directory. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

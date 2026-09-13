"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Smartphone,
  Mail,
  Globe,
  FileText,
  Lock,
  Link as LinkIcon,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/Button";

export interface ContactInfo {
  businessPhone: string;
  personalPhone: string | null;
  email: string | null;
  website: string | null;
  brochureUrl: string | null;
}

interface BusinessDetailTabsProps {
  businessId: string;
  about: string | null;
  productsServices: string | null;
  experience: string | null;
  socialLinks: string[];
  contact: ContactInfo;
  isLoggedIn: boolean;
}

type TabKey = "overview" | "products" | "contact";

function ContactRow({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-sand">
        <Icon className="h-4 w-4 text-ink" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone">{label}</p>
        <div className="text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

export function BusinessDetailTabs({
  businessId,
  about,
  productsServices,
  experience,
  socialLinks,
  contact,
  isLoggedIn,
}: BusinessDetailTabsProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    ...(productsServices ? [{ key: "products" as const, label: "Products & Services" }] : []),
    { key: "contact", label: "Contact" },
  ];

  const [active, setActive] = useState<TabKey>("overview");

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-sand">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors",
              active === tab.key ? "text-ink" : "text-stone hover:text-ink"
            )}
          >
            {tab.label}
            {active === tab.key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-signalOrange" />}
          </button>
        ))}
      </div>

      <div className="py-8">
        {active === "overview" && (
          <div className="flex flex-col gap-8">
            {about && (
              <section>
                <h2 className="font-display text-lg font-bold text-ink">About</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">{about}</p>
              </section>
            )}

            {experience && (
              <section>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <Briefcase className="h-4 w-4 text-signalOrange" strokeWidth={1.75} />
                  Experience
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">{experience}</p>
              </section>
            )}

            {socialLinks.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-ink">Social links</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {socialLinks.map((link) => (
                    <li key={link}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-ink underline decoration-sand underline-offset-4 hover:decoration-signalOrange"
                      >
                        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-stone" strokeWidth={1.75} />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!about && !experience && socialLinks.length === 0 && (
              <p className="text-sm text-stone">No additional details provided yet.</p>
            )}
          </div>
        )}

        {active === "products" && productsServices && (
          <section>
            <h2 className="font-display text-lg font-bold text-ink">Products &amp; services</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone">{productsServices}</p>
          </section>
        )}

        {active === "contact" &&
          (isLoggedIn ? (
            <div className="flex flex-col gap-5">
              <ContactRow icon={Phone} label="Business phone">
                {contact.businessPhone}
              </ContactRow>
              {contact.personalPhone && (
                <ContactRow icon={Smartphone} label="Personal phone">
                  {contact.personalPhone}
                </ContactRow>
              )}
              {contact.email && (
                <ContactRow icon={Mail} label="Email">
                  {contact.email}
                </ContactRow>
              )}
              {contact.website && (
                <ContactRow icon={Globe} label="Website">
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-sand underline-offset-4 hover:decoration-signalOrange"
                  >
                    {contact.website}
                  </a>
                </ContactRow>
              )}

              {contact.brochureUrl && (
                <a
                  href={contact.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses("secondary"), "mt-2 inline-flex w-fit items-center gap-2")}
                >
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                  View brochure
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-sm border border-sand bg-sand/40 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stone/30 bg-paper">
                <Lock className="h-4 w-4 text-stone" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-medium text-ink">Log in to view contact details and brochure</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Link href={`/login?callbackUrl=/business/${businessId}`} className={buttonClasses("primary")}>
                  Log in
                </Link>
                <Link href="/signup" className={buttonClasses("ghost")}>
                  Sign up
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

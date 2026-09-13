import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { formatDateTime } from "@/lib/format";
import type { getBusinessForAdmin } from "@/lib/queries/admin-business";

type Business = NonNullable<Awaited<ReturnType<typeof getBusinessForAdmin>>>;

interface BusinessDetailViewProps {
  business: Business;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-ink">{value}</dd>
    </div>
  );
}

export function BusinessDetailView({ business }: BusinessDetailViewProps) {
  return (
    <div className="flex flex-col gap-6 text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-ink">{business.businessName}</h3>
          <p className="text-sm text-stone">
            Submitted by {business.submittedBy.name ?? business.submittedBy.email} &middot;{" "}
            {formatDateTime(business.createdAt)}
          </p>
        </div>
        <StatusBadge status={business.status} />
      </div>

      {business.rejectionReason && (
        <div className="rounded-sm border border-rejectedRed/30 bg-rejectedRed/10 p-3 text-sm text-rejectedRed">
          <strong>Rejection reason:</strong> {business.rejectionReason}
        </div>
      )}

      {business.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Blob/local-hosted photo, host not known ahead of time
        <img
          src={business.photoUrl}
          alt={business.businessName}
          className="h-48 w-full rounded-sm border border-sand object-cover"
        />
      )}

      <SectionDivider />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Owner name" value={business.ownerName} />
        <Field label="Established year" value={business.establishedYear} />
        <Field label="Business entity" value={business.entity.name} />
        <Field label="Business type" value={business.type.name} />
        <Field label="Business phone" value={business.businessPhone} />
        <Field label="Personal phone" value={business.personalPhone} />
        <Field label="Email" value={business.email} />
        <Field label="Website" value={business.website} />
      </dl>

      <SectionDivider />

      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-stone">Category</dt>
        <div className="mt-1 flex flex-wrap gap-2">
          <Badge variant="category">{business.mainCategory.name}</Badge>
          {business.subCategories.map(({ subCategory }) => (
            <Badge key={subCategory.id} variant="category">
              {subCategory.name}
            </Badge>
          ))}
        </div>
      </div>

      <SectionDivider />

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Country" value={business.country.name} />
        <Field label="State" value={business.state?.name} />
        <Field label="City" value={business.city} />
        <Field label="Area" value={business.area} />
        <Field label="Native place" value={business.nativePlace} />
        <Field label="Business address" value={business.address} />
      </dl>

      <SectionDivider />

      <dl className="flex flex-col gap-4">
        <Field label="About business" value={business.about} />
        <Field label="Products / services" value={business.productsServices} />
        <Field label="Work / project experience" value={business.experience} />
        <Field label="Social media links" value={business.socialLinks} />
        <Field label="Additional note" value={business.additionalNote} />
      </dl>

      <SectionDivider />

      <div className="flex flex-wrap gap-3">
        {business.photoUrl && (
          <a href={business.photoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-ink underline">
            View full photo
          </a>
        )}
        {business.brochureUrl && (
          <a
            href={business.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink underline"
          >
            Download brochure
          </a>
        )}
        {!business.photoUrl && !business.brochureUrl && <p className="text-sm text-stone">No files uploaded.</p>}
      </div>
    </div>
  );
}

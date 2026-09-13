import { notFound } from "next/navigation";
import { getViewerSession } from "@/lib/auth";
import { getMyListingById } from "@/lib/queries/my-listings";
import { getFilterMasterData, getBusinessEntities, getBusinessTypes } from "@/lib/queries/business";
import { RegisterForm } from "@/app/(public)/register/RegisterForm";
import type { BusinessFormValues } from "@/lib/business-form-validation";

interface Props {
  params: { id: string };
}

export default async function MyListingEditPage({ params }: Props) {
  const session = await getViewerSession();
  if (!session?.user?.id) return null;

  const business = await getMyListingById(params.id, session.user.id);
  if (!business) notFound();

  const [masterData, entities, types] = await Promise.all([
    getFilterMasterData(),
    getBusinessEntities(),
    getBusinessTypes(),
  ]);

  const initialValues: BusinessFormValues = {
    ownerName: business.ownerName,
    businessName: business.businessName,
    establishedYear: business.establishedYear ? String(business.establishedYear) : "",
    entityId: business.entityId,
    typeId: business.typeId,
    businessPhone: business.businessPhone,
    personalPhone: business.personalPhone ?? "",
    email: business.email ?? "",
    website: business.website ?? "",
    mainCategoryId: business.mainCategoryId,
    subCategoryIds: business.subCategories.map((m) => m.subCategoryId),
    countryId: business.countryId,
    stateId: business.stateId ?? "",
    city: business.city,
    area: business.area ?? "",
    nativePlace: business.nativePlace ?? "",
    address: business.address ?? "",
    about: business.about ?? "",
    productsServices: business.productsServices ?? "",
    experience: business.experience ?? "",
    socialLinks: business.socialLinks ?? "",
    additionalNote: business.additionalNote ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Edit listing</h1>
      <p className="mt-1 text-sm text-stone">
        Changes are published immediately{business.status === "APPROVED" ? " — your listing stays live." : "."}
      </p>

      <RegisterForm
        mode="owner-edit"
        businessId={business.id}
        initialValues={initialValues}
        initialPhotoUrl={business.photoUrl}
        initialBrochureUrl={business.brochureUrl}
        masterData={masterData}
        entities={entities}
        types={types}
      />
    </div>
  );
}

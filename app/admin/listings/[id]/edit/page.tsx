import { notFound } from "next/navigation";
import { getBusinessForAdmin } from "@/lib/queries/admin-business";
import { getFilterMasterData, getBusinessEntities, getBusinessTypes } from "@/lib/queries/business";
import { RegisterForm } from "@/app/(public)/register/RegisterForm";
import type { BusinessFormValues } from "@/lib/business-form-validation";

export default async function AdminEditListingPage({ params }: { params: { id: string } }) {
  const business = await getBusinessForAdmin(params.id);
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
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Edit listing</h1>
      <p className="mt-1 text-sm text-stone">{business.businessName}</p>

      <div className="mt-6 rounded-sm border border-sand bg-paper p-6">
        <RegisterForm
          mode="edit"
          businessId={business.id}
          initialValues={initialValues}
          initialPhotoUrl={business.photoUrl}
          initialBrochureUrl={business.brochureUrl}
          masterData={masterData}
          entities={entities}
          types={types}
        />
      </div>
    </div>
  );
}

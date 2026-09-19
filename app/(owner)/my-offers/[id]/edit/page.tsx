import { notFound } from "next/navigation";
import { getViewerSession } from "@/lib/auth";
import { getMyEditablePromotionById } from "@/lib/queries/promotions";
import { EditPromotionForm } from "./EditPromotionForm";

interface Props {
  params: { id: string };
}

export default async function EditPromotionPage({ params }: Props) {
  const session = await getViewerSession();
  if (!session?.user?.id) return null;

  const promotion = await getMyEditablePromotionById(params.id, session.user.id);
  if (!promotion) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Edit offer</h1>
      <p className="mt-1 text-sm text-stone">
        {promotion.business.businessName} &middot; changes are published immediately.
      </p>

      <div className="mt-8">
        <EditPromotionForm
          promotion={{
            id: promotion.id,
            type: promotion.type,
            title: promotion.title,
            description: promotion.description,
            imageUrl: promotion.imageUrl,
            startDate: promotion.startDate.toISOString().slice(0, 10),
            endDate: promotion.endDate.toISOString().slice(0, 10),
            details: (promotion.details ?? {}) as Record<string, string>,
          }}
        />
      </div>
    </div>
  );
}

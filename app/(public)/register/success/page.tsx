import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { getAppMessage } from "@/lib/queries/app-messages";

export default async function RegisterSuccessPage() {
  const message = await getAppMessage("Registration Success!");

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Thank you</h1>

      {message && <p className="mt-4 text-sm text-ink">{message}</p>}

      <div className="mt-6 rounded-sm border border-approvedGreen/30 bg-approvedGreen/10 p-4 text-sm text-approvedGreen">
        Your listing is <strong>pending admin review</strong> and won&apos;t be visible on the public directory until
        it&apos;s approved.
      </div>

      <Link href="/" className={buttonClasses("primary", "mt-8 inline-flex")}>
        Back to home
      </Link>
    </div>
  );
}

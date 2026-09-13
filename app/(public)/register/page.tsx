import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { getViewerSession } from "@/lib/auth";
import { getFilterMasterData, getBusinessEntities, getBusinessTypes } from "@/lib/queries/business";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getViewerSession();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">List your business</h1>
        <p className="mt-3 text-sm text-stone">Log in or create an account to list your business</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login?callbackUrl=/register" className={buttonClasses("primary")}>
            Log in
          </Link>
          <Link href="/signup?callbackUrl=/register" className={buttonClasses("ghost")}>
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const [masterData, entities, types] = await Promise.all([
    getFilterMasterData(),
    getBusinessEntities(),
    getBusinessTypes(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">List your business</h1>
      <p className="mt-1 text-sm text-stone">
        Fill out the details below. Your listing will be reviewed by an admin before it appears publicly.
      </p>

      <RegisterForm masterData={masterData} entities={entities} types={types} />
    </div>
  );
}

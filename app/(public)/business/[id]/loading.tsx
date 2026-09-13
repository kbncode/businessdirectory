export default function BusinessDetailLoading() {
  return (
    <div>
      <section className="bg-paper py-10 md:py-14">
        <div className="mx-auto max-w-5xl animate-pulse px-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-36 w-36 shrink-0 rounded-sm bg-sand sm:h-44 sm:w-44" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 rounded-sm bg-sand" />
              <div className="h-4 w-1/3 rounded-sm bg-sand" />
              <div className="h-5 w-1/2 rounded-sm bg-sand" />
              <div className="h-4 w-2/3 rounded-sm bg-sand" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand/20 py-10 md:py-14">
        <div className="mx-auto max-w-5xl animate-pulse px-4">
          <div className="rounded-sm border border-sand bg-paper px-8 py-8">
            <div className="flex gap-6 border-b border-sand pb-3">
              <div className="h-4 w-16 rounded-sm bg-sand" />
              <div className="h-4 w-32 rounded-sm bg-sand" />
              <div className="h-4 w-16 rounded-sm bg-sand" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded-sm bg-sand" />
              <div className="h-4 w-full rounded-sm bg-sand" />
              <div className="h-4 w-2/3 rounded-sm bg-sand" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

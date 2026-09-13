function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-sand bg-paper">
      <div className="aspect-[4/3] w-full animate-pulse bg-sand" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded-sm bg-sand" />
        <div className="h-4 w-1/2 animate-pulse rounded-sm bg-sand" />
        <div className="h-4 w-1/3 animate-pulse rounded-sm bg-sand" />
        <div className="h-4 w-full animate-pulse rounded-sm bg-sand" />
      </div>
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-16 animate-pulse rounded-sm bg-sand" />
      <div className="h-9 w-full animate-pulse rounded-sm bg-sand" />
    </div>
  );
}

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-7 w-64 animate-pulse rounded-sm bg-sand" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden flex-col gap-5 lg:flex">
          <SkeletonField />
          <div className="h-px w-full bg-sand" />
          <div className="h-4 w-20 animate-pulse rounded-sm bg-sand" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonField key={i} />
          ))}
        </aside>

        <div>
          <div className="h-4 w-40 animate-pulse rounded-sm bg-sand" />
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

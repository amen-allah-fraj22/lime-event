export function ArtistProfileSkeleton() {
  return (
    <div className="animate-pulse bg-surface">
      <div className="mx-auto mt-4 max-w-container-max px-margin-mobile md:mt-8 md:px-margin-desktop">
        <div className="h-[250px] rounded-none bg-surface-container-high md:h-[400px] md:rounded-xl" />
        <div className="-mt-20 rounded-2xl bg-white p-8 md:-mt-32 md:mx-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="-mt-16 h-32 w-32 rounded-xl bg-surface-container md:-mt-24 md:h-48 md:w-48" />
            <div className="flex-1 space-y-3">
              <div className="h-10 w-2/3 rounded-lg bg-surface-container" />
              <div className="h-5 w-1/3 rounded bg-surface-container-low" />
              <div className="h-12 w-full rounded-lg bg-surface-container md:w-64" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-container-max px-margin-mobile md:px-margin-desktop">
        <div className="h-12 w-full max-w-md rounded bg-surface-container-low" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="h-64 rounded-2xl bg-surface-container-lowest md:col-span-2" />
          <div className="h-64 rounded-2xl bg-surface-container-lowest" />
        </div>
      </div>
    </div>
  );
}

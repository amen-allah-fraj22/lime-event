export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-brand-accent">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-lime-container border-t-transparent"
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default function RootLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-surface">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-primary-container border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}

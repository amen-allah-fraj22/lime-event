export default function DashboardLoading() {
  return (
    <div className="ml-64 flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <div
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary-container border-t-transparent"
          aria-hidden
        />
        <p className="mt-4 text-sm text-secondary">Loading dashboard…</p>
      </div>
    </div>
  );
}

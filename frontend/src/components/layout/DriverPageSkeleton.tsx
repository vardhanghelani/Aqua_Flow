export function DriverPageSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4 lg:max-w-2xl">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-20 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
      <div className="h-32 rounded-xl bg-muted" />
    </div>
  );
}

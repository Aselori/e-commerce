export default function Loading() {
  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10 space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

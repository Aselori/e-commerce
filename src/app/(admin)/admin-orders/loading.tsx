export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg h-64 animate-pulse" />
    </div>
  );
}

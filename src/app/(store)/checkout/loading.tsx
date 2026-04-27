export default function Loading() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 h-32 animate-pulse" />
          <div className="bg-white rounded-lg shadow-sm p-6 h-56 animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 h-64 animate-pulse" />
      </div>
    </div>
  );
}

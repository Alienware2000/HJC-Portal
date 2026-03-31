export default function MemberDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-gray-100 rounded-full" />
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

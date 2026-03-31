export default function PartyMemberItineraryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

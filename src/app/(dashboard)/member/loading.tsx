export default function MemberLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-48 bg-gray-200 rounded" /><div className="h-4 w-72 bg-gray-100 rounded mt-2" /></div>
      <div className="h-24 bg-gray-100 rounded-xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

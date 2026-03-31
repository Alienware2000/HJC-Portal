export default function StaffLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-48 bg-gray-200 rounded" /><div className="h-4 w-72 bg-gray-100 rounded mt-2" /></div>
      <div className="grid grid-cols-2 gap-4">{Array.from({length:2}).map((_,i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

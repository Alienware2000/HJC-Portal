export default function ExportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-32 bg-gray-200 rounded" /><div className="h-4 w-64 bg-gray-100 rounded mt-2" /></div>
      <div className="grid sm:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}</div>
    </div>
  );
}

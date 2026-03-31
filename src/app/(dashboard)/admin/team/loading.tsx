export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-32 bg-gray-200 rounded" /><div className="h-4 w-56 bg-gray-100 rounded mt-2" /></div>
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="space-y-3">
        {Array.from({length:3}).map((_,i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}

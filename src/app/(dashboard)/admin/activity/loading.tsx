export default function ActivityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-7 w-40 bg-gray-200 rounded" /><div className="h-4 w-56 bg-gray-100 rounded mt-2" /></div>
      <div className="space-y-2">
        {Array.from({length:8}).map((_,i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}

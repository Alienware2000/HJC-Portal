"use client";

import { AlertCircle } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-gray-700 mb-4">{error.message || "Something went wrong."}</p>
      <button onClick={reset} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
        Try again
      </button>
    </div>
  );
}

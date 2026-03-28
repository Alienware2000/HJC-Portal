"use client";

import { AlertCircle } from "lucide-react";

export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-16">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
      <p className="text-sm text-gray-700">{error.message || "Something went wrong."}</p>
      <button onClick={reset} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        Try Again
      </button>
    </div>
  );
}

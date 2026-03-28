"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { accessCodeSchema, type AccessCodeInput } from "@/lib/validations/auth";
import { loginWithAccessCode } from "@/actions/auth";

export function AccessCodeForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<AccessCodeInput>({
    resolver: zodResolver(accessCodeSchema),
  });

  const onSubmit = (data: AccessCodeInput) => {
    setError(null);
    startTransition(async () => {
      const result = await loginWithAccessCode(data.code);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div>
      <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Welcome back</h2>
      <p className="text-sm text-gray-500 mt-1.5 mb-8">Enter your access code to continue.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="code" className="text-sm font-medium text-gray-700">
            Access Code
          </label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            autoFocus
            placeholder="e.g. SMITH-2026"
            className="mt-1.5 w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 uppercase placeholder:text-gray-400 placeholder:normal-case focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
            {...register("code")}
          />
          {errors.code && (
            <p className="text-[13px] text-red-600 mt-1">{errors.code.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-10 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-4 text-[13px]">
        <Link href="/staff-login" className="text-gray-400 hover:text-gray-600 transition-colors">
          Staff login
        </Link>
        <span className="text-gray-200">|</span>
        <Link href="/admin-login" className="text-gray-400 hover:text-gray-600 transition-colors">
          Admin login
        </Link>
      </div>
    </div>
  );
}

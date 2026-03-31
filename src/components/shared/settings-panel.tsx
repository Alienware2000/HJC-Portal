"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeOwnPassword } from "@/actions/team";

export function SettingsPanel() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const passwordsMatch = newPassword === confirmPassword;
  const isValid = newPassword.length >= 8 && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    startTransition(async () => {
      const result = await changeOwnPassword({ newPassword, confirmPassword });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)]">
      <p className="text-sm font-semibold text-gray-900 mb-1">Change Password</p>
      <p className="text-[13px] text-gray-400 mb-4">Update your account password.</p>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            New Password
          </label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Re-enter your new password"
            className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-sm"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          Update Password
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  UsersRound,
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  KeyRound,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTeamMember,
  updateTeamMemberRole,
  deleteTeamMember,
  resetTeamMemberPassword,
} from "@/actions/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

type Filter = "all" | "admin" | "staff";

export function TeamPanel({ members }: { members: Profile[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetMember, setTargetMember] = useState<Profile | null>(null);

  // Form state
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "staff" as "admin" | "staff" });
  const [newPassword, setNewPassword] = useState("");

  const filtered = members
    .filter((m) => filter === "all" || m.role === filter)
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    });

  const handleCreate = () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required");
      return;
    }
    startTransition(async () => {
      const result = await createTeamMember(form);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${form.role === "admin" ? "Admin" : "Staff"} account created`);
        setCreateOpen(false);
        setForm({ fullName: "", email: "", password: "", role: "staff" });
        router.refresh();
      }
    });
  };

  const handleRoleChange = (member: Profile) => {
    const newRole = member.role === "admin" ? "staff" : "admin";
    startTransition(async () => {
      const result = await updateTeamMemberRole({ userId: member.id, newRole });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Changed ${member.full_name || member.email} to ${newRole}`);
        router.refresh();
      }
    });
  };

  const handleResetPassword = () => {
    if (!targetMember || !newPassword.trim()) return;
    startTransition(async () => {
      const result = await resetTeamMemberPassword({
        userId: targetMember.id,
        newPassword,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset successfully");
        setResetOpen(false);
        setNewPassword("");
        setTargetMember(null);
      }
    });
  };

  const handleDelete = () => {
    if (!targetMember) return;
    startTransition(async () => {
      const result = await deleteTeamMember(targetMember.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Removed ${targetMember.full_name || targetMember.email}`);
        setDeleteOpen(false);
        setTargetMember(null);
        router.refresh();
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Add member button */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 focus-visible:ring-2 focus-visible:ring-ring/50 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {(["all", "admin", "staff"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-ring/50 ${
              filter === f
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? `All (${members.length})`
              : f === "admin"
                ? `Admins (${members.filter((m) => m.role === "admin").length})`
                : `Staff (${members.filter((m) => m.role === "staff").length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Email
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Added
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-gray-500">
                        {(member.full_name || member.email || "U")
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.full_name || "—"}
                      </p>
                      <p className="text-xs text-gray-400 truncate sm:hidden">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                  {member.email}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-2 py-0.5 ${
                      member.role === "admin"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        member.role === "admin" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    {member.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                  {formatDate(member.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-ring/50 transition-all" />
                      }
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member)}
                        disabled={isPending}
                      >
                        {member.role === "admin" ? (
                          <>
                            <UserCog className="h-4 w-4" />
                            Change to Staff
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            Change to Admin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setTargetMember(member);
                          setResetOpen(true);
                        }}
                      >
                        <KeyRound className="h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setTargetMember(member);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="mx-auto max-w-[240px]">
                    <div className="mx-auto h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <UsersRound className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {search ? "No results found" : "No team members yet"}
                    </p>
                    <p className="text-[13px] text-gray-400 mt-1">
                      {search
                        ? "Try a different name or email."
                        : "Add admins for full control or staff for read-only access to member data."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new staff or admin account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name
              </label>
              <input
                placeholder="e.g. Jane Smith"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <input
                type="email"
                placeholder="jane@example.com"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200/60 text-sm placeholder:text-gray-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:border-blue-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1),inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none transition-all"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </label>
              <div className="flex gap-2">
                {(["staff", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all border ${
                      form.role === r
                        ? r === "admin"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-gray-50 border-gray-200/60 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {r === "admin" ? "Admin" : "Staff"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open);
          if (!open) { setNewPassword(""); setTargetMember(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {targetMember?.full_name || targetMember?.email}.
            </DialogDescription>
          </DialogHeader>
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
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <button
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 8}
              className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:bg-gray-950 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reset Password
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setTargetMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {targetMember?.full_name || targetMember?.email}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

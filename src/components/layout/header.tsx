"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@/lib/constants";

const PAGE_TITLES: Record<string, string> = {
  "/member": "Dashboard",
  "/member/itinerary": "My Itinerary",
  "/member/party": "My Party",
  "/admin": "Dashboard",
  "/admin/members": "Members",
  "/admin/access-codes": "Access Codes",
  "/admin/activity": "Activity",
  "/admin/exports": "Exports",
  "/admin/imports": "Imports",
  "/staff": "Dashboard",
};

const ROLE_LABELS: Record<Role, string> = {
  board_member: "Member",
  admin: "Admin",
  staff: "Staff",
};

const ROLE_COLORS: Record<Role, string> = {
  board_member: "bg-blue-50 text-blue-700",
  admin: "bg-amber-50 text-amber-700",
  staff: "bg-emerald-50 text-emerald-700",
};

const BREADCRUMB_ROOT: Record<Role, string> = {
  board_member: "Overview",
  admin: "Admin",
  staff: "Staff",
};

interface HeaderProps {
  role: Role;
  eventName?: string | null;
}

export function Header({ role, eventName }: HeaderProps) {
  const pathname = usePathname();

  // Find page title
  let pageTitle = PAGE_TITLES[pathname];
  if (!pageTitle) {
    if (pathname.startsWith("/member/party/")) pageTitle = "Party Member";
    else if (pathname.startsWith("/admin/members/")) pageTitle = "Member Details";
    else if (pathname.startsWith("/staff/members/")) pageTitle = "Member Details";
    else pageTitle = "Dashboard";
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center justify-between h-[52px] px-5 lg:px-8">
        <div className="flex items-center gap-2 text-sm pl-10 lg:pl-0">
          <span className="text-gray-400">{BREADCRUMB_ROOT[role]}</span>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-900">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          {eventName && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {eventName}
            </div>
          )}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Activity,
  ClipboardList,
  UserPlus,
  Menu,
  Download,
  Upload,
  LogOut,
  Loader2,
  UsersRound,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logout } from "@/actions/auth";
import type { Role } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_SECTIONS: Record<Role, { label: string; items: NavItem[] }[]> = {
  board_member: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", href: "/member", icon: LayoutDashboard },
        { label: "My Itinerary", href: "/member/itinerary", icon: ClipboardList },
        { label: "My Party", href: "/member/party", icon: UserPlus },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/member/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      label: "Main Navigation",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Members", href: "/admin/members", icon: Users },
        { label: "Access Codes", href: "/admin/access-codes", icon: KeyRound },
        { label: "Activity", href: "/admin/activity", icon: Activity },
        { label: "Team", href: "/admin/team", icon: UsersRound },
      ],
    },
    {
      label: "Data",
      items: [
        { label: "Exports", href: "/admin/exports", icon: Download },
        { label: "Imports", href: "/admin/imports", icon: Upload },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
  staff: [
    {
      label: "Main",
      items: [
        { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "/staff/settings", icon: Settings },
      ],
    },
  ],
};

interface SidebarProps {
  role: Role;
  userName: string | null;
  userEmail?: string | null;
}

function NavContent({
  role,
  userName,
  userEmail,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS[role] || [];
  const dashboardRoot = `/${role === "board_member" ? "member" : role}`;
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } catch (e) { if (!(e instanceof Error && e.message?.includes("NEXT_REDIRECT"))) toast.error("Failed to sign out"); }
    setLoggingOut(false);
  };

  return (
    <div className="flex h-full flex-col bg-[#0f1623]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] shrink-0 border-b border-white/[0.06]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.1]">
          <span className="text-[10px] font-bold text-white/90 tracking-tight">HJ</span>
        </div>
        <span className="text-[14px] font-semibold text-white/80 truncate">Healing Jesus</span>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold text-white/20 uppercase tracking-[0.08em]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== dashboardRoot && pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white/20 focus:outline-none",
                      isActive
                        ? "bg-white/[0.12] text-white font-medium"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                    )}
                  >
                    <item.icon className={cn("h-[15px] w-[15px] shrink-0", isActive ? "text-white" : "")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{(userName || "U").charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#0f1623]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white/80 truncate">{userName || "User"}</p>
            {userEmail && <p className="text-[10px] text-white/30 truncate">{userEmail}</p>}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sign out"
            className="p-2 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/20 focus:outline-none transition-all shrink-0"
          >
            {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="fixed left-3 top-3 z-40 lg:hidden h-8 w-8" />}>
          <Menu className="h-4 w-4" />
          <span className="sr-only">Menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0 bg-[#0f1623] border-none">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavContent role={role} userName={userName} userEmail={userEmail} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <aside className="hidden lg:flex lg:w-[240px] lg:flex-col lg:fixed lg:inset-y-0">
        <NavContent role={role} userName={userName} userEmail={userEmail} />
      </aside>
    </>
  );
}

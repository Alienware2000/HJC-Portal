export const ROLES = {
  BOARD_MEMBER: "board_member",
  ADMIN: "admin",
  STAFF: "staff",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SYNTHETIC_EMAIL_DOMAIN = "conference.internal";

export const ROLE_DASHBOARDS: Record<Role, string> = {
  [ROLES.BOARD_MEMBER]: "/member",
  [ROLES.ADMIN]: "/admin",
  [ROLES.STAFF]: "/staff",
};

export const ROLE_LOGIN_ROUTES: Record<Role, string> = {
  [ROLES.BOARD_MEMBER]: "/login",
  [ROLES.ADMIN]: "/admin-login",
  [ROLES.STAFF]: "/staff-login",
};

export const AUTH_ROUTES = ["/login", "/admin-login", "/staff-login"];

export const PROTECTED_ROUTE_PREFIXES: Record<string, Role> = {
  "/member": ROLES.BOARD_MEMBER,
  "/admin": ROLES.ADMIN,
  "/staff": ROLES.STAFF,
};

export function toSyntheticEmail(accessCode: string): string {
  return `${accessCode.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

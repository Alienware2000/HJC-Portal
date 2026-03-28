import { EmailLoginForm } from "@/components/auth/email-login-form";

export const metadata = { title: "Staff Login — Healing Jesus Conference" };

export default function StaffLoginPage() {
  return (
    <EmailLoginForm
      role="staff"
      title="Staff Login"
      description="Sign in to view board member information."
    />
  );
}

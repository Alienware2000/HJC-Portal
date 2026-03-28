import { EmailLoginForm } from "@/components/auth/email-login-form";

export const metadata = { title: "Admin Login — Healing Jesus Conference" };

export default function AdminLoginPage() {
  return (
    <EmailLoginForm
      role="admin"
      title="Admin Login"
      description="Sign in to the admin dashboard."
    />
  );
}

import AuthShell from "../_components/AuthShell";
import type { Metadata } from "next";
import RegisterForm from "./_components/registerForm";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your Elite Messenger account and start connecting, messaging, sharing, and discovering new people.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      badge="Join the network"
      title="Create your Elite identity."
      description="Build your profile, meet new people, and start conversations without needing a phone number."
      footerText="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/auth/login"
    >
      <RegisterForm />
    </AuthShell>
  );
}

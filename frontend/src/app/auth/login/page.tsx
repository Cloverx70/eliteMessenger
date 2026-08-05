import type { Metadata } from "next";

import AuthShell from "../_components/AuthShell";
import { LoginForm } from "./_components/loginForm";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Elite Messenger to access your conversations, friends, groups, media, and notifications.",
};

export default function LoginPage() {
  return (
    <AuthShell
      badge="Welcome back"
      title="Pick up where you left off."
      description="Sign in to continue your conversations and reconnect with your people."
      footerText="New to Elite Messenger?"
      footerLinkLabel="Create an account"
      footerLinkHref="/auth/register"
    >
      <LoginForm />
    </AuthShell>
  );
}

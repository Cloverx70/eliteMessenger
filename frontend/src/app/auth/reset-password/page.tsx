import type { Metadata } from "next";

import AuthShell from "../_components/AuthShell";
import { ResetPasswordForm } from "./_components/resetPaswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Request a secure Elite Messenger password reset link.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      badge="Account recovery"
      title="Let’s get you back in."
      description="Enter the email connected to your Elite Messenger account. We’ll send a secure reset link if the account exists."
      footerText="Remembered your password?"
      footerLinkLabel="Return to login"
      footerLinkHref="/auth/login"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

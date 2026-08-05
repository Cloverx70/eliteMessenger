import type { Metadata } from "next";

import AuthShell from "../../_components/AuthShell";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Create New Password",
  description:
    "Create a new secure password for your Elite Messenger account.",
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function VerifyResetPasswordPage({
  params,
}: PageProps) {
  const { token } = await params;

  return (
    <AuthShell
      badge="Create a new password"
      title="Secure your account."
      description="Choose a strong password you have not used before. You’ll return to login after the reset succeeds."
      footerText="Password already updated?"
      footerLinkLabel="Return to login"
      footerLinkHref="/auth/login"
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}

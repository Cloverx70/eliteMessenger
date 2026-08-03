"use client";

import ProfileError from "./_components/ProfileError";
import ProfileLoading from "./_components/ProfileLoading";
import ProfileScreen from "./_components/ProfileScreen";
import { useMyProfile } from "@/app/hooks/use-profile";

export default function ProfilePage() {
  const profileQuery = useMyProfile();

  if (profileQuery.isPending) {
    return <ProfileLoading />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ProfileError onRetry={() => void profileQuery.refetch()} />;
  }

  return <ProfileScreen profile={profileQuery.data} />;
}

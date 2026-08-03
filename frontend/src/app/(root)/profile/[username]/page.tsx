"use client";

import ProfileError from "../_components/ProfileError";
import ProfileLoading from "../_components/ProfileLoading";
import ProfileScreen from "../_components/ProfileScreen";
import { useParams } from "next/navigation";
import { useProfileByUsername } from "@/app/hooks/use-profile";

export default function PublicProfilePage() {
  const params = useParams<{ username?: string | string[] }>();
  const username = Array.isArray(params.username)
    ? (params.username[0] ?? "")
    : (params.username ?? "");

  const profileQuery = useProfileByUsername(username);

  if (profileQuery.isPending) {
    return <ProfileLoading />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <ProfileError onRetry={() => void profileQuery.refetch()} />;
  }

  return <ProfileScreen profile={profileQuery.data} />;
}

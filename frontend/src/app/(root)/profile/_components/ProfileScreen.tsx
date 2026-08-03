"use client";

import AboutMe from "./AboutMe";
import ActivitySidebar from "./ActivitySidebar";
import EditProfileDialog from "./EditProfileDialog";
import ProfileMedia from "./ProfileMedia";
import ProfileOverview from "./ProfileOverview";
import { ProfileScreenData } from "../types";
import ProfileTaskBar from "./ProfileTaskBar";
import RecentPosts from "./RecentPosts";
import { useState } from "react";

interface ProfileScreenProps {
  profile: ProfileScreenData;
}

export default function ProfileScreen({ profile }: ProfileScreenProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <section className="h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#f8f7fc] text-slate-950 dark:bg-customBlack dark:text-white">
        <ProfileTaskBar user={profile.user} />

        <div className="grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_350px]">
          <main className="min-w-0 space-y-5">
            <ProfileOverview
              profile={profile}
              onEdit={() => setEditOpen(true)}
            />

            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,0.88fr)_minmax(0,1.35fr)]">
              <AboutMe user={profile.user} />
              <ProfileMedia media={profile.media} />
            </div>

            <RecentPosts user={profile.user} posts={profile.posts} />
          </main>

          <div className="min-w-0 xl:sticky xl:top-[88px] xl:self-start">
            <ActivitySidebar profile={profile} />
          </div>
        </div>
      </section>

      {profile.isOwnProfile ? (
        <EditProfileDialog
          open={editOpen}
          profile={profile}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </>
  );
}

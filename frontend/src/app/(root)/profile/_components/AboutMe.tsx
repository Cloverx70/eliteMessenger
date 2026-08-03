import { CalendarDays, Mail, UserRound } from "lucide-react";

import { ProfileUser } from "../types";
import SectionCard from "./SectionCard";

interface AboutMeProps {
  user: ProfileUser;
}

export default function AboutMe({ user }: AboutMeProps) {
  const joinedDate = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(user.createdAt));

  return (
    <SectionCard title="About me" className="h-full">
      <div className="space-y-5 px-5 pb-5">
        <AboutRow
          icon={UserRound}
          title={`${user.firstname} ${user.lastname}`}
          description={`@${user.username}`}
        />

        {user.email ? (
          <AboutRow
            icon={Mail}
            title={user.email}
            description="Private account email"
          />
        ) : null}

        <AboutRow
          icon={CalendarDays}
          title={`Joined ${joinedDate}`}
          description="Member of the Elite community"
        />
      </div>
    </SectionCard>
  );
}

interface AboutRowProps {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  title: string;
  description: string;
}

function AboutRow({ icon: Icon, title, description }: AboutRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
        <Icon size={18} />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block text-xs text-slate-400">{description}</span>
      </span>
    </div>
  );
}

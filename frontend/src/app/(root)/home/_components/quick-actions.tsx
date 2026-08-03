import Link from 'next/link';
import {
  Compass,
  ImageIcon,
  MessageCircle,
  PencilLine,
  UserPlus,
  UsersRound,
} from 'lucide-react';

import { homeIntegrationRoutes } from '../integration-routes';

const actions = [
  {
    label: 'New message',
    description: 'Start a conversation',
    href: homeIntegrationRoutes.pages.chats,
    icon: MessageCircle,
    className: 'bg-[#f2ecff] text-[#6e35ec]',
  },
  {
    label: 'Create group',
    description: 'Bring people together',
    href: homeIntegrationRoutes.pages.groups,
    icon: UsersRound,
    className: 'bg-[#eaf4ff] text-[#3181d7]',
  },
  {
    label: 'Add friend',
    description: 'Find someone new',
    href: homeIntegrationRoutes.pages.friends,
    icon: UserPlus,
    className: 'bg-[#eaf9f1] text-[#24a46d]',
  },
  {
    label: 'Create post',
    description: 'Share with your circle',
    href: homeIntegrationRoutes.pages.discover,
    icon: PencilLine,
    className: 'bg-[#fff1e8] text-[#e87935]',
  },
  {
    label: 'Discover',
    description: 'Explore new posts',
    href: homeIntegrationRoutes.pages.discover,
    icon: Compass,
    className: 'bg-[#fff0f6] text-[#db4b87]',
  },
  {
    label: 'Media',
    description: 'Open shared files',
    href: homeIntegrationRoutes.pages.media,
    icon: ImageIcon,
    className: 'bg-[#eef1ff] text-[#5c6de7]',
  },
] as const;

export default function QuickActions() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#17132f]">
            Quick actions
          </h2>
          <p className="mt-1 text-xs text-[#827b9d]">
            Jump directly into the parts you use most.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-[22px] border border-[#ece8f4] bg-white p-4 shadow-[0_14px_38px_rgba(55,35,104,0.055)] transition duration-200 hover:-translate-y-1 hover:border-[#d8ccf5] hover:shadow-[0_18px_46px_rgba(81,46,156,0.11)]"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.className}`}
              >
                <Icon size={20} />
              </span>
              <p className="mt-4 text-sm font-bold text-[#211b3a]">
                {action.label}
              </p>
              <p className="mt-1 line-clamp-1 text-[11px] text-[#8c85a1]">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

import { EmptyState, ErrorState, SectionSkeleton } from "./section-state";
import { MessageCircle, UsersRound } from "lucide-react";

import Avatar from "./avatar";
import type { HomeConversation } from "../types";
import Link from "next/link";
import SectionCard from "./section-card";
import { formatRelativeTime } from "../utils";
import { homeIntegrationRoutes } from "../integration-routes";

interface ContinueConversationsProps {
  conversations: HomeConversation[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export default function ContinueConversations({
  conversations,
  isLoading,
  isError,
  onRetry,
}: ContinueConversationsProps) {
  return (
    <SectionCard
      title="Continue conversations"
      description="Your most recent direct chats and groups in one place."
      actionLabel="View all"
      actionHref={homeIntegrationRoutes.pages.chats}
    >
      {isLoading ? <SectionSkeleton rows={4} /> : null}

      {!isLoading && isError ? <ErrorState onRetry={onRetry} /> : null}

      {!isLoading && !isError && conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start a new chat or create a group and it will appear here."
        />
      ) : null}

      {!isLoading && !isError && conversations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6 xl:grid-cols-2 2xl:grid-cols-4">
          {conversations.slice(0, 4).map((conversation) => (
            <Link
              key={`${conversation.kind}-${conversation.id}`}
              href={conversation.href}
              className="group relative min-w-0 rounded-[20px] border border-[#eeeaf5] bg-[#fcfbfe] p-4 transition hover:-translate-y-0.5 hover:border-[#d8cdf2] hover:bg-white hover:shadow-[0_14px_35px_rgba(62,39,117,0.08)]"
            >
              <div className="flex items-start gap-3">
                {conversation.avatarUrl ? (
                  <Avatar
                    src={conversation.avatarUrl}
                    name={conversation.name}
                    size="md"
                    online={conversation.isActive}
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eee7ff] text-[#7140e8]">
                    {conversation.kind === "group" ? (
                      <UsersRound size={19} />
                    ) : (
                      <MessageCircle size={19} />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[#251f3e]">
                      {conversation.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-[#9891aa]">
                      {formatRelativeTime(conversation.lastMessageDate)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-[#817a96]">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-[#f1edf9] px-2 py-1 text-[10px] font-semibold capitalize text-[#7a7191]">
                  {conversation.kind}
                </span>

                {conversation.unreadCount > 0 ? (
                  <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#6d36ed] px-1.5 text-[10px] font-bold text-white">
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#9d96af] transition group-hover:text-[#6d36ed]">
                    Open
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

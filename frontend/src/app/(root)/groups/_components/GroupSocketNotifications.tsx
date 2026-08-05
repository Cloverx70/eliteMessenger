"use client";

import { IGroupMessage } from "../group-action";
import { IUser } from "@/app/auth/actions";
import { useChatStore } from "@/app/stores/ChatStore";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketContext } from "@/app/providers/SocketProvider";

type GroupSocketNotificationsProps = {
  user: IUser;
};

const GroupSocketNotifications = ({ user }: GroupSocketNotificationsProps) => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const incrementGroupUnread = useChatStore(
    (state) => state.incrementGroupUnread,
  );

  const { onGroupNotification, offGroupNotification } = useSocketContext();

  useEffect(() => {
    const handleNotification = (message: IGroupMessage) => {
      const currentGroupPath = `/groups/${message.groupId}`;

      if (pathname !== currentGroupPath) {
        incrementGroupUnread(message.groupId);
      }

      queryClient.invalidateQueries({ queryKey: ["GROUPS"] });
    };

    onGroupNotification(handleNotification);

    return () => {
      offGroupNotification(handleNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user.id]);

  return null;
};

export default GroupSocketNotifications;

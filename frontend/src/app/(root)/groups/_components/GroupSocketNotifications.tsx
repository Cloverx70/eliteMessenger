"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { IUser } from "@/app/auth/actions";
import { useChatStore } from "@/app/stores/ChatStore";
import { useSocket } from "@/app/hooks/useSocket";

import { IGroupMessage } from "../group-action";

type GroupSocketNotificationsProps = {
  user: IUser;
};

const GroupSocketNotifications = ({
  user,
}: GroupSocketNotificationsProps) => {
  const pathname = usePathname();
  const queryClient =
    useQueryClient();

  const incrementGroupUnread =
    useChatStore(
      (state) =>
        state.incrementGroupUnread,
    );

  const {
    onGroupNotification,
    offGroupNotification,
  } = useSocket(user.id);

  useEffect(() => {
    const handleNotification = (
      message: IGroupMessage,
    ) => {
      const currentGroupPath =
        `/groups/${message.groupId}`;

      if (
        pathname !==
        currentGroupPath
      ) {
        incrementGroupUnread(
          message.groupId,
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["GROUPS"],
      });
    };

    onGroupNotification(
      handleNotification,
    );

    return () => {
      offGroupNotification(
        handleNotification,
      );
    };
  }, [
    pathname,
    queryClient,
    incrementGroupUnread,
    onGroupNotification,
    offGroupNotification,
  ]);

  return null;
};

export default GroupSocketNotifications;

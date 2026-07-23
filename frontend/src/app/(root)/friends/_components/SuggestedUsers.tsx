"use client";

import {
  CancelOngoingRequest,
  GetSuggestedUsers,
  SendFriendRequest,
} from "../action";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Loader from "@/app/components/loader";
import UserCard from "./userCard";
import toaster from "@/app/components/toaster";

const SuggestedUsers = () => {
  const queryClient = useQueryClient();

  const [pendingId, setPendingId] = useState<string>();
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: suggestedUsers, isPending: suggestedUsersPending } = useQuery({
    queryKey: ["SUGGESTEDUSERS"],
    queryFn: GetSuggestedUsers,
  });

  const { mutate: sendRequest, isPending: sendRequestPending } = useMutation({
    mutationKey: ["SENDREQUEST"],

    mutationFn: (receiverId: string) => SendFriendRequest(receiverId),

    onSuccess: (_, receiverId) => {
      setPendingId(undefined);

      setSentRequests((previous) => {
        const updated = new Set(previous);
        updated.add(receiverId);
        return updated;
      });

      toaster("Success", "Friend request sent successfully");

      queryClient.invalidateQueries({
        queryKey: ["ONGOINGREQUESTS"],
      });

      queryClient.invalidateQueries({
        queryKey: ["SUGGESTEDUSERS"],
      });
    },

    onError: (error: Error) => {
      setPendingId(undefined);
      toaster("Error", error.message);
    },
  });

  const { mutate: cancelRequest, isPending: cancelRequestPending } =
    useMutation({
      mutationKey: ["CANCELPENDINGREQUEST"],

      mutationFn: (receiverId: string) => CancelOngoingRequest(receiverId),

      onSuccess: (_, receiverId) => {
        setPendingId(undefined);

        setSentRequests((previous) => {
          const updated = new Set(previous);
          updated.delete(receiverId);
          return updated;
        });

        toaster("Success", "Friend request cancelled successfully");

        queryClient.invalidateQueries({
          queryKey: ["ONGOINGREQUESTS"],
        });
      },

      onError: (error: Error) => {
        setPendingId(undefined);
        toaster("Error", error.message);
      },
    });

  const handleAdd = (userId: string) => {
    setPendingId(userId);
    sendRequest(userId);
  };

  const handleCancel = (userId: string) => {
    setPendingId(userId);
    cancelRequest(userId);
  };

  if (suggestedUsersPending) {
    return <Loader />;
  }

  if (!suggestedUsers?.length) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-neutral-400">
          No suggested users available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start justify-start">
      {suggestedUsers.map((user) => {
        const isThisUserPending =
          pendingId === user.id && (sendRequestPending || cancelRequestPending);

        return (
          <UserCard
            key={user.id}
            user={user}
            requestSent={sentRequests.has(user.id)}
            isPending={isThisUserPending}
            onAdd={handleAdd}
            onCancel={handleCancel}
          />
        );
      })}
    </div>
  );
};

export default SuggestedUsers;

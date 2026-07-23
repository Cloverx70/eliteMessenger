"use client";

import {
  CancelOngoingRequest,
  DeclineOngoingRequest,
  GetOngoingRequests,
  GetReceivedRequests,
  ManageRequest,
} from "../action";
import { Check, UserMinus, X } from "lucide-react";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Image from "next/image";
import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";

const FriendRequestsPanel = () => {
  const queryClient = useQueryClient();

  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: receivedRequestsResponse, isLoading: receivedLoading } =
    useQuery({
      queryKey: ["RECEIVEDREQUESTS"],
      queryFn: GetReceivedRequests,
    });

  const { data: ongoingRequests = [], isLoading: ongoingLoading } = useQuery({
    queryKey: ["ONGOINGREQUESTS"],
    queryFn: GetOngoingRequests,
  });

  const receivedRequests = receivedRequestsResponse?.data ?? [];

  const refreshFriendQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["RECEIVEDREQUESTS"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ONGOINGREQUESTS"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["PEOPLEYOUMAYKNOW"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["YOURFRIENDS"],
      }),
    ]);
  };

  const { mutate: acceptRequest, isPending: acceptPending } = useMutation({
    mutationKey: ["ACCEPTRECEIVEDREQUEST"],

    mutationFn: (recId: string) => ManageRequest(recId, "accepted"),

    onSuccess: async () => {
      setPendingId(null);
      await refreshFriendQueries();
      toaster("Success", "Friend request accepted");
    },

    onError: (error: Error) => {
      setPendingId(null);
      toaster("Error", error.message);
    },
  });

  const { mutate: declineRequest, isPending: declinePending } = useMutation({
    mutationKey: ["DECLINEREQUEST"],

    mutationFn: (recId: string) => DeclineOngoingRequest(recId),

    onSuccess: async () => {
      setPendingId(null);
      await refreshFriendQueries();
      toaster("Success", "Friend request declined");
    },

    onError: (error: Error) => {
      setPendingId(null);
      toaster("Error", error.message);
    },
  });

  const { mutate: cancelRequest, isPending: cancelPending } = useMutation({
    mutationKey: ["CANCELPENDINGREQUEST"],

    mutationFn: (recId: string) => CancelOngoingRequest(recId),

    onSuccess: async () => {
      setPendingId(null);
      await refreshFriendQueries();
      toaster("Success", "Friend request cancelled");
    },

    onError: (error: Error) => {
      setPendingId(null);
      toaster("Error", error.message);
    },
  });

  const handleAccept = (recId: string) => {
    setPendingId(recId);
    acceptRequest(recId);
  };

  const handleDecline = (recId: string) => {
    setPendingId(recId);
    declineRequest(recId);
  };

  const handleCancel = (recId: string) => {
    setPendingId(recId);
    cancelRequest(recId);
  };

  const isLoading = receivedLoading || ongoingLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Received requests */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-customBlack dark:text-white">
              Received requests
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              People who would like to connect with you.
            </p>
          </div>

          <span className="rounded-full bg-elitePurple/10 px-3 py-1 text-xs font-semibold text-elitePurple">
            {receivedRequests.length}
          </span>
        </div>

        {receivedRequests.length > 0 ? (
          <div className="flex flex-col gap-3">
            {receivedRequests.map((request, index) => {
              const requestId = request.requestId;
              const requestIsPending = pendingId === requestId;

              const initials = `${request.firstname?.[0] ?? ""}${
                request.lastname?.[0] ?? ""
              }`.toUpperCase();
              return (
                <article
                  key={requestId ?? index}
                  className="flex min-h-24 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-customBlack"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-[2.5px] ring-elitePurple dark:bg-neutral-700">
                      {request.userPfpUrl ? (
                        <Image
                          src={request.userPfpUrl}
                          alt={`${request.username}'s profile picture`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                          {initials || "U"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-customBlack dark:text-white">
                        {request.firstname} {request.lastname}
                      </h3>

                      <p className="truncate text-xs text-slate-500">
                        @{request.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={requestIsPending}
                      onClick={() => handleDecline(request.id)}
                      className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {requestIsPending && declinePending ? (
                        <Spinner />
                      ) : (
                        <>
                          <X size={15} />
                          Decline
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={requestIsPending}
                      onClick={() => handleAccept(request.id)}
                      className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-xl bg-elitePurple px-4 text-xs font-semibold text-white transition-transform hover:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestIsPending && acceptPending ? (
                        <Spinner />
                      ) : (
                        <>
                          <Check size={15} />
                          Accept
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No received friend requests." />
        )}
      </section>

      {/* Sent requests */}
      <section className="flex flex-col gap-4 border-t border-slate-200 pt-7 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-customBlack dark:text-white">
              Sent requests
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Requests waiting for the other user.
            </p>
          </div>

          <span className="rounded-full bg-elitePurple/10 px-3 py-1 text-xs font-semibold text-elitePurple">
            {ongoingRequests.length}
          </span>
        </div>

        {ongoingRequests.length > 0 ? (
          <div className="flex flex-col gap-3">
            {ongoingRequests.map((request, index) => {
              const requestId = request.requestId;
              const requestIsPending = pendingId === requestId;

              const initials = `${request.firstname?.[0] ?? ""}${
                request.lastname?.[0] ?? ""
              }`.toUpperCase();
              return (
                <article
                  key={requestId ?? index}
                  className="flex min-h-24 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-customBlack"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-[2.5px] ring-elitePurple dark:bg-neutral-700">
                      {request.userPfpUrl ? (
                        <Image
                          src={request.userPfpUrl}
                          alt={`${request.username}'s profile picture`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">
                          {initials || "U"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-customBlack dark:text-white">
                        {request.firstname} {request.lastname}
                      </h3>

                      <p className="truncate text-xs text-slate-500">
                        @{request.username}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={requestIsPending}
                    onClick={() => handleCancel(request.id)}
                    className="flex h-9 min-w-28 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:hover:bg-red-500/10"
                  >
                    {requestIsPending && cancelPending ? (
                      <Spinner />
                    ) : (
                      <>
                        <UserMinus size={15} />
                        Cancel
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No pending sent requests." />
        )}
      </section>
    </div>
  );
};

export default FriendRequestsPanel;

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 dark:border-slate-700 dark:bg-transparent">
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
};

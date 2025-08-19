"use client";
import Pill from "@/app/components/pill";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CancelOngoingRequest,
  DeclineOngoingRequest,
  GetOngoingRequests,
  GetReceivedRequests,
  GetYourFriends,
  ManageRequest,
} from "../action";
import Image from "next/image";
import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";
import { IoMdArrowDropup, IoMdArrowDropdown } from "react-icons/io";
import { motion } from "framer-motion";

const UserNavigation = () => {
  type pillT = "yourfriends" | "requests";

  const client = useQueryClient();

  const [pillSelected, setpillSelected] = useState<pillT | undefined>(
    undefined
  );

  const [RequestState, setRequestState] = useState({
    ongoing: false,
    received: true,
    yourfriends: true,
  });

  const [PendingId, setPendingId] = useState<string | undefined>();
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: yourFriends } = useQuery({
    // your friends pill data
    queryKey: ["YOURFRIENDS"],
    queryFn: GetYourFriends,
    enabled: pillSelected === "yourfriends",
  });

  const { data: receivedRequests } = useQuery({
    // received requests pill data
    queryKey: ["RECEIVEDREQUESTS"],
    queryFn: GetReceivedRequests,
    enabled: pillSelected === "requests",
  });

  const { data: ongoingRequests } = useQuery({
    // ongoing requests pill data
    queryKey: ["ONGOINGREQUESTS"],
    queryFn: GetOngoingRequests,
    enabled: pillSelected === "requests",
  });

  const { mutate: declineRequestMutate, isPending: declineRequestPending } =
    useMutation({
      mutationKey: ["DECLINEREQUEST"],
      mutationFn: (rid: string) => DeclineOngoingRequest(rid),
      onSuccess: (_, rid) => {
        setPendingId(undefined);
        setSentRequests((prev) => new Set(prev).add(rid));
        client.invalidateQueries({ queryKey: ["PEOPLEYOUMAYKNOW"] });
        toaster("Success", "Declined request successfully");
      },
      onError: (e) => {
        setPendingId(undefined);
        toaster("Error", e.message);
      },
    });

  const { mutate: cancelRequestMutate, isPending: cancelRequestPending } =
    useMutation({
      mutationKey: ["CANCELPENDINGREQUEST"],
      mutationFn: (rid: string) => CancelOngoingRequest(rid),
      onSuccess: (_, rid) => {
        setPendingId(undefined);
        setSentRequests((prev) => {
          const updated = new Set(prev);
          updated.delete(rid);
          return updated;
        });
        client.invalidateQueries({ queryKey: ["ONGOINGREQUESTS"] });
        client.invalidateQueries({ queryKey: ["PEOPLEYOUMAYKNOW"] });

        toaster("Success", "Request cancelled successfully");
      },
      onError: (e) => {
        toaster("Error", e.message);
      },
    });

  const { mutate: AcceptRequestMutate, isPending: AcceptRequestPending } =
    useMutation({
      mutationKey: ["ACCEPTRECEIVEDREQUEST"],
      mutationFn: (data: {
        requestId: string;
        status: "ongoing" | "accepted" | "declined";
      }) => ManageRequest(data.requestId, data.status),
      onSuccess: (_, data) => {
        setPendingId(undefined);
        setSentRequests((prev) => {
          const updated = new Set(prev);
          updated.delete(data.requestId);
          return updated;
        });

        client.invalidateQueries({ queryKey: ["PEOPLEYOUMAYKNOW"] });
        client.invalidateQueries({ queryKey: ["RECEIVEDREQUESTS"] });

        toaster("Success", "Request Accepted successfully");
      },
      onError: (e) => {
        toaster("Error", e.message);
      },
    });

  const handleOnClickCancel = (rid: string) => {
    setPendingId(rid);
    cancelRequestMutate(rid);
  };

  const handleOnClickDecline = (rid: string) => {
    setPendingId(rid);
    declineRequestMutate(rid);
  };

  const handleOnClickAccept = (requestId: string) => {
    setPendingId(requestId);
    AcceptRequestMutate({ requestId, status: "accepted" });
  };

  return (
    <div className="w-full flex gap-4 items-center justify-start">
      {/* Dialog for Your Friends */}
      <Dialog onOpenChange={() => setpillSelected("yourfriends")}>
        <DialogTrigger asChild>
          <button>
            <Pill text="your friends" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <motion.div
            layout
            transition={{ duration: 0.05, ease: "easeIn" }}
            className="w-full overflow-y-auto"
          >
            <DialogHeader className=" w-full ">
              <DialogTitle className="mb-5 ">Friends</DialogTitle>

              <div
                onClick={() =>
                  setRequestState({
                    ...RequestState,
                    yourfriends: !RequestState.yourfriends,
                  })
                }
                className=" w-full h-auto cursor-pointer flex items-start justify-between px-3 bg-neutral-100 dark:bg-customBlack"
              >
                <h1 className="text-sm">Your friends</h1>
                {RequestState.yourfriends ? (
                  <IoMdArrowDropup size={20} />
                ) : (
                  <IoMdArrowDropdown size={20} />
                )}
              </div>

              {RequestState.yourfriends &&
                (yourFriends && yourFriends.length > 0 ? (
                  yourFriends?.map((rof, _index) => {
                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: "linear" }}
                        key={rof.requestId ?? _index}
                        className="w-full h-16 border-b flex items-center justify-between px-5 "
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full ring-[2.5px] ring-customOlive ">
                            <Image
                              src={rof.userPfpUrl}
                              alt="pfp"
                              className="w-full h-full rounded-full"
                              width={45}
                              height={45}
                            />
                          </div>
                          <div>
                            <h1 className=" text-sm">{rof.username}</h1>
                            <p className="text-xs text-neutral-400">
                              {rof.firstname + " " + rof.lastname}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-xs text-center">No friends yet..</p>
                ))}
            </DialogHeader>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Received Requests */}
      <Dialog onOpenChange={() => setpillSelected("requests")}>
        <DialogTrigger asChild>
          <button>
            <Pill text="requests" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <motion.div
            layout
            transition={{ duration: 0.05, ease: "easeIn" }}
            className="w-full overflow-y-auto"
          >
            <DialogHeader className=" w-full">
              <DialogTitle className=" mb-5">Requests</DialogTitle>

              <div
                onClick={() =>
                  setRequestState({
                    ...RequestState,
                    ongoing: !RequestState.ongoing,
                  })
                }
                className=" w-full h-auto cursor-pointer flex items-start justify-between px-3 bg-neutral-100 dark:bg-customBlack"
              >
                <h1 className="text-sm">Ongoing Requests</h1>
                {RequestState.ongoing ? (
                  <IoMdArrowDropup size={20} />
                ) : (
                  <IoMdArrowDropdown size={20} />
                )}
              </div>

              {RequestState.ongoing &&
                (ongoingRequests && ongoingRequests.length > 0 ? (
                  ongoingRequests?.map((rof, _index) => {
                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: "linear" }}
                        key={rof.requestId ?? _index}
                        className="w-full h-24 border-b flex items-center justify-between py-2 px-10"
                      >
                        <div className="w-full flex gap-4 ">
                          <div className="w-12 h-12 rounded-full ring-[2.5px] ring-customOlive">
                            <Image
                              src={rof.userPfpUrl}
                              alt="pfp"
                              className="w-full h-full rounded-full"
                              width={45}
                              height={45}
                            />
                          </div>
                          <div>
                            <h1 className="text-sm">{rof.username}</h1>
                            <p className="text-xs text-neutral-400">
                              {rof.firstname + " " + rof.lastname}
                            </p>
                          </div>
                          <div className=" flex-1 flex items-center justify-end">
                            {!sentRequests.has(rof.requestId) ? (
                              <button
                                onClick={() => handleOnClickCancel(rof.id)}
                                disabled={
                                  rof.requestId === PendingId &&
                                  cancelRequestPending
                                }
                                className="text-xs py-1 px-10 disabled:bg-red-800 active:bg-red-800 text-white rounded-sm bg-red-500"
                              >
                                {rof.requestId === PendingId &&
                                cancelRequestPending ? (
                                  <Spinner />
                                ) : (
                                  "Cancel"
                                )}
                              </button>
                            ) : (
                              <p>cancelled</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className=" text-xs text-center">No ongoing requests..</p>
                ))}

              <div
                onClick={() =>
                  setRequestState({
                    ...RequestState,
                    received: !RequestState.received,
                  })
                }
                className=" w-full h-auto cursor-pointer flex items-start justify-between px-3 bg-neutral-100 dark:bg-customBlack"
              >
                <h1 className="text-sm">Received Requests</h1>
                {RequestState.received ? (
                  <IoMdArrowDropup size={20} />
                ) : (
                  <IoMdArrowDropdown size={20} />
                )}
              </div>
              {RequestState.received &&
                (receivedRequests?.data && receivedRequests.data?.length > 0 ? (
                  receivedRequests?.data.map((rof, _index) => {
                    return (
                      <div
                        key={rof.requestId ?? _index}
                        className="w-full h-24 border-t flex items-center justify-between py-2 px-10"
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full ring-[2.5px] ring-customOlive">
                            <Image
                              src={rof.userPfpUrl}
                              alt="pfp"
                              className="w-full h-full rounded-full"
                              width={45}
                              height={45}
                            />
                          </div>
                          <div>
                            <h1 className="text-base">{rof.username}</h1>
                            <p className="text-xs text-neutral-400">
                              {rof.firstname + " " + rof.lastname}
                            </p>
                          </div>
                        </div>
                        {!sentRequests.has(rof.requestId) ? (
                          <div className=" flex flex-col gap-2 items-center ">
                            <button
                              disabled={
                                rof.requestId === PendingId &&
                                declineRequestPending
                              }
                              className="text-xs py-1 px-10 disabled:bg-red-800 active:bg-red-800 text-white rounded-sm bg-red-500"
                            >
                              {rof.requestId === PendingId &&
                              declineRequestPending ? (
                                <Spinner />
                              ) : (
                                "Decline"
                              )}
                            </button>
                            <button
                              onClick={() => handleOnClickAccept(rof.requestId)}
                              disabled={
                                rof.id === PendingId && AcceptRequestPending
                              }
                              className="text-xs py-1 px-10 disabled:bg-customDarkOlive active:bg-customDarkOlive text-white rounded-sm bg-customOlive"
                            >
                              {rof.id === PendingId && AcceptRequestPending ? (
                                <Spinner />
                              ) : (
                                "Accept"
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOnClickDecline(rof.requestId)}
                            disabled={
                              rof.id === PendingId && cancelRequestPending
                            }
                            className="text-xs py-1 px-10 disabled:bg-neutral-600 active:bg-neutral-600 text-white rounded-sm bg-neutral-500"
                          >
                            {rof.id === PendingId && cancelRequestPending ? (
                              <Spinner />
                            ) : (
                              "Undo"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className=" text-xs text-center">No received requests..</p>
                ))}
            </DialogHeader>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserNavigation;

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  CancelOngoingRequest,
  GetPeopleYouMayKnow,
  SendFriendRequest,
} from "../action";
import Image from "next/image";
import Loader from "@/app/components/loader";
import toaster from "@/app/components/toaster";
import Spinner from "@/app/components/spinner";

const PeopleYouMayKnow = () => {
  const client = useQueryClient();

  const [PendingId, setPendingId] = useState<string | undefined>();
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: PeopleYouMayKnow, isPending: getDataPending } = useQuery({
    queryKey: ["PEOPLEYOUMAYKNOW"],
    queryFn: GetPeopleYouMayKnow,
  });

  const { mutate: sendRequestMutate, isPending: sendRequestPending } =
    useMutation({
      mutationKey: ["SENDREQUEST"],
      mutationFn: (rid: string) => SendFriendRequest(rid),
      onSuccess: (_, rid) => {
        setPendingId(undefined);
        setSentRequests((prev) => new Set(prev).add(rid));
        toaster("Success", "Sent request successfully");

        client.invalidateQueries({ queryKey: ["ONGOINGREQUESTS"] });
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
        toaster("Success", "Request cancelled successfully");
      },
      onError: (e) => {
        toaster("Error", e.message);
      },
    });

  const handleOnClickAdd = (rid: string) => {
    setPendingId(rid);
    sendRequestMutate(rid);
  };

  const handleOnClickCancel = (rid: string) => {
    setPendingId(rid);
    cancelRequestMutate(rid);
  };

  if (getDataPending) return <Loader />;

  if (PeopleYouMayKnow && PeopleYouMayKnow.length === 0)
    return (
      <div className=" w-full h-full flex items-center justify-center ">
        <p>Start adding friends to get suggestions...</p>
      </div>
    );

  return (
    <div className="w-full flex flex-col items-start justify-start ">
      {PeopleYouMayKnow?.map((pymn, _index) => {
        return (
          <div
            key={pymn.id ?? _index}
            className=" w-full h-24 border-t flex items-center justify-between py-2 px-10 "
          >
            <div className=" flex gap-4">
              <div className="w-12 h-12 rounded-full ring-[2.5px] ring-customOlive ">
                <Image
                  src={pymn.userPfpUrl}
                  alt="pfp"
                  className=" w-full h-full rounded-full"
                  width={45}
                  height={45}
                />
              </div>
              <div>
                <h1 className=" text-base">{pymn.username}</h1>
                <p className=" text-xs text-neutral-400">
                  {pymn.firstname + " " + pymn.lastname}
                </p>
              </div>
            </div>
            {!sentRequests.has(pymn.id) ? (
              <button
                onClick={() => handleOnClickAdd(pymn.id)}
                disabled={pymn.id === PendingId && sendRequestPending}
                className=" text-xs py-1 px-10 disabled:bg-customDarkOlive active:bg-customDarkOlive text-white rounded-sm bg-customOlive"
              >
                {pymn.id === PendingId && sendRequestPending ? (
                  <Spinner />
                ) : (
                  "Add"
                )}
              </button>
            ) : (
              <button
                onClick={() => handleOnClickCancel(pymn.id)}
                disabled={pymn.id === PendingId && cancelRequestPending}
                className=" text-xs py-1 px-10 disabled:bg-neutral-600 active:bg-neutral-600 text-white rounded-sm bg-neutral-500"
              >
                {pymn.id === PendingId && cancelRequestPending ? (
                  <Spinner />
                ) : (
                  "Cancel"
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PeopleYouMayKnow;

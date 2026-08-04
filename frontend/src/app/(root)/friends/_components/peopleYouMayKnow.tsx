"use client";

import {
  CancelOngoingRequest,
  GetPeopleYouMayKnow,
  SendFriendRequest,
} from "../action";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Image from "next/image";
import Link from "next/link";
import Loader from "@/app/components/loader";
import Spinner from "@/app/components/spinner";
import toaster from "@/app/components/toaster";
import { useDebounce } from "@/app/constants";

interface IPeopleYouMayKnowProps {
  query?: string;
}

const PeopleYouMayKnow = ({ query }: IPeopleYouMayKnowProps) => {
  const client = useQueryClient();
  const debouncedValue = useDebounce(query, 300);

  const [PendingId, setPendingId] = useState<string | undefined>();
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: PeopleYouMayKnow, isPending: getDataPending } = useQuery({
    queryKey: ["PEOPLEYOUMAYKNOW", debouncedValue],
    queryFn: () => GetPeopleYouMayKnow(debouncedValue),
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
        const initials = `${pymn.firstname?.[0] ?? ""}${
          pymn.lastname?.[0] ?? ""
        }`.toUpperCase();

        return (
          <Link
            href={`/profile/${pymn.username}`}
            key={pymn.id ?? _index}
            className=" w-full h-24 border-t flex items-center justify-between py-2 px-10  hover:bg-elitePurpleHover/10 transition-all duration-100 ease-linear rounded-2xl cursor-pointer"
          >
            <div className=" flex gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 ring-[2.5px] ring-elitePurple dark:bg-neutral-700">
                {pymn.userPfpUrl ? (
                  <Image
                    src={pymn.userPfpUrl}
                    alt={`${pymn.username}'s profile picture`}
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
              <div>
                <h1 className=" text-base">{pymn.username}</h1>
                <p className=" text-xs text-neutral-400">
                  {pymn.firstname + " " + pymn.lastname}
                </p>
              </div>
            </div>
            {!sentRequests.has(pymn.id) ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOnClickAdd(pymn.id);
                }}
                disabled={pymn.id === PendingId && sendRequestPending}
                className=" text-xs py-2 px-10 disabled:bg-elitePurplePressed active:bg-elitePurplePressed font-bold text-white rounded-sm bg-elitePurple"
              >
                {pymn.id === PendingId && sendRequestPending ? (
                  <Spinner />
                ) : (
                  "Add"
                )}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOnClickCancel(pymn.id);
                }}
                disabled={pymn.id === PendingId && cancelRequestPending}
                className=" text-xs py-2 px-10 disabled:bg-neutral-600 active:bg-neutral-600 font-bold text-white rounded-sm bg-neutral-500"
              >
                {pymn.id === PendingId && cancelRequestPending ? (
                  <Spinner />
                ) : (
                  "Cancel"
                )}
              </button>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default PeopleYouMayKnow;

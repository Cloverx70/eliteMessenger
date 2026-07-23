"use client";

import { BsPeople, BsPeopleFill } from "react-icons/bs";
import { HiMiniRectangleGroup, HiOutlineRectangleGroup } from "react-icons/hi2";
import { IoChatboxEllipses, IoChatboxEllipsesOutline } from "react-icons/io5";
import { IoIosNotifications, IoIosNotificationsOutline } from "react-icons/io";
import { MdOutlinePermMedia, MdPermMedia } from "react-icons/md";
import { RiCompass3Fill, RiCompass3Line } from "react-icons/ri";
import { useEffect, useState } from "react";

import { BiDotsHorizontalRounded } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";
import { GoPerson } from "react-icons/go";
import { PiBellSimpleLight } from "react-icons/pi";
import axios from "axios";

export const Links = [
  {
    label: "Discover",
    headerLabel: "Discover",
    icon: RiCompass3Line,
    filledIcon: RiCompass3Fill,
    href: "/discover",
  },
  {
    label: "Chats",
    headerLabel: "Chats",
    icon: IoChatboxEllipsesOutline,
    filledIcon: IoChatboxEllipses,
    href: "/chats",
  },
  {
    label: "Groups",
    headerLabel: "Groups",
    icon: HiOutlineRectangleGroup,
    filledIcon: HiMiniRectangleGroup,
    href: "/groups",
  },
  {
    label: "Notifications",
    headerLabel: "Notifications",

    icon: IoIosNotificationsOutline,
    filledIcon: IoIosNotifications,
    href: "/notifications",
  },
  {
    label: "Friends",
    headerLabel: "Friends",

    icon: BsPeople,
    filledIcon: BsPeopleFill,
    href: "/friends",
  },
  {
    label: "Media",
    headerLabel: "Media Library",
    icon: MdOutlinePermMedia,
    filledIcon: MdPermMedia,
    href: "/media",
  },
];

export const FilterPillsLabels = [
  {
    label: "All",
    default: true,
  },
  { label: "Unread" },
];

export const ChatroomProfileLinks = [
  {
    label: "Profile",
    icon: GoPerson,
  },
  { label: "Search", icon: CiSearch },

  { label: "Mute", icon: PiBellSimpleLight },

  { label: "More", icon: BiDotsHorizontalRounded },
];

export function handleError(error: unknown) {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.message || "Something went wrong");
  } else if (error instanceof Error) throw new Error("Something went wrong");
}

export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function getAgoTiming(sentDate?: Date | string | null): string {
  if (!sentDate) return "";

  const date = new Date(sentDate);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / 1000 / 60);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function get12hrTiming(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  return date
    .toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

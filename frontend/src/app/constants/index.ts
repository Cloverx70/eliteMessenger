"use client";
import { IoChatboxEllipses, IoChatboxEllipsesOutline } from "react-icons/io5";
import { BsPeople, BsPeopleFill } from "react-icons/bs";
import { RiCompass3Line, RiCompass3Fill } from "react-icons/ri";
import { HiOutlineRectangleGroup, HiMiniRectangleGroup } from "react-icons/hi2";
import { MdOutlinePermMedia, MdPermMedia } from "react-icons/md";
import { IoIosNotificationsOutline, IoIosNotifications } from "react-icons/io";
import axios from "axios";
import { useEffect, useState } from "react";

export const Links = [
  {
    label: "Discover",
    icon: RiCompass3Line,
    filledIcon: RiCompass3Fill,
    href: "/discover",
  },
  {
    label: "Chats",
    icon: IoChatboxEllipsesOutline,
    filledIcon: IoChatboxEllipses,
    href: "/chats",
  },
  {
    label: "Groups",
    icon: HiOutlineRectangleGroup,
    filledIcon: HiMiniRectangleGroup,
    href: "/groups",
  },
  {
    label: "Notifications",
    icon: IoIosNotificationsOutline,
    filledIcon: IoIosNotifications,
    href: "/notifications",
  },
  {
    label: "Friends",
    icon: BsPeople,
    filledIcon: BsPeopleFill,
    href: "/friends",
  },
  {
    label: "Media",
    icon: MdOutlinePermMedia,
    filledIcon: MdPermMedia,
    href: "/media",
  },
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

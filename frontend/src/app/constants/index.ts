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

export const MediaFilterPills = [
  { label: "All", default: true },
  { label: "Photos", default: false },
  { label: "Videos", default: false },
  { label: "Gifs", default: false },
  { label: "Files", default: false },
  { label: "Links", default: false },
];

export const MediaSources = ["All Sources", "Chats", "Group chats", "Posts"];

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

export const routeMetadata = {
  home: {
    title: "Home",
    description:
      "Welcome to Elite Messenger, a modern social messaging platform for connecting, chatting, sharing, and discovering new people.",
  },

  chats: {
    title: "Chats",
    description:
      "View your private conversations, send messages, share attachments, and stay connected with friends on Elite Messenger.",
  },

  chatroom: {
    title: "Conversation",
    description:
      "Continue a private conversation and exchange messages, media, files, links, and shared posts on Elite Messenger.",
  },

  groups: {
    title: "Group Chats",
    description:
      "Create group conversations, manage members, share media, and connect with multiple people through Elite Messenger.",
  },

  groupRoom: {
    title: "Group Conversation",
    description:
      "Chat with group members, share attachments, manage conversations, and follow group activity on Elite Messenger.",
  },

  discover: {
    title: "Discover",
    description:
      "Explore posts, discover new people, interact with content, and expand your network on Elite Messenger.",
  },

  createPost: {
    title: "Create Post",
    description:
      "Create and publish a new post with captions, photos, videos, and audience controls on Elite Messenger.",
  },

  media: {
    title: "Media",
    description:
      "Browse photos, videos, GIFs, documents, files, and links shared across your Elite Messenger conversations.",
  },

  mediaPreview: {
    title: "Media Preview",
    description:
      "Preview shared media, view attachment information, and return to the original Elite Messenger conversation.",
  },

  notifications: {
    title: "Notifications",
    description:
      "View message alerts, friend requests, post interactions, group updates, and other Elite Messenger activity.",
  },

  friends: {
    title: "Friends",
    description:
      "Find people, manage friend requests, explore suggested users, and grow your Elite Messenger network.",
  },

  profile: {
    title: "Profile",
    description:
      "View and manage your Elite Messenger profile, posts, shared media, friends, groups, and account information.",
  },

  publicProfile: {
    title: "User Profile",
    description:
      "View a user’s Elite Messenger profile, posts, media, mutual friends, groups, and public information.",
  },

  editProfile: {
    title: "Edit Profile",
    description:
      "Update your name, username, biography, profile picture, banner, and personal information on Elite Messenger.",
  },

  login: {
    title: "Log In",
    description:
      "Log in to Elite Messenger to access your conversations, friends, groups, posts, media, and notifications.",
  },

  register: {
    title: "Create Account",
    description:
      "Create your Elite Messenger account and start connecting, messaging, sharing, and discovering new people.",
  },

  forgotPassword: {
    title: "Forgot Password",
    description:
      "Recover access to your Elite Messenger account by requesting a secure password reset.",
  },

  resetPassword: {
    title: "Reset Password",
    description:
      "Create a new secure password and restore access to your Elite Messenger account.",
  },

  settings: {
    title: "Settings",
    description:
      "Manage your Elite Messenger account, privacy, appearance, notifications, security, and application preferences.",
  },

  notFound: {
    title: "Page Not Found",
    description:
      "The requested Elite Messenger page could not be found or may no longer be available.",
  },
};

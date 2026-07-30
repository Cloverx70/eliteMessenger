import { DiscoverPost } from "../../types";

export function getAuthorName(post: DiscoverPost): string {
  return (
    `${post.author.firstname ?? ""} ${post.author.lastname ?? ""}`.trim() ||
    post.author.username
  );
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPostTime(value: string): string {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

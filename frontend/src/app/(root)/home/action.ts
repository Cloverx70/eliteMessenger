import type { HomeSuggestedUser, HomeUser } from "./types";

import type { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { homeIntegrationRoutes } from "./integration-routes";

interface ApiResponse<T> {
  message?: string;
  code?: number;
  data: T;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unwrapApiData(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return "data" in value ? value.data : value;
}

function parseUser(value: unknown): HomeUser | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id);
  const username = readString(value.username);

  if (!id || !username) return null;

  return {
    id,
    username,
    firstname: readString(value.firstname),
    lastname: readString(value.lastname),
    userPfpUrl: readNullableString(value.userPfpUrl),
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
  };
}

export async function getHomeCurrentUser(): Promise<HomeUser | null> {
  try {
    const response: AxiosResponse<ApiResponse<unknown> | unknown> =
      await ServerEndpoint.get(homeIntegrationRoutes.api.currentUser, {
        withCredentials: true,
      });

    return parseUser(unwrapApiData(response.data));
  } catch {
    return null;
  }
}

export async function getHomeSuggestedFriends(): Promise<HomeSuggestedUser[]> {
  try {
    const response: AxiosResponse<ApiResponse<unknown> | unknown> =
      await ServerEndpoint.get(homeIntegrationRoutes.api.suggestedFriends, {
        withCredentials: true,
      });

    const unwrapped = unwrapApiData(response.data);

    let values: unknown[] = [];

    if (Array.isArray(unwrapped)) {
      values = unwrapped;
    } else if (isRecord(unwrapped)) {
      if (Array.isArray(unwrapped.users)) values = unwrapped.users;
      else if (Array.isArray(unwrapped.items)) values = unwrapped.items;
      else if (Array.isArray(unwrapped.suggestions)) {
        values = unwrapped.suggestions;
      }
    }

    return values
      .map((value): HomeSuggestedUser | null => {
        const parsedUser = parseUser(value);
        if (!parsedUser || !isRecord(value)) return null;

        return {
          ...parsedUser,
          mutualFriendCount: Math.max(
            0,
            readNumber(
              value.mutualFriendCount ??
                value.mutualFriendsCount ??
                value.mutualCount,
            ),
          ),
          requestId: readNullableString(value.requestId),
        };
      })
      .filter((value): value is HomeSuggestedUser => value !== null)
      .slice(0, 5);
  } catch {
    return [];
  }
}

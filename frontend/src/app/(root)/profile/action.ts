import { ApiResponse, ProfileScreenData, UpdateProfileInput } from "./types";

import type { AxiosResponse } from "axios";
import ServerEndpoint from "@/lib/server-endpoint";
import { handleError } from "@/app/constants";

function unwrapResponse<T>(
  response: AxiosResponse<ApiResponse<T>>,
  fallbackMessage: string,
): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(response.data?.message || fallbackMessage);
  }

  if (!response.data || typeof response.data.code !== "number") {
    throw new Error("The server returned an invalid response");
  }

  return response.data.data;
}

export async function GetMyProfile(): Promise<ProfileScreenData> {
  try {
    const response: AxiosResponse<ApiResponse<ProfileScreenData>> =
      await ServerEndpoint.get("/profile/me", {
        withCredentials: true,
      });

    return unwrapResponse(
      response,
      "Something went wrong while retrieving your profile",
    );
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function GetProfileByUsername(
  username: string,
): Promise<ProfileScreenData> {
  try {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      throw new Error("Username is required");
    }

    const response: AxiosResponse<ApiResponse<ProfileScreenData>> =
      await ServerEndpoint.get(
        `/profile/${encodeURIComponent(normalizedUsername)}`,
        {
          withCredentials: true,
        },
      );

    return unwrapResponse(
      response,
      "Something went wrong while retrieving the profile",
    );
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

export async function UpdateMyProfile(
  input: UpdateProfileInput,
): Promise<ProfileScreenData> {
  try {
    const formData = new FormData();

    formData.append("firstname", input.firstname.trim());
    formData.append("lastname", input.lastname.trim());
    formData.append("username", input.username.trim());

    // Sending an empty string lets your DTO transform it into null.
    formData.append("bio", input.bio?.trim() ?? "");

    if (input.profilePicture) {
      formData.append("profilePicture", input.profilePicture);
    }

    const response: AxiosResponse<ApiResponse<ProfileScreenData>> =
      await ServerEndpoint.patch("/profile/me", formData, {
        withCredentials: true,
      });

    return unwrapResponse(
      response,
      "Something went wrong while updating your profile",
    );
  } catch (error: unknown) {
    handleError(error);
    throw error;
  }
}

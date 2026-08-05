import {
  GetMyProfile,
  GetProfileByUsername,
  UpdateMyProfile,
} from "../(root)/profile/action";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UpdateProfileInput } from "../(root)/profile/types";
import { useRouter } from "next/navigation";

export const profileKeys = {
  all: ["PROFILE"] as const,
  me: () => [...profileKeys.all, "ME"] as const,
  user: (username: string) => [...profileKeys.all, "USER", username] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: GetMyProfile,
    staleTime: 60_000,
  });
}

export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: profileKeys.user(username),
    queryFn: () => GetProfileByUsername(username),
    enabled: Boolean(username.trim()),
    staleTime: 60_000,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["UPDATE_MY_PROFILE"],

    mutationFn: (input: UpdateProfileInput) => {
      return UpdateMyProfile(input);
    },

    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(["MY_PROFILE"], updatedProfile);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["MY_PROFILE"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["STATUS"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["PROFILE"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["CHATROOMS"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["GROUPS"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["POSTS"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["NOTIFICATIONS"],
        }),
      ]);
      router.refresh();
    },
  });
}

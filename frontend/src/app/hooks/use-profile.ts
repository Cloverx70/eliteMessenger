import {
  GetMyProfile,
  GetProfileByUsername,
  UpdateMyProfile,
} from "../(root)/profile/action";
import { ProfileScreenData, UpdateProfileInput } from "../(root)/profile/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => UpdateMyProfile(input),

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<ProfileScreenData>(
        profileKeys.me(),
        updatedProfile,
      );

      queryClient.setQueryData<ProfileScreenData>(
        profileKeys.user(updatedProfile.user.username),
        updatedProfile,
      );

      void queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
}

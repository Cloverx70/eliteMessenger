"use client";

import { DiscoverPost, FeedFilters, FeedPage } from "../(root)/discover/types";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getDiscoverFeed,
  getPost,
  setPostLiked,
  setPostSaved,
} from "../(root)/discover/action";

export const discoverKeys = {
  all: ["DISCOVER"] as const,

  feeds: ["DISCOVER", "FEED"] as const,

  feed: (filters: FeedFilters) => ["DISCOVER", "FEED", filters] as const,

  post: (postId: string) => ["DISCOVER", "POST", postId] as const,

  comments: (postId: string) => ["DISCOVER", "COMMENTS", postId] as const,
};

type DiscoverPostPatch = Omit<Partial<DiscoverPost>, "viewer"> & {
  viewer?: Partial<DiscoverPost["viewer"]>;
};

export function useDiscoverFeed(filters: FeedFilters) {
  return useInfiniteQuery({
    queryKey: discoverKeys.feed(filters),

    initialPageParam: undefined as string | undefined,

    queryFn: ({ pageParam }) => getDiscoverFeed(filters, pageParam),

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePostDetail(postId: string | null) {
  return useQuery({
    queryKey: discoverKeys.post(postId ?? "none"),

    queryFn: () => getPost(postId!),

    enabled: Boolean(postId),
  });
}

function patchPost(
  post: DiscoverPost,
  postId: string,
  patch: DiscoverPostPatch,
): DiscoverPost {
  if (post.id !== postId) {
    return post;
  }

  const { viewer: viewerPatch, ...postPatch } = patch;

  return {
    ...post,
    ...postPatch,

    viewer: {
      ...post.viewer,
      ...viewerPatch,
    },
  };
}

export function usePostEngagement(postId: string) {
  const queryClient = useQueryClient();

  const findPostInCache = (): DiscoverPost | undefined => {
    const detailPost = queryClient.getQueryData<DiscoverPost>(
      discoverKeys.post(postId),
    );

    if (detailPost) {
      return detailPost;
    }

    const feedQueries = queryClient.getQueriesData<InfiniteData<FeedPage>>({
      queryKey: discoverKeys.feeds,
    });

    for (const [, feedData] of feedQueries) {
      if (!feedData) {
        continue;
      }

      for (const page of feedData.pages) {
        const post = page.items.find((item) => item.id === postId);

        if (post) {
          return post;
        }
      }
    }

    return undefined;
  };

  const patchEveryFeed = (patch: DiscoverPostPatch) => {
    queryClient.setQueriesData<InfiniteData<FeedPage>>(
      {
        queryKey: discoverKeys.feeds,
      },

      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          pages: current.pages.map((page) => ({
            ...page,

            items: page.items.map((post) => patchPost(post, postId, patch)),
          })),
        };
      },
    );

    queryClient.setQueryData<DiscoverPost>(
      discoverKeys.post(postId),

      (current) => (current ? patchPost(current, postId, patch) : current),
    );
  };

  const likeMutation = useMutation({
    mutationFn: (liked: boolean) => setPostLiked(postId, liked),

    onMutate: async (liked) => {
      await queryClient.cancelQueries({
        queryKey: discoverKeys.all,
      });

      const currentPost = findPostInCache();

      const previousLiked = currentPost?.viewer.liked ?? !liked;

      const previousCount = currentPost?.likeCount ?? 0;

      const likeDifference = liked === previousLiked ? 0 : liked ? 1 : -1;

      patchEveryFeed({
        likeCount: Math.max(0, previousCount + likeDifference),

        viewer: {
          liked,
        },
      });

      return {
        previousLiked,
        previousCount,
      };
    },

    onSuccess: (result) => {
      patchEveryFeed({
        likeCount: result.likeCount,

        viewer: {
          liked: result.liked,
        },
      });
    },

    onError: (_error, _liked, context) => {
      if (!context) {
        return;
      }

      patchEveryFeed({
        likeCount: context.previousCount,

        viewer: {
          liked: context.previousLiked,
        },
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: discoverKeys.post(postId),
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (saved: boolean) => setPostSaved(postId, saved),

    onMutate: async (saved) => {
      await queryClient.cancelQueries({
        queryKey: discoverKeys.all,
      });

      const currentPost = findPostInCache();

      const previousSaved = currentPost?.viewer.saved ?? !saved;

      patchEveryFeed({
        viewer: {
          saved,
        },
      });

      return {
        previousSaved,
      };
    },

    onSuccess: (result) => {
      patchEveryFeed({
        viewer: {
          saved: result.saved,
        },
      });
    },

    onError: (_error, _saved, context) => {
      if (!context) {
        return;
      }

      patchEveryFeed({
        viewer: {
          saved: context.previousSaved,
        },
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: discoverKeys.post(postId),
      });
    },
  });

  return {
    likeMutation,
    saveMutation,
  };
}

export type ProfileMediaType = "IMAGE" | "VIDEO";

export type ProfileFriendshipStatus =
  | "SELF"
  | "NONE"
  | "OUTGOING_PENDING"
  | "INCOMING_PENDING"
  | "FRIENDS";

export interface ProfilePerson {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  userPfpUrl: string | null;
  isActive?: boolean;
  lastSeen?: string | null;
}

export interface ProfileMediaItem {
  id: string;
  postId: string;
  type: ProfileMediaType;
  url: string;
  blurDataURL?: string | null;
  filename?: string | null;
  createdAt: string;
}

export interface ProfilePost {
  id: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  attachments: ProfileMediaItem[];
}

export interface ProfileGroup {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  membersCount: number;
  joinedAt: string;
}

export interface ProfileStats {
  posts: number;
  friends: number;
  groups: number;
  media: number;
}

export interface ProfileActivitySummary {
  postsCreated: number;
  likesReceived: number;
  commentsReceived: number;
  newFriends: number;
  groupsJoined: number;
}

export interface ProfileUser extends ProfilePerson {
  email: string | null;
  bio: string | null;
  createdAt: string;
}

export interface ProfileScreenData {
  user: ProfileUser;
  stats: ProfileStats;
  media: ProfileMediaItem[];
  posts: ProfilePost[];
  friendsPreview: ProfilePerson[];
  groups: ProfileGroup[];
  activity: ProfileActivitySummary;
  isOwnProfile: boolean;
  friendshipStatus: ProfileFriendshipStatus;
}

export interface UpdateProfileInput {
  firstname?: string;
  lastname?: string;
  username?: string;
  bio?: string | null;
}

export interface ApiResponse<T> {
  message: string;
  code: number;
  data: T;
}

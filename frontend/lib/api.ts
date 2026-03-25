import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getInMemoryToken, setInMemoryToken } from './utils';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string | null> | null = null;
let refreshPromise: Promise<string | null> | null = null;

const shouldAttachCsrf = (method?: string) => {
  if (!method) return false;
  const normalized = method.toLowerCase();
  return !['get', 'head', 'options'].includes(normalized);
};

const fetchCsrfToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfFetchPromise) {
    csrfFetchPromise = api
      .get<{ csrfToken: string }>('/csrf-token')
      .then(({ data }) => {
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfFetchPromise = null;
      });
  }

  return csrfFetchPromise;
};

export const setAccessToken = (token: string | null): void => {
  setInMemoryToken(token);
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use(async (config) => {
  if (shouldAttachCsrf(config.method)) {
    const token = await fetchCsrfToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
    }
  }

  const accessToken = getInMemoryToken();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

const queueRefreshToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post<AuthResponse>('/auth/refresh-token')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig;
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      const newToken = await queueRefreshToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export interface UserSummary {
  id?: string;
  _id?: string;
  name: string;
  email: string;
}

export interface NotificationPreferences {
  friendRequests?: boolean;
  messages?: boolean;
  communityActivity?: boolean;
  emailUpdates?: boolean;
}

export interface PrivacySettings {
  profileVisibility?: 'everyone' | 'matches' | 'private';
  friendRequests?: 'everyone' | 'friends_of_friends' | 'no_one';
  messages?: 'everyone' | 'matches' | 'friends_only';
}

export interface UserProfile extends UserSummary {
  username?: string;
  age?: number;
  gender?: string;
  role?: 'user' | 'admin';
  country?: string;
  address?: string;
  diaspora?: boolean;
  interests?: string[];
  profileImage?: string;
  coverPhoto?: string;
  gallery?: string[];
  bio?: string;
  likes?: string[];
  matches?: string[];
  friends?: string[];
  communities?: string[];
  following?: string[];
  onboardingComplete?: boolean;
  preferredGender?: 'male' | 'female' | 'both';
  notificationPreferences?: NotificationPreferences;
  privacySettings?: PrivacySettings;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface LoginResponse extends Partial<AuthResponse> {
  twoFactorRequired?: boolean;
  message?: string;
}

export type AttachmentType = 'image' | 'video' | 'document';

export interface AttachmentMeta {
  url: string;
  type: AttachmentType;
  mimetype?: string;
  size?: number;
  originalName?: string;
  purpose?: string;
}

export interface UploadedFile extends AttachmentMeta {
  mimetype: string;
  size: number;
  originalName: string;
  purpose: string;
}

export interface UploadResponse {
  files: UploadedFile[];
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  address?: string;
  country: string;
  interests: string[];
  profileImage?: string;
  gallery?: string[];
  phone?: string;
}

export interface RegisterResponse extends AuthResponse {
  message: string;
}

export const loginRequest = async (email: string, password: string, twoFactorCode?: string): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password, twoFactorCode });
  return data;
};

export const registerRequest = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
};

export const uploadPublicFiles = async (files: File[], purpose = 'profile'): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('purpose', purpose);
  files.forEach((file) => {
    formData.append('files', file);
  });

  const { data } = await api.post<UploadResponse>('/uploads/public', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const uploadProfileImage = async (file: File): Promise<UploadedFile> => {
  const { files } = await uploadPublicFiles([file], 'profile');
  return files[0];
};

export const verifyOtpRequest = async (payload: { email: string; code: string }): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/verify-otp', payload);
  return data;
};

export const resendOtpRequest = async (email: string) => {
  const { data } = await api.post<{ message: string; previewOtp?: string }>('/auth/resend-otp', { email });
  return data;
};

export const logoutRequest = async () => {
  await api.post('/auth/logout');
  setAccessToken(null);
};

export const refreshAccessToken = async (): Promise<string | null> => queueRefreshToken();

export const forgotPasswordRequest = async (email: string) => {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPasswordRequest = async (payload: { token: string; password: string }) => {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
  return data;
};

export const changePasswordRequest = async (payload: { currentPassword: string; newPassword: string }) => {
  const { data } = await api.put<{ message: string }>('/auth/change-password', payload);
  return data;
};

export const checkUsernameAvailability = async (username: string) => {
  const { data } = await api.get<{ available: boolean }>('/auth/check-username', { params: { username } });
  return data;
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>('/users/me');
  return data;
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const { data } = await api.patch<UserProfile>('/users/me', updates);
  return data;
};

export const deleteAccountRequest = async (): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>('/users/delete');
  return data;
};

// ── Ads ─────────────────────────────────────────────────────────────────────
export interface Ad {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  active: boolean;
  createdAt: string;
}

export const fetchActiveAds = async (): Promise<Ad[]> => {
  const { data } = await api.get<{ ads: Ad[] }>('/ads');
  return data.ads;
};

export const fetchAllAds = async (): Promise<Ad[]> => {
  const { data } = await api.get<{ ads: Ad[] }>('/ads/all');
  return data.ads;
};

export const createAd = async (payload: { title: string; imageUrl: string; linkUrl?: string }): Promise<Ad> => {
  const { data } = await api.post<{ ad: Ad }>('/ads', payload);
  return data.ad;
};

export const updateAd = async (id: string, payload: Partial<Ad>): Promise<Ad> => {
  const { data } = await api.patch<{ ad: Ad }>(`/ads/${id}`, payload);
  return data.ad;
};

export const deleteAd = async (id: string): Promise<void> => {
  await api.delete(`/ads/${id}`);
};

export const fetchUserProfileById = async (userId: string): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>(`/users/${userId}`);
  return data;
};

export interface DiscoverResponse {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  results: UserProfile[];
}

export const discoverProfiles = async (params?: Record<string, unknown>): Promise<DiscoverResponse> => {
  const { data } = await api.get<DiscoverResponse>('/users/discover', { params });
  return data;
};

export const fetchMatchRecommendations = async (): Promise<UserProfile[]> => {
  const { data } = await api.get<UserProfile[]>('/users/matches');
  return data;
};

export const sendFriendRequest = async (targetUserId: string) => {
  const { data } = await api.post<{ message: string; requestId: string }>('/friends/request', { targetUserId });
  return data;
};

export const respondToFriendRequest = async (payload: { requestId: string; action: 'accept' | 'reject' }) => {
  const { data } = await api.post<{ message: string }>('/friends/request/respond', payload);
  return data;
};

export const reportUserProfile = async (payload: { targetUserId: string; reason: string; details?: string }) => {
  const { data } = await api.post<{ message: string; reportId: string }>('/users/report', payload);
  return data;
};

export interface MatchRecord {
  _id: string;
  conversationId: string;
  participants: string[];
  profile: UserProfile | null;
  lastMessageAt?: string;
}

export interface MessageRecord {
  _id: string;
  conversationId: string;
  sender: string;
  recipient: string;
  body: string;
  createdAt: string;
  attachments?: AttachmentMeta[];
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'new_message'
  | 'community_invite'
  | 'community_join'
  | 'profile_view';

export interface NotificationRecord {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actor?: {
    _id?: string;
    name?: string;
    profileImage?: string;
    username?: string;
  };
}

export interface NotificationListResponse {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  unreadCount: number;
  results: NotificationRecord[];
}

export const fetchMatches = async (): Promise<MatchRecord[]> => {
  const { data } = await api.get<MatchRecord[]>('/matches');
  return data;
};

export const fetchConversation = async (conversationId: string): Promise<MessageRecord[]> => {
  const { data } = await api.get<MessageRecord[]>(`/messages/${conversationId}`);
  return data;
};

export const sendMessageRequest = async (payload: {
  conversationId: string;
  recipientId: string;
  body: string;
}): Promise<MessageRecord> => {
  const { data } = await api.post<MessageRecord>('/messages', payload);
  return data;
};

export const fetchFriendSuggestions = async (params?: { limit?: number }): Promise<UserProfile[]> => {
  const { data } = await api.get<UserProfile[]>('/users/suggestions', { params });
  return data;
};

export const fetchNotifications = async (params?: { filter?: string; category?: string; page?: number; limit?: number }): Promise<NotificationListResponse> => {
  const { data } = await api.get<NotificationListResponse>('/notifications', { params });
  return data;
};

export const markNotificationRead = async (notificationId: string): Promise<NotificationRecord> => {
  const { data } = await api.put<{ notification: NotificationRecord }>(`/notifications/read/${notificationId}`);
  return data.notification;
};

export const markAllNotificationsRead = async (): Promise<{ updated: number }> => {
  const { data } = await api.put<{ updated: number }>('/notifications/read-all');
  return data;
};

export const fetchNotificationSummary = async (): Promise<{ unreadCount: number }> => {
  const { data } = await api.get<NotificationListResponse>('/notifications', { params: { limit: 1 } });
  return { unreadCount: data.unreadCount };
};

export interface CommunityRecord {
  _id: string;
  slug?: string;
  name: string;
  description?: string;
  summary?: string;
  coverImage?: string;
  memberCount?: number;
  interests?: string[];
  tags?: string[];
  privacy?: 'public' | 'private';
  city?: string;
  location?: string;
  createdAt?: string;
  createdBy?: (UserSummary & { profileImage?: string }) | string;
  members?: UserProfile[];
  isMember?: boolean;
}

export interface CommunityListResponse {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  results: CommunityRecord[];
}

export interface CreateCommunityPayload {
  name: string;
  description: string;
  interests: string[];
  coverImage?: string;
  city?: string;
  privacy?: 'public' | 'private';
}

export const fetchCommunities = async (params?: {
  limit?: number;
  search?: string;
  page?: number;
  interest?: string;
  interests?: string;
}): Promise<CommunityListResponse> => {
  const { data } = await api.get<CommunityListResponse>('/communities', { params });
  return data;
};

export const createCommunity = async (payload: CreateCommunityPayload): Promise<CommunityRecord> => {
  const { data } = await api.post<CommunityRecord>('/communities/create', payload);
  return data;
};

export const joinCommunity = async (communityId: string): Promise<CommunityRecord> => {
  const { data } = await api.post<CommunityRecord>('/communities/join', { communityId });
  return data;
};

export const fetchCommunityById = async (communityId: string): Promise<CommunityRecord> => {
  const { data } = await api.get<CommunityRecord>(`/communities/${communityId}`);
  return data;
};

export const inviteCommunityMember = async (communityId: string, userId: string) => {
  const { data } = await api.post<{ message: string }>('/communities/invite', { communityId, userId });
  return data;
};

export interface EventOrganizer {
  id?: string;
  name?: string;
  title?: string;
  avatar?: string;
  community?: string;
  profileImage?: string;
}

export interface EventRecord {
  _id: string;
  title: string;
  description?: string;
  summary?: string;
  coverImage?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  startsAt?: string;
  endsAt?: string;
  organizer?: EventOrganizer;
  tags?: string[];
  rsvpCount?: number;
  capacity?: number;
  attendeeCount?: number;
  popularityScore?: number;
  isVirtual?: boolean;
  shareUrl?: string;
  source?: string;
  hostType?: 'community' | 'user' | 'partner';
  community?: string;
  createdBy?: string;
}

export interface EventQuery {
  limit?: number;
  interests?: string;
  location?: string;
  communityIds?: string;
  followingIds?: string;
  tags?: string;
  timeframe?: 'upcoming' | 'past';
}

export interface CreateEventPayload {
  title: string;
  description: string;
  summary?: string;
  location?: string;
  city?: string;
  country?: string;
  timezone?: string;
  isVirtual?: boolean;
  startsAt: string;
  endsAt?: string;
  coverImage?: string;
  tags?: string[];
  capacity?: number;
  hostType?: 'community' | 'user' | 'partner';
  communityId?: string;
  source?: string;
  shareUrl?: string;
}

export const fetchEvents = async (params?: { limit?: number }): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events', { params });
  return data;
};

export const fetchRecommendedEvents = async (params?: EventQuery): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events/recommended', { params });
  return data;
};

export const fetchCommunityEvents = async (params?: EventQuery): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events/community', { params });
  return data;
};

export const fetchUserEvents = async (params?: EventQuery): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events/user', { params });
  return data;
};

export const fetchTrendingEvents = async (params?: EventQuery): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events/trending', { params });
  return data;
};

export const fetchNearbyEvents = async (params?: EventQuery): Promise<EventRecord[]> => {
  const { data } = await api.get<EventRecord[]>('/events/nearby', { params });
  return data;
};

export const createEvent = async (payload: CreateEventPayload): Promise<EventRecord> => {
  const { data } = await api.post<EventRecord>('/events', payload);
  return data;
};

export interface SessionMetadata {
  id: string;
  device?: string;
  browser?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  current?: boolean;
}

export const fetchActiveSessions = async (): Promise<SessionMetadata[]> => {
  const { data } = await api.get<SessionMetadata[]>('/users/sessions');
  return data;
};

export const revokeSessionRequest = async (sessionId: string) => {
  await api.delete(`/users/sessions/${sessionId}`);
};

export const setupTwoFactor = async () => {
  const { data } = await api.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup');
  return data;
};

export const verifyTwoFactorSetupRequest = async (token: string) => {
  const { data } = await api.post<{ message: string }>('/auth/2fa/verify', { token });
  return data;
};

export const disableTwoFactorRequest = async (token: string) => {
  const { data } = await api.post<{ message: string }>('/auth/2fa/disable', { token });
  return data;
};

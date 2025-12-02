import type { GetTokenSilentlyOptions } from "@auth0/auth0-react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, init: RequestInit, getToken: (options?: GetTokenSilentlyOptions) => Promise<string>) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  const resp = await fetch(`${API_BASE}${url}`, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API ${resp.status}: ${text}`);
  }
  return resp.json();
}

export function useApi() {
  const { getAccessTokenSilently } = useAuth0();

  return {
    async getCoins(): Promise<{ coins: number }> {
      return fetchWithAuth("/users/me/coins", { method: "GET" }, getAccessTokenSilently);
    },
    async incrementCoins(amount: number): Promise<{ coins: number }> {
      return fetchWithAuth(
        "/users/me/coins/increment",
        { method: "POST", body: JSON.stringify({ amount }) },
        getAccessTokenSilently
      );
    },
    async setCoins(coins: number): Promise<{ coins: number }> {
      return fetchWithAuth(
        "/users/me/coins",
        { method: "PUT", body: JSON.stringify({ coins }) },
        getAccessTokenSilently
      );
    },
    async getOwnedItems(): Promise<Array<{ item_id: string; created_at: string }>> {
      return fetchWithAuth(
        "/users/me/owned-items",
        { method: "GET" },
        getAccessTokenSilently
      );
    },
    async addOwnedItem(item_id: string): Promise<{ item_id: string; created_at: string }> {
      return fetchWithAuth(
        "/users/me/owned-items",
        { method: "POST", body: JSON.stringify({ item_id }) },
        getAccessTokenSilently
      );
    },
    async getBio(): Promise<{ bio: string | null }> {
      return fetchWithAuth(
        "/users/me/bio",
        { method: "GET" },
        getAccessTokenSilently
      );
    },
    async updateBio(bio: string): Promise<{ bio: string | null }> {
      return fetchWithAuth(
        "/users/me/bio",
        { method: "PUT", body: JSON.stringify({ bio }) },
        getAccessTokenSilently
      );
    },
    async getDisplayName(): Promise<{ display_name: string | null }> {
      return fetchWithAuth(
        "/users/me/display-name",
        { method: "GET" },
        getAccessTokenSilently
      );
    },
    async updateDisplayName(display_name: string): Promise<{ display_name: string | null }> {
      return fetchWithAuth(
        "/users/me/display-name",
        { method: "PUT", body: JSON.stringify({ display_name }) },
        getAccessTokenSilently
      );
    },
    async getProfileBackground(): Promise<{ profile_background: string | null }> {
      return fetchWithAuth(
        "/users/me/profile-background",
        { method: "GET" },
        getAccessTokenSilently
      );
    },
    async updateProfileBackground(profile_background: string): Promise<{ profile_background: string | null }> {
      return fetchWithAuth(
        "/users/me/profile-background",
        { method: "PUT", body: JSON.stringify({ profile_background }) },
        getAccessTokenSilently
      );
    },
    async listBadges(): Promise<Array<{ code: string; name: string; description: string | null }>> {
      return fetchWithAuth("/badges", { method: "GET" }, getAccessTokenSilently);
    },
    async getMyBadges(): Promise<Array<{ code: string; name: string; description: string | null }>> {
      return fetchWithAuth("/users/me/badges", { method: "GET" }, getAccessTokenSilently);
    },
    async awardBadge(code: string): Promise<{ status: string; code: string }> {
      return fetchWithAuth(
        `/users/me/badges/${code}`,
        { method: "POST" },
        getAccessTokenSilently
      );
    },
    async getShowcasedBadges(): Promise<{ showcased_badges: string | null }> {
      return fetchWithAuth(
        "/users/me/showcased-badges",
        { method: "GET" },
        getAccessTokenSilently
      );
    },
    async updateShowcasedBadges(showcased_badges: string): Promise<{ showcased_badges: string | null }> {
      return fetchWithAuth(
        "/users/me/showcased-badges",
        { method: "PUT", body: JSON.stringify({ showcased_badges }) },
        getAccessTokenSilently
      );
    },
    async getUserProfile(userId: number): Promise<{ id: number; display_name: string | null; bio: string | null; profile_background: string | null; showcased_badges: string | null; picture_url: string | null }> {
      return fetchWithAuth(`/users/${userId}/profile`, { method: "GET" }, getAccessTokenSilently);
    },
    async getMyProfile(): Promise<{ id: number; display_name: string | null; bio: string | null; profile_background: string | null; showcased_badges: string | null; picture_url: string | null }> {
      return fetchWithAuth(`/users/me/profile`, { method: "GET" }, getAccessTokenSilently);
    },
    async updateMyProfile(payload: {
      display_name?: string | null;
      bio?: string | null;
      profile_background?: string | null;
      showcased_badges?: string | null;
      picture_url?: string | null;
    }): Promise<{
      id: number;
      display_name: string | null;
      bio: string | null;
      profile_background: string | null;
      showcased_badges: string | null;
      picture_url: string | null;
    }> {
      return fetchWithAuth(
        `/users/me/profile`,
        { method: "PUT", body: JSON.stringify(payload) },
        getAccessTokenSilently
      );
    },
    async browseUsers(query: string, offset = 0, limit = 24): Promise<Array<{ id: number; display_name: string | null; bio: string | null; profile_background: string | null; picture_url: string | null; showcased_badges: string | null }>> {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      params.set("offset", String(offset));
      params.set("limit", String(limit));
      const qs = params.toString();
      const url = qs ? `/users/browse?${qs}` : "/users/browse";
      return fetchWithAuth(url, { method: "GET" }, getAccessTokenSilently);
    },
    async listFriendRequests(): Promise<{ inbound: Array<{ id: number; requester_id: number; receiver_id: number; status: string; created_at: string; responded_at: string | null }>; outbound: Array<{ id: number; requester_id: number; receiver_id: number; status: string; created_at: string; responded_at: string | null }> }> {
      return fetchWithAuth(`/users/me/friends/requests`, { method: "GET" }, getAccessTokenSilently);
    },
    async sendFriendRequest(targetUserId: number): Promise<{ id: number; requester_id: number; receiver_id: number; status: string; created_at: string; responded_at: string | null }> {
      return fetchWithAuth(`/users/friends/request/${targetUserId}`, { method: "POST" }, getAccessTokenSilently);
    },
    async acceptFriendRequest(requestId: number): Promise<{ id: number; requester_id: number; receiver_id: number; status: string; created_at: string; responded_at: string | null }> {
      return fetchWithAuth(`/users/friends/request/${requestId}/accept`, { method: "POST" }, getAccessTokenSilently);
    },
    async declineFriendRequest(requestId: number): Promise<{ status: string }> {
      return fetchWithAuth(`/users/friends/request/${requestId}/decline`, { method: "POST" }, getAccessTokenSilently);
    },
    async listFriends(): Promise<Array<{ id: number; display_name: string | null; bio: string | null; profile_background: string | null; picture_url: string | null; showcased_badges: string | null }>> {
      return fetchWithAuth(`/users/me/friends`, { method: "GET" }, getAccessTokenSilently);
    },
    async removeFriend(friendUserId: number): Promise<{ status: string }> {
      return fetchWithAuth(`/users/friends/${friendUserId}`, { method: "DELETE" }, getAccessTokenSilently);
    },
    async listOtherUserBadges(userId: number): Promise<Array<{ code: string; name: string; description: string | null }>> {
      return fetchWithAuth(`/users/${userId}/badges`, { method: "GET" }, getAccessTokenSilently);
    },
  };
}

export type Api = ReturnType<typeof useApi>;

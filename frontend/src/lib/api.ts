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
  };
}

export type Api = ReturnType<typeof useApi>;

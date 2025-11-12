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
  };
}

export type Api = ReturnType<typeof useApi>;

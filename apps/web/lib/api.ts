import { GameRound, GuessAnswer, GuessResult, LeaderboardResponse, PokemonPublic, User } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "staxx_session_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let detail = "An error occurred";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // fallback
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async createGuest(displayName?: string): Promise<User> {
    const user = await request<User>("/auth/guest", {
      method: "POST",
      body: JSON.stringify(displayName ? { display_name: displayName } : {}),
    });
    if (user.session_token) {
      setStoredToken(user.session_token);
    }
    return user;
  },

  async loginGoogle(idToken: string): Promise<User> {
    const user = await request<User>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });
    if (user.session_token) {
      setStoredToken(user.session_token);
    }
    return user;
  },

  async getMe(): Promise<User | null> {
    try {
      return await request<User>("/auth/me");
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      removeStoredToken();
    }
  },

  // Game Engine
  async startGame(): Promise<GameRound> {
    return request<GameRound>("/games/start", {
      method: "POST",
    });
  },

  async submitGuess(gameId: string, answer: GuessAnswer): Promise<GuessResult> {
    return request<GuessResult>(`/games/${gameId}/guess`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
  },

  async abandonGame(gameId: string): Promise<void> {
    await request(`/games/${gameId}/abandon`, { method: "POST" });
  },

  async getGameResult(gameId: string): Promise<any> {
    return request(`/games/${gameId}/result`);
  },

  async getGameHistory(): Promise<{ games: any[]; count: number }> {
    return request("/games/history");
  },

  // Leaderboards
  async getLeaderboard(period: "alltime" | "daily" | "weekly", limit = 50): Promise<LeaderboardResponse> {
    return request<LeaderboardResponse>(`/leaderboards/${period}?limit=${limit}`);
  },

  async getMyRanks(): Promise<any> {
    return request("/leaderboards/me");
  },

  // Pokémon
  async searchPokemon(q: string): Promise<{ results: PokemonPublic[] }> {
    return request(`/pokemon/search?q=${encodeURIComponent(q)}`);
  },

  async getPokemonCount(): Promise<{ count: number }> {
    return request("/pokemon/count");
  },

  // Player Stats
  async getMyStats(): Promise<any> {
    return request("/players/me/stats");
  },

  async getPlayerProfile(username: string): Promise<any> {
    return request(`/players/${encodeURIComponent(username)}`);
  },
};

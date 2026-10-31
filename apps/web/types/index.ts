export type StatCategory =
  | "hp"
  | "attack"
  | "defence"
  | "special_attack"
  | "special_defence"
  | "speed"
  | "bst"
  | "height"
  | "weight";

export type GuessAnswer = "higher" | "lower" | "equal";

export interface PokemonPublic {
  canonical_id: string;
  pokeapi_id: number;
  species_id: number;
  name: string;
  display_name: string;
  form_name?: string | null;
  form_category?: string;
  types: string[];
  sprite_url?: string | null;
  artwork_url?: string | null;
  generation?: number;
  stat_category?: string;
  stat_label?: string;
  stat_unit?: string;
  stat_value?: number;
}

export interface GameRound {
  game_id: string;
  round_number: number;
  stat_category: StatCategory;
  stat_label?: string;
  stat_unit?: string;
  pokemon_a: PokemonPublic;
  pokemon_b: PokemonPublic;
}

export interface GuessResult {
  game_id: string;
  round_number: number;
  correct_answer: GuessAnswer;
  player_answer: GuessAnswer;
  is_correct: boolean;
  pokemon_b_stat_value: number;
  streak: number;
  game_over: boolean;
  final_streak?: number;
  next_round?: GameRound | null;
}

export interface User {
  user_id: string;
  display_name: string;
  username?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  account_type: "guest" | "google";
  session_token?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  score: number;
}

export interface LeaderboardResponse {
  period: "alltime" | "daily" | "weekly";
  entries: LeaderboardEntry[];
  total_players: number;
}

export interface AuraTier {
  level: number;
  name: string;
  minStreak: number;
  maxStreak: number | null;
  colorName: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  badgeClass: string;
  description: string;
}

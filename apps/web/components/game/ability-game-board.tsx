"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { AbilityGameRound } from "@/types";
import { api } from "@/lib/api";
import { StreakAura } from "@/components/streak-aura/streak-aura";
import { ScoreCard } from "./score-card";

export function AbilityGameBoard() {
  const [round, setRound] = React.useState<AbilityGameRound | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const start = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const me = await api.getMe();
      if (!me) await api.createGuest();
      const [next, stats] = await Promise.all([
        api.startAbilityGame(),
        api.getMyStats().catch(() => null),
      ]);
      setRound(next);
      const guesserBest = stats?.best_streak_guesser ?? next.personal_best ?? 0;
      setBest(guesserBest);
      setStreak(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start ability mode.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    start();
  }, [start]);

  async function choose(pokemonId: string) {
    if (!round || locked) return;
    setLocked(true);
    try {
      const result = await api.submitAbilityGuess(round.game_id, pokemonId);
      setMessage(result.is_correct ? `Correct — ${result.answer.display_name}` : `It was ${result.answer.display_name}`);
      if (result.is_correct && result.next_round) {
        setStreak(result.streak);
        setBest((value) => Math.max(value, result.streak));
        window.setTimeout(() => {
          setRound(result.next_round);
          setMessage(null);
          setLocked(false);
        }, 950);
      } else {
        window.setTimeout(() => start(), 1800);
      }
    } catch {
      setLocked(false);
      setMessage("That round could not be scored. Try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-card/90 p-8 text-center shadow-2xl">
        <p className="text-lg font-bold">Ability mode needs a quick data refresh</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={start}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!round) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-4 py-3 pb-28 sm:pb-32 font-redaction">
      <ScoreCard streak={streak} personalBest={best} modeLabel="Guesser" />

      <div className="w-full rounded-2xl bg-card/85 p-6 text-center shadow-[0_16px_36px_-18px_rgba(0,0,0,0.6)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Ability dossier</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl text-foreground">
          Which Pokémon has these abilities?
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {round.prompt.abilities.map((ability) => (
            <span
              key={ability}
              className="rounded-xl bg-secondary/80 px-4 py-2 text-sm font-bold text-foreground shadow-sm"
            >
              {ability}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">All known abilities, including hidden abilities.</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-md ${
            message.startsWith("Correct")
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              : "bg-destructive/15 text-destructive border border-destructive/20"
          }`}
        >
          {message.startsWith("Correct") ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message}
        </div>
      )}

      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {round.options.map((option) => (
          <button
            key={option.canonical_id}
            disabled={locked}
            onClick={() => choose(option.canonical_id)}
            className="group relative flex flex-col items-center justify-between min-h-40 rounded-2xl bg-card/80 p-4 text-center shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:bg-card active:scale-[0.98] disabled:opacity-60"
          >
            <div className="flex h-24 w-24 items-center justify-center">
              <img
                src={option.artwork_url || option.sprite_url || "/file.svg"}
                alt={option.display_name}
                className="max-h-24 max-w-24 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-md"
              />
            </div>
            <span className="mt-3 block text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {option.display_name}
            </span>
          </button>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> One wrong answer ends the run. Independent Guesser leaderboard.
      </p>

      <StreakAura streak={streak} personalBest={best} />
    </div>
  );
}

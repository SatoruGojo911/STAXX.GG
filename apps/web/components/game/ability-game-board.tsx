"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { AbilityGameRound } from "@/types";
import { api } from "@/lib/api";
import { StreakAura } from "@/components/streak-aura/streak-aura";
import { ScoreCard } from "./score-card";
import { StreakRoller } from "./streak-roller";

export function AbilityGameBoard() {
  const [round, setRound] = React.useState<AbilityGameRound | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; isCorrect: boolean } | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [correctId, setCorrectId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const start = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      setCorrectId(null);
      setMessage(null);
      setLocked(false);

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
    setSelectedId(pokemonId);

    try {
      const result = await api.submitAbilityGuess(round.game_id, pokemonId);
      const trueCanonicalId = result.answer.canonical_id;
      setCorrectId(trueCanonicalId);

      setMessage({
        text: result.is_correct
          ? `CORRECT! — ${result.answer.display_name}`
          : `MISSED! IT WAS ${result.answer.display_name.toUpperCase()}`,
        isCorrect: result.is_correct,
      });

      if (result.is_correct && result.next_round) {
        setStreak(result.streak);
        setBest((value) => Math.max(value, result.streak));

        window.setTimeout(() => {
          setRound(result.next_round);
          setMessage(null);
          setSelectedId(null);
          setCorrectId(null);
          setLocked(false);
        }, 1200);
      } else {
        // Wrong answer: reveal correct answer briefly then restart
        window.setTimeout(() => {
          start();
        }, 2200);
      }
    } catch {
      setLocked(false);
      setSelectedId(null);
      setCorrectId(null);
      setMessage({ text: "That round could not be scored. Try again.", isCorrect: false });
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
      <StreakRoller streak={streak} showPlusOne={Boolean(message?.isCorrect)} />
      <ScoreCard streak={streak} personalBest={best} modeLabel="Guesser" />

      {/* Ability Dossier Prompt Card */}
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

      {/* Pop-up result feedback indicator */}
      <div className="relative flex h-12 w-full items-center justify-center">
        <AnimatePresence>
          {message && (
            <motion.div
              key={message.text}
              initial={{ opacity: 0, scale: 0.4, y: -15 }}
              animate={{ opacity: 1, scale: [0.85, 1.12, 1], y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 450, damping: 22 }}
              className={`flex items-center gap-2.5 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-2xl ${
                message.isCorrect
                  ? "bg-[#05df72] text-[#052e16] border-2 border-[#46ec9c] shadow-[0_0_35px_rgba(5,223,114,0.7)]"
                  : "bg-[#ff204e] text-white border-2 border-[#ff6482] shadow-[0_0_35px_rgba(255,32,78,0.7)]"
              }`}
            >
              {message.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 fill-[#052e16] text-[#05df72]" />
              ) : (
                <XCircle className="h-5 w-5 fill-white text-[#ff204e]" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4 Interactive Pokemon Options */}
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {round.options.map((option) => {
          const isClicked = selectedId === option.canonical_id;
          const isTargetAnswer = correctId === option.canonical_id;
          const isWrongPick = isClicked && !isTargetAnswer && correctId !== null;
          const isOtherMuted = locked && !isClicked && !isTargetAnswer;

          let cardStyle = "bg-card/80 border-transparent shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)]";

          if (isTargetAnswer) {
            // Bright vibrant green glow
            cardStyle =
              "bg-[#05df72]/20 border-2 border-[#05df72] shadow-[0_0_35px_rgba(5,223,114,0.75)] ring-4 ring-[#05df72]/30 text-emerald-300";
          } else if (isWrongPick) {
            // Bright vibrant red glow
            cardStyle =
              "bg-[#ff204e]/20 border-2 border-[#ff204e] shadow-[0_0_35px_rgba(255,32,78,0.75)] ring-4 ring-[#ff204e]/30 text-rose-300";
          } else if (isOtherMuted) {
            cardStyle = "opacity-30 grayscale";
          }

          return (
            <motion.button
              key={option.canonical_id}
              disabled={locked}
              onClick={() => choose(option.canonical_id)}
              animate={
                isTargetAnswer
                  ? {
                      scale: [1, 1.1, 1.05],
                      transition: { type: "spring", stiffness: 450, damping: 18 },
                    }
                  : isWrongPick
                  ? {
                      x: [-8, 8, -6, 6, -3, 3, 0],
                      scale: [1, 0.98, 1],
                      transition: { duration: 0.45 },
                    }
                  : { scale: 1 }
              }
              whileHover={!locked ? { y: -4, scale: 1.02 } : {}}
              whileTap={!locked ? { scale: 0.96 } : {}}
              className={`group relative flex flex-col items-center justify-between min-h-44 rounded-3xl p-4 text-center transition-all duration-200 cursor-pointer disabled:cursor-default ${cardStyle}`}
            >
              {/* Floating Checkmark / Cross Badge */}
              <AnimatePresence>
                {isTargetAnswer && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1.15, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#05df72] text-[#052e16] shadow-lg"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </motion.div>
                )}
                {isWrongPick && (
                  <motion.div
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1.15, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff204e] text-white shadow-lg"
                  >
                    <XCircle className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex h-24 w-24 items-center justify-center my-auto">
                <img
                  src={option.artwork_url || option.sprite_url || "/file.svg"}
                  alt={option.display_name}
                  className="max-h-24 max-w-24 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-md"
                />
              </div>

              <span
                className={`mt-3 block text-sm font-bold transition-colors ${
                  isTargetAnswer
                    ? "text-[#05df72]"
                    : isWrongPick
                    ? "text-[#ff204e]"
                    : "text-foreground group-hover:text-primary"
                }`}
              >
                {option.display_name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> One wrong answer ends the run. Independent Guesser leaderboard.
      </p>

      <StreakAura streak={streak} personalBest={best} />
    </div>
  );
}

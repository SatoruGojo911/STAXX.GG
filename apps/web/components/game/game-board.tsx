"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { GameRound, GuessAnswer, GuessResult } from "@/types";
import { api } from "@/lib/api";
import { PokemonCard } from "./pokemon-card";
import { GameControls } from "./game-controls";
import { StatBadge } from "./stat-badge";
import { GameOver } from "./game-over";
import { StreakAura } from "@/components/streak-aura/streak-aura";
import { ScoreCard } from "./score-card";

export function GameBoard() {
  const [round, setRound] = React.useState<GameRound | null>(null);
  const [streak, setStreak] = React.useState(0);
  const [personalBest, setPersonalBest] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [revealedValueB, setRevealedValueB] = React.useState<number | null>(
    null,
  );
  const [resultFeedback, setResultFeedback] = React.useState<
    "correct" | "incorrect" | null
  >(null);
  const [isGameOver, setIsGameOver] = React.useState(false);
  const [finalStreak, setFinalStreak] = React.useState(0);
  const [isNewPersonalBest, setIsNewPersonalBest] = React.useState(false);

  // Initialize or fetch user and start game
  const startNewGame = React.useCallback(async () => {
    try {
      setLoading(true);
      setIsGameOver(false);
      setRevealedValueB(null);
      setResultFeedback(null);

      // Ensure user or guest session exists
      let user = await api.getMe();
      if (!user) {
        user = await api.createGuest();
      }

      // Fetch personal best if available
      try {
        const stats = await api.getMyStats();
        if (stats && typeof stats.best_streak === "number") {
          setPersonalBest(stats.best_streak);
        }
      } catch {
        // ignore
      }

      const initialRound = await api.startGame();
      setRound(initialRound);
      setStreak(0);
    } catch (err) {
      console.error("Failed to start game:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleGuess = async (answer: GuessAnswer) => {
    if (!round || submitting || isGameOver) return;

    try {
      setSubmitting(true);
      const res: GuessResult = await api.submitGuess(round.game_id, answer);

      // Reveal actual value for Pokemon B
      setRevealedValueB(res.pokemon_b_stat_value);
      setResultFeedback(res.is_correct ? "correct" : "incorrect");

      if (res.is_correct) {
        setStreak(res.streak);
        if (res.streak > personalBest) {
          setPersonalBest(res.streak);
        }

        // Wait a brief moment to show the reveal animation, then advance
        setTimeout(() => {
          if (res.next_round) {
            setRound(res.next_round);
            setRevealedValueB(null);
            setResultFeedback(null);
            setSubmitting(false);
          }
        }, 1100);
      } else {
        // Game Over
        setFinalStreak(res.streak);
        const isPB = res.streak > personalBest;
        setIsNewPersonalBest(isPB);
        if (isPB) setPersonalBest(res.streak);

        setTimeout(() => {
          setIsGameOver(true);
          setSubmitting(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Guess failed:", err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 font-redaction">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-bold text-muted-foreground animate-pulse">
          Loading Pokémon Data …
        </p>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <GameOver
          finalStreak={finalStreak}
          personalBest={personalBest}
          isNewPersonalBest={isNewPersonalBest}
          onPlayAgain={startNewGame}
        />
      </div>
    );
  }

  if (!round) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 py-2 pb-24 sm:pb-28 gap-3 sm:gap-4 select-none">
      {/* Stat Category Announcement Banner */}

      {/* Result feedback indicator — fixed-height slot so layout never shifts */}
      <div className="relative flex h-10 w-full items-center justify-center">
        <AnimatePresence>
          {resultFeedback && (
            <motion.div
              key={resultFeedback}
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute flex items-center gap-2 px-5 py-2 rounded-full font-redaction text-sm font-black uppercase tracking-wider text-white shadow-xl ${
                resultFeedback === "correct"
                  ? "bg-emerald-600 shadow-emerald-500/30"
                  : "bg-rose-600 shadow-rose-500/30"
              }`}
            >
              {resultFeedback === "correct" ? (
                <>
                  <CheckCircle2 className="h-5 w-5" /> CORRECT! STAXX +1
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" /> INCORRECT!
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Two Pokémon Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full items-stretch justify-items-center">
        {/* Pokémon A (Revealed) */}
        <PokemonCard
          pokemon={round.pokemon_a}
          position="A"
          statCategory={round.stat_category}
          statUnit={round.stat_unit}
        />

        {/* Pokémon B (Hidden until guessed) */}
        <PokemonCard
          pokemon={round.pokemon_b}
          position="B"
          revealedValue={revealedValueB}
          statCategory={round.stat_category}
          statUnit={round.stat_unit}
          isRevealing={submitting}
        />
      </div>

      {/* Game Controls: Higher / Equal / Lower */}
      <div className="w-full flex justify-center">
        <GameControls onGuess={handleGuess} disabled={submitting} />
      </div>
      <StreakAura streak={streak} personalBest={personalBest} />
    </div>
  );
}

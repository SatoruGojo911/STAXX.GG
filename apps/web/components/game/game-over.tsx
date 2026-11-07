"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Share2, Check, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuraTier } from "@/lib/aura-config";
import { GoogleSignInModal } from "@/components/auth/google-sign-in-modal";

interface GameOverProps {
  finalStreak: number;
  personalBest: number;
  isNewPersonalBest?: boolean;
  onPlayAgain: () => void;
}

export function GameOver({
  finalStreak,
  personalBest,
  isNewPersonalBest = false,
  onPlayAgain,
}: GameOverProps) {
  const [copied, setCopied] = React.useState(false);
  const tier = getAuraTier(finalStreak);

  const handleShare = async () => {
    const text = `I reached a streak of ${finalStreak} with the ${tier.name} Aura on staxx.gg! ⚡\nCan you beat my record?\nPlay now: https://staxx.gg`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="liquid-glass-card relative flex flex-col items-center justify-center p-8 text-center font-redaction max-w-md w-full rounded-3xl overflow-hidden"
    >
      {/* Top highlight bar */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      {/* Icon / Celebration */}
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border"
        style={{
          borderColor: tier.primaryColor,
          backgroundColor: tier.glowColor,
        }}
      >
        <Flame className="h-7 w-7" style={{ color: tier.primaryColor }} />
      </div>

      <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
        RUN COMPLETED
      </h2>

      {/* New PB Callout */}
      {isNewPersonalBest && finalStreak > 0 && (
        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>NEW PERSONAL BEST!</span>
        </div>
      )}

      {/* Final Streak Count */}
      <div className="my-6 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">
          FINAL STREAK
        </span>
        <span
          className="text-6xl font-black tabular-nums tracking-tighter"
          style={{ color: tier.primaryColor }}
        >
          {finalStreak}
        </span>
        <div className={`mt-2 px-3 py-0.5 rounded-full border text-xs font-bold uppercase ${tier.badgeClass}`}>
          {tier.name} Aura
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex w-full items-center justify-around rounded-2xl bg-secondary/40 p-4 border border-border/50 mb-6 text-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Personal Best</span>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {Math.max(finalStreak, personalBest)}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-border" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Aura Level</span>
          <span className="text-xl font-bold text-foreground">
            {tier.level} / 8
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-wide text-sm shadow-md"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Play Again
        </Button>

        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto h-12 rounded-xl border-border hover:bg-secondary font-bold text-xs"
        >
          {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-400" /> : <Share2 className="mr-1.5 h-4 w-4" />}
          {copied ? "Copied!" : "Share"}
        </Button>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 w-full flex justify-center">
        <GoogleSignInModal
          trigger={
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-bold"
            >
              <Sparkles className="h-3 w-3 text-primary" /> Sign in with Google to permanently lock in your rank
            </button>
          }
        />
      </div>
    </motion.div>
  );
}

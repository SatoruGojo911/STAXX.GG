"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { getAuraTier, getNextMilestone } from "@/lib/aura-config";
import { Progress } from "@/components/ui/progress";

interface StreakDisplayProps {
  streak: number;
  personalBest?: number;
}

export function StreakDisplay({ streak, personalBest = 0 }: StreakDisplayProps) {
  const currentTier = getAuraTier(streak);
  const { nextTier, needed, progress } = getNextMilestone(streak);

  const getTierIcon = () => {
    switch (currentTier.level) {
      case 0:
        return <Flame className="h-4 w-4 text-muted-foreground" />;
      case 1:
        return <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 2:
        return <Flame className="h-4 w-4 text-orange-500 animate-bounce" />;
      case 3:
        return <Zap className="h-4 w-4 text-cyan-400" />;
      case 4:
        return <Shield className="h-4 w-4 text-yellow-400" />;
      case 5:
        return <Zap className="h-4 w-4 text-purple-400" />;
      case 6:
      case 7:
        return <Sparkles className="h-4 w-4 text-pink-400" />;
      case 8:
        return <Crown className="h-4 w-4 text-yellow-300" />;
      default:
        return <Flame className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 font-redaction select-none">
      {/* Tier Badge & Personal Best */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase transition-colors shadow-xs ${currentTier.badgeClass}`}
        >
          {getTierIcon()}
          <span>{currentTier.name} Aura</span>
        </div>

        {personalBest > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-secondary/50 text-[11px] font-medium text-muted-foreground">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span>BEST: <span className="tabular-nums font-bold text-foreground">{personalBest}</span></span>
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {nextTier && (
        <div className="w-full max-w-[220px] flex flex-col gap-1 text-center">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Next: {nextTier.name} ({nextTier.minStreak})</span>
            <span className="tabular-nums font-bold text-primary">{needed} more</span>
          </div>
          <div className="relative h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: currentTier.primaryColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

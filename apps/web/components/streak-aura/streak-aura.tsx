"use client";

import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { AURA_TIERS, getAuraTier, getNextMilestone } from "@/lib/aura-config";

interface StreakAuraProps {
  streak: number;
  personalBest?: number;
}

const STREAK_PURPLE = "#7c3aed";
const STREAK_PURPLE_SOFT = "rgba(124, 58, 237, 0.16)";

/** Persistent, in-game streak status bar. Its active zone always reflects the current run. */
export function StreakAura({ streak, personalBest = 0 }: StreakAuraProps) {
  const tier = getAuraTier(streak);
  const { nextTier, needed, progress } = getNextMilestone(streak);

  return (
    <aside
      aria-label={`Current streak: ${streak}. ${tier.name} zone.`}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-violet-500/40 bg-card/95 font-redaction shadow-[0_-12px_30px_-25px_rgba(124,58,237,.55)] backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center border text-lg font-bold tabular-nums sm:h-12 sm:w-12 sm:text-xl"
            style={{ borderColor: STREAK_PURPLE, color: STREAK_PURPLE, backgroundColor: STREAK_PURPLE_SOFT }}
          >
            <motion.span key={streak} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 430, damping: 24 }}>{streak}</motion.span>
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="display-kicker text-violet-700 dark:text-violet-300">Current streak</p>
            <p className="truncate text-sm font-bold" style={{ color: STREAK_PURPLE }}>{tier.name} zone</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground sm:text-xs">
            <span className="truncate" style={{ color: STREAK_PURPLE }}>
              <Flame className="mr-1 inline h-3.5 w-3.5 fill-violet-600" /> {tier.name}
            </span>
            <span className="shrink-0">{nextTier ? `${needed} to ${nextTier.name}` : "Top zone"}</span>
          </div>
          <div className="flex h-2 overflow-hidden border border-violet-500/30 bg-violet-500/10">
            {AURA_TIERS.map((zone) => (
              <span key={zone.level} className="relative flex-1 border-r border-background last:border-r-0" style={{ backgroundColor: zone.level <= tier.level ? STREAK_PURPLE : undefined }}>
                {zone.level === tier.level && nextTier && (
                  <motion.span className="absolute inset-y-0 left-0 bg-white/55" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .45 }} />
                )}
              </span>
            ))}
          </div>
          <div className="mt-1 hidden justify-between text-[9px] font-medium text-muted-foreground sm:flex">
            <span>Start</span><span>Spark</span><span>Flame</span><span>Charged</span><span>Radiant</span><span>Ascended</span><span>Legendary</span><span>Mythical</span><span>Godlike</span>
          </div>
        </div>

        <div className="text-right">
          <p className="hidden text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground sm:block">Personal best</p>
          <p className="flex items-center justify-end gap-1 text-sm font-bold tabular-nums">
            <Trophy className="h-3.5 w-3.5 text-violet-600" /> {personalBest}
          </p>
        </div>
      </div>
    </aside>
  );
}

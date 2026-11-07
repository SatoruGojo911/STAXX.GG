"use client";

import { Flame, Trophy } from "lucide-react";

interface ScoreCardProps {
  streak: number;
  personalBest?: number;
  modeLabel?: string;
}

export function ScoreCard({ streak, personalBest = 0, modeLabel }: ScoreCardProps) {
  return (
    <div className="grid w-full max-w-sm grid-cols-2 rounded-2xl bg-card/85 p-2 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="border-r border-border/40 px-4 py-3 text-center">
        <p className="display-kicker flex items-center justify-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
          <Flame className="h-3.5 w-3.5 fill-primary text-primary" /> {modeLabel ? `${modeLabel} Streak` : "Current Streak"}
        </p>
        <p className="mt-1 font-redaction text-3xl font-bold tabular-nums text-foreground">
          {streak}
        </p>
      </div>
      <div className="px-4 py-3 text-center">
        <p className="display-kicker flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider">
          <Trophy className="h-3.5 w-3.5 text-amber-500" /> Best
        </p>
        <p className="mt-1 font-redaction text-3xl font-bold tabular-nums text-foreground">
          {personalBest}
        </p>
      </div>
    </div>
  );
}

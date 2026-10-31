"use client";

import * as React from "react";
import { Trophy, Medal, Crown } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuraTier } from "@/lib/aura-config";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center font-redaction">
        <Trophy className="h-10 w-10 text-muted-foreground/50" />
        <h4 className="text-lg font-bold text-foreground">No Records Yet</h4>
        <p className="text-xs text-muted-foreground">Be the first trainer to set a streak on this leaderboard!</p>
      </div>
    );
  }

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-xs">
          <Crown className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 shadow-xs">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 shadow-xs">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    return (
      <span className="flex h-8 w-8 items-center justify-center text-sm font-bold tabular-nums text-muted-foreground">
        #{rank}
      </span>
    );
  };

  return (
    <div className="liquid-glass-card w-full overflow-hidden rounded-3xl font-redaction">
      <div className="divide-y divide-border/40">
        {entries.map((entry) => {
          const isCurrentUser = currentUserId && entry.user_id === currentUserId;
          const tier = getAuraTier(entry.score);
          const name = entry.display_name || entry.username || "Anonymous Trainer";

          return (
            <div
              key={`${entry.rank}-${entry.user_id}`}
              className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary/40 ${
                isCurrentUser ? "bg-primary/10 border-l-4 border-l-primary" : ""
              }`}
            >
              {/* Left: Rank & User */}
              <div className="flex items-center gap-3">
                {renderRankBadge(entry.rank)}

                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarImage src={entry.avatar_url || ""} alt={name} />
                  <AvatarFallback className="text-xs font-bold bg-secondary text-foreground uppercase">
                    {name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground line-clamp-1">
                    {name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="capitalize">{tier.name} Aura</span>
                  </div>
                </div>
              </div>

              {/* Right: Score */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span
                    className="text-2xl font-black tabular-nums tracking-tight"
                    style={{ color: tier.level > 0 ? tier.primaryColor : "inherit" }}
                  >
                    {entry.score}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Streak
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

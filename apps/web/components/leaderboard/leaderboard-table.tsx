"use client";

import { Crown, Medal, Trophy, UserRound } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuraTier } from "@/lib/aura-config";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUserEntry?: LeaderboardEntry | null;
}

const podiumOrder = [4, 2, 1, 3, 5];
const pedestalHeight: Record<number, string> = { 1: "h-40 sm:h-48", 2: "h-28 sm:h-36", 3: "h-24 sm:h-28", 4: "h-20 sm:h-24", 5: "h-16 sm:h-20" };

function Trainer({ entry, compact = false }: { entry: LeaderboardEntry; compact?: boolean }) {
  const tier = getAuraTier(entry.score);
  const name = entry.display_name || entry.username || "Anonymous Trainer";
  return <div className={`flex min-w-0 flex-col items-center text-center ${compact ? "gap-1" : "gap-2"}`}>
    <Avatar className={`${compact ? "h-10 w-10" : "h-12 w-12"} border-2 bg-card`} style={{ borderColor: tier.primaryColor }}><AvatarImage src={entry.avatar_url || ""} alt={name} /><AvatarFallback className="bg-secondary text-xs font-bold text-foreground">{name.slice(0, 2)}</AvatarFallback></Avatar>
    <p className="max-w-full truncate text-xs font-bold">{name}</p>
    <p className="text-lg font-bold tabular-nums" style={{ color: tier.primaryColor }}>{entry.score}</p>
  </div>;
}

export function LeaderboardTable({ entries, currentUserId, currentUserEntry }: LeaderboardTableProps) {
  if (!entries.length) return <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 border border-dashed border-border p-8 text-center font-redaction"><Trophy className="h-10 w-10 text-muted-foreground/50" /><h4 className="text-lg font-bold">No records yet</h4><p className="text-xs text-muted-foreground">Set a streak to take the first place.</p></div>;

  const lookup = new Map(entries.map((entry) => [entry.rank, entry]));
  return <div className="liquid-glass-card relative w-full overflow-hidden border-border/70 font-redaction">
    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    <div className="border-b border-border/70 px-5 pb-3 pt-5 sm:px-7"><p className="display-kicker text-primary">Top five</p><p className="mt-1 text-sm text-muted-foreground">The trainers setting the pace this period.</p></div>
    <div className="grid grid-cols-5 items-end gap-1 px-3 py-7 sm:gap-3 sm:px-6">
      {podiumOrder.map((rank) => {
        const entry = lookup.get(rank);
        const isFirst = rank === 1;
        const medal = rank === 1 ? <Crown className="h-4 w-4" /> : rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : null;
        return <div key={rank} className="flex min-w-0 flex-col items-center justify-end gap-2">
          {entry ? <Trainer entry={entry} compact={!isFirst} /> : <div className="h-[84px]" />}
          <div className={`relative flex w-full flex-col items-center justify-start overflow-hidden border border-border/70 bg-card/65 pt-3 shadow-[0_12px_25px_-24px_rgba(0,0,0,.85)] backdrop-blur-sm ${pedestalHeight[rank]} ${isFirst ? "border-primary bg-primary/10" : ""}`}>
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-white/65" />
            <span className="flex items-center gap-1 text-xs font-bold" style={isFirst ? { color: "var(--primary)" } : undefined}>{medal} #{rank}</span>
          </div>
        </div>;
      })}
    </div>

    <div className="border-t border-border/70 bg-card/70 px-4 py-3 backdrop-blur-sm sm:px-5">
      {currentUserEntry ? <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center bg-primary text-sm font-bold text-primary-foreground">#{currentUserEntry.rank}</span><div className="min-w-0"><p className="display-kicker text-primary">Your current rank</p><p className="truncate text-sm font-bold">{currentUserEntry.display_name || currentUserEntry.username || "Trainer"}</p></div></div><p className="text-xl font-bold tabular-nums" style={{ color: getAuraTier(currentUserEntry.score).primaryColor }}>{currentUserEntry.score}</p></div> : <div className="flex items-center gap-3 text-sm text-muted-foreground"><UserRound className="h-5 w-5 text-primary" /><span>{currentUserId ? "Finish a run to earn a rank in this period." : "Play a run to see your rank here."}</span></div>}
    </div>
  </div>;
}

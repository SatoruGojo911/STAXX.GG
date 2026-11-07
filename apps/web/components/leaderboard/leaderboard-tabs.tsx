"use client";

import * as React from "react";
import { Trophy, Calendar, Clock, Loader2, Sparkles, Swords } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardTable } from "./leaderboard-table";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";

export function LeaderboardTabs() {
  const [period, setPeriod] = React.useState<"alltime" | "daily" | "weekly">("alltime");
  const [mode, setMode] = React.useState<"stats" | "abilities">("stats");
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | undefined>(undefined);
  const [currentUserEntry, setCurrentUserEntry] = React.useState<LeaderboardEntry | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [me, lb, ranks] = await Promise.all([
          api.getMe().catch(() => null),
          api.getLeaderboard(period, 50, mode),
          api.getMyRanks(mode).catch(() => null),
        ]);
        if (me) setCurrentUserId(me.user_id);
        setEntries(lb.entries || []);
        const rankEntry = ranks?.[period] as LeaderboardEntry | null | undefined;
        setCurrentUserEntry(rankEntry || null);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period, mode]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-6 font-redaction">
      {/* Game Mode Pill Selector */}
      <div className="flex p-1 rounded-2xl bg-secondary/60 backdrop-blur-md shadow-inner gap-1">
        <button
          onClick={() => setMode("stats")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            mode === "stats"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="h-3.5 w-3.5 text-primary" /> Higher or Lower
        </button>
        <button
          onClick={() => setMode("abilities")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            mode === "abilities"
              ? "bg-card text-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Pokémon Guesser
        </button>
      </div>

      <Tabs
        value={period}
        onValueChange={(val) => setPeriod(val as "alltime" | "daily" | "weekly")}
        className="w-full flex flex-col items-center"
      >
        <TabsList className="grid h-auto w-full max-w-md grid-cols-3 gap-2 bg-secondary/40 p-1.5 rounded-2xl">
          <TabsTrigger
            value="alltime"
            className="h-10 rounded-xl font-bold text-xs uppercase tracking-wider gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> All-Time
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            className="h-10 rounded-xl font-bold text-xs uppercase tracking-wider gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
          >
            <Clock className="h-3.5 w-3.5 text-primary" /> Daily
          </TabsTrigger>
          <TabsTrigger
            value="weekly"
            className="h-10 rounded-xl font-bold text-xs uppercase tracking-wider gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-400" /> Weekly
          </TabsTrigger>
        </TabsList>

        <div className="w-full mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <LeaderboardTable entries={entries} currentUserId={currentUserId} currentUserEntry={currentUserEntry} />
          )}
        </div>
      </Tabs>
    </div>
  );
}

"use client";

import * as React from "react";
import { Trophy, Calendar, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardTable } from "./leaderboard-table";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";

export function LeaderboardTabs() {
  const [period, setPeriod] = React.useState<"alltime" | "daily" | "weekly">("alltime");
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [me, lb] = await Promise.all([
          api.getMe().catch(() => null),
          api.getLeaderboard(period, 50),
        ]);
        if (me) setCurrentUserId(me.user_id);
        setEntries(lb.entries || []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-6 font-redaction">
      <Tabs
        value={period}
        onValueChange={(val) => setPeriod(val as "alltime" | "daily" | "weekly")}
        className="w-full flex flex-col items-center"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md h-11 p-1 bg-secondary/80 rounded-xl">
          <TabsTrigger value="alltime" className="rounded-lg font-bold text-xs uppercase tracking-wider gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> All-Time
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg font-bold text-xs uppercase tracking-wider gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg font-bold text-xs uppercase tracking-wider gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Weekly
          </TabsTrigger>
        </TabsList>

        <div className="w-full mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <LeaderboardTable entries={entries} currentUserId={currentUserId} />
          )}
        </div>
      </Tabs>
    </div>
  );
}

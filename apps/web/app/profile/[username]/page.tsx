"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { User as UserIcon, Trophy, Swords, Target, Calendar, Flame, Shield, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuraTier } from "@/lib/aura-config";

export default function ProfilePage() {
  const params = useParams();
  const username = decodeURIComponent((params?.username as string) || "Trainer");

  const [stats, setStats] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const [userStats, gameHistory] = await Promise.all([
          api.getMyStats().catch(() => null),
          api.getGameHistory().catch(() => ({ games: [] })),
        ]);
        setStats(userStats);
        setHistory(gameHistory.games || []);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const bestStreak = stats?.best_streak || 0;
  const gamesPlayed = stats?.games_played || history.length || 0;
  const totalCorrect = stats?.total_correct || 0;
  const totalIncorrect = stats?.total_incorrect || 0;
  const totalGuesses = totalCorrect + totalIncorrect;
  const accuracy = totalGuesses > 0 ? Math.round((totalCorrect / totalGuesses) * 100) : 0;
  const tier = getAuraTier(bestStreak);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-redaction">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl border border-border/80 bg-card/80 shadow-md">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground uppercase">
            {username.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
          <h1 className="text-3xl font-black text-foreground">{username}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-3 py-0.5 rounded-full border text-xs font-bold uppercase ${tier.badgeClass}`}>
              {tier.name} Aura Master
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <div className="p-5 rounded-2xl border border-border/60 bg-secondary/40 flex flex-col items-center text-center">
          <Trophy className="h-6 w-6 text-amber-500 mb-2" />
          <span className="text-3xl font-black tabular-nums text-foreground">{bestStreak}</span>
          <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Best Streak</span>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-secondary/40 flex flex-col items-center text-center">
          <Swords className="h-6 w-6 text-primary mb-2" />
          <span className="text-3xl font-black tabular-nums text-foreground">{gamesPlayed}</span>
          <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Games Played</span>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-secondary/40 flex flex-col items-center text-center">
          <Target className="h-6 w-6 text-emerald-500 mb-2" />
          <span className="text-3xl font-black tabular-nums text-foreground">{accuracy}%</span>
          <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Accuracy</span>
        </div>

        <div className="p-5 rounded-2xl border border-border/60 bg-secondary/40 flex flex-col items-center text-center">
          <Flame className="h-6 w-6 text-orange-500 mb-2" />
          <span className="text-3xl font-black tabular-nums text-foreground">{tier.level}</span>
          <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Aura Level</span>
        </div>
      </div>

      {/* Recent Game History */}
      <div className="mt-10">
        <h2 className="text-2xl font-black text-foreground mb-4">Recent Runs</h2>
        {history.length > 0 ? (
          <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
            {history.slice(0, 10).map((game: any, i: number) => {
              const runTier = getAuraTier(game.streak || 0);
              return (
                <div key={game._id || i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground font-mono">
                      #{i + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${runTier.badgeClass}`}>
                      {runTier.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tabular-nums text-foreground">
                      {game.streak || 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Streak
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-6 rounded-2xl border border-dashed border-border text-center">
            No completed runs yet. Jump into a game to start recording your history!
          </p>
        )}
      </div>
    </div>
  );
}

import { Trophy } from "lucide-react";
import { LeaderboardTabs } from "@/components/leaderboard/leaderboard-tabs";

export const metadata = {
  title: "Leaderboards — staxx.gg",
  description: "Global All-Time, Daily, and Weekly leaderboards for Pokémon Higher or Lower.",
};

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-10 flex flex-col items-center">
      <div className="flex flex-col items-center text-center mb-8 font-redaction">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Global Leaderboards
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          The highest completed streaks achieved by trainers worldwide across All-Time, Daily, and Weekly divisions.
        </p>
      </div>

      <LeaderboardTabs />
    </div>
  );
}

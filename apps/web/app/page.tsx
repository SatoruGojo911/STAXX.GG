"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Trophy,
  Flame,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Crown,
  HelpCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import { getAuraTier } from "@/lib/aura-config";

export default function LandingPage() {
  const [topPlayers, setTopPlayers] = React.useState<LeaderboardEntry[]>([]);
  const [pokemonCount, setPokemonCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    async function fetchPreview() {
      try {
        const [lb, countRes] = await Promise.all([
          api.getLeaderboard("alltime", 5),
          api.getPokemonCount().catch(() => ({ count: 238 })),
        ]);
        setTopPlayers(lb.entries || []);
        setPokemonCount(countRes.count);
      } catch (e) {
        console.error("Preview fetch error:", e);
      }
    }
    fetchPreview();
  }, []);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden font-redaction">
      {/* Hero Section */}
      <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />

        {/* Slogan Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 fill-primary" />
          <span>PLAY. GUESS. STAXX.</span>
        </motion.div>

        {/* Main Title & Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-foreground max-w-4xl"
        >
          Higher or Lower, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-amber-500">
            Pokémon Edition.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          Compare base battle stats, Base Stat Totals, height, and weight across {pokemonCount ? `${pokemonCount}+` : "hundreds of"} official Pokémon and alternate forms. Build your streak and evolve your aura.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/play"
            className={buttonVariants({
              size: "lg",
              className:
                "w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 tracking-wide transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2",
            })}
          >
            <Swords className="h-5 w-5" /> Start Playing Free
          </Link>

          <Link
            href="/leaderboard"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className:
                "w-full sm:w-auto h-14 px-8 rounded-2xl border-border hover:bg-secondary font-bold text-base transition-transform hover:scale-105 flex items-center justify-center gap-2",
            })}
          >
            <Trophy className="h-5 w-5 text-amber-500" /> View Leaderboards
          </Link>
        </motion.div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-5xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Evolving Aura</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Watch your signature aura transform through 8 visual tiers from Spark to Godlike as your streak climbs.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">9 Stat Categories</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              HP, Attack, Defence, Sp. Atk, Sp. Def, Speed, Base Stat Total, Height, and Weight. No two rounds are the same.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center p-6 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xs shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
              <Crown className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Global Competition</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Compete on All-Time, Daily, and Weekly leaderboards. Instant guest play with optional Google sign-in.
            </p>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">All-Time Top Streaks</h2>
          </div>
          <Link
            href="/leaderboard"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "font-bold flex items-center gap-1 text-primary",
            })}
          >
            Full Standings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="w-full rounded-2xl border border-border/60 bg-card/80 overflow-hidden shadow-md divide-y divide-border/40">
          {topPlayers.length > 0 ? (
            topPlayers.map((player) => {
              const tier = getAuraTier(player.score);
              return (
                <div key={player.rank} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold tabular-nums">
                      #{player.rank}
                    </span>
                    <span className="font-bold text-foreground">
                      {player.display_name || player.username || "Trainer"}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ({tier.name} Aura)
                    </span>
                  </div>
                  <span
                    className="text-2xl font-black tabular-nums"
                    style={{ color: tier.level > 0 ? tier.primaryColor : "inherit" }}
                  >
                    {player.score}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Leaderboards are warming up. Play a run to claim #1!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

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
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
        {/* Subtle Liquid Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Slogan Pill - Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">PLAY. GUESS. STAXX.</span>
        </motion.div>

        {/* Main Title & Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-foreground max-w-4xl"
        >
          Higher or Lower, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-sky-400">
            Pokémon Edition.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          Compare base battle stats, BST, height, and weight across {pokemonCount ? `${pokemonCount}+` : "hundreds of"} official Pokémon and forms. Build your streak and evolve your aura.
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
                "w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-xl tracking-wide transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2",
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
                "liquid-glass w-full sm:w-auto h-14 px-8 rounded-2xl font-bold text-base transition-transform hover:scale-105 flex items-center justify-center gap-2",
            })}
          >
            <Trophy className="h-5 w-5 text-amber-400" /> View Leaderboards
          </Link>
        </motion.div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-5xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="liquid-glass-card flex flex-col items-center text-center p-7 rounded-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-foreground">Evolving Aura</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Watch your signature aura transform through 8 visual tiers from Spark to Godlike as your streak climbs.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="liquid-glass-card flex flex-col items-center text-center p-7 rounded-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-foreground">9 Stat Categories</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              HP, Attack, Defence, Sp. Atk, Sp. Def, Speed, Base Stat Total, Height, and Weight. No two rounds are the same.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="liquid-glass-card flex flex-col items-center text-center p-7 rounded-3xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <Crown className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-foreground">Global Competition</h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Compete on All-Time, Daily, and Weekly leaderboards. Instant guest play with optional Google sign-in.
            </p>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="w-full max-w-4xl px-4 sm:px-6 py-12 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
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

        <div className="liquid-glass-card w-full rounded-3xl overflow-hidden divide-y divide-border/40">
          {topPlayers.length > 0 ? (
            topPlayers.map((player) => {
              const tier = getAuraTier(player.score);
              return (
                <div key={player.rank} className="flex items-center justify-between p-4 px-6 hover:bg-secondary/30 transition-colors">
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

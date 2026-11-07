"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Swords, Sparkles, ArrowUpDown } from "lucide-react";
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
          api.getPokemonCount().catch(() => ({ count: 1351 })),
        ]);
        setTopPlayers(lb.entries || []);
        setPokemonCount(countRes.count);
      } catch {
        /* optional preview */
      }
    }
    fetchPreview();
  }, []);

  return (
    <div className="w-full overflow-hidden font-redaction">
      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="flex flex-col items-start justify-center">
          <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Two ways to play
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.92] tracking-[-0.05em] text-foreground sm:text-7xl lg:text-8xl">
            Trust your<br />trainer instinct.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Compare base stats in Higher or Lower, or identify a Pokémon from its complete ability set. Keep the streak alive. Lose once, and it goes in the books.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/play"
              className={buttonVariants({
                size: "lg",
                className: "h-13 rounded-2xl bg-primary px-7 text-base font-bold shadow-lg hover:bg-primary/90 transition-all",
              })}
            >
              <Swords className="mr-2 h-5 w-5" /> Higher or Lower
            </Link>
            <Link
              href="/abilities"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "h-13 rounded-2xl bg-secondary/80 border-transparent px-7 text-base font-bold shadow-md hover:bg-secondary transition-all",
              })}
            >
              <Sparkles className="mr-2 h-5 w-5 text-amber-500" /> Guess the Pokémon
            </Link>
          </div>
        </div>

        {/* Hero Card Preview */}
        <div className="relative min-h-[350px] rounded-3xl bg-card/85 p-6 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md sm:min-h-[430px] sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 text-xs font-bold uppercase tracking-[.15em] text-muted-foreground border-b border-border/20">
            <span>Daily Matchup</span>
            <span>01 / 09</span>
          </div>

          <div className="flex flex-col items-center text-center my-auto py-8">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary shadow-inner">
              ?
            </div>
            <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Base Stat Total</p>
            <p className="mt-2 text-5xl font-black tracking-tight sm:text-6xl text-foreground">Higher?</p>
          </div>

          <div className="grid grid-cols-3 pt-4 border-t border-border/20 text-center text-xs font-bold">
            <span className="text-emerald-400">↑ Higher</span>
            <span className="text-sky-400">= Same</span>
            <span className="text-rose-400">↓ Lower</span>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-secondary/40 py-8 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 sm:grid-cols-3 sm:px-8">
          {[
            { value: pokemonCount ? `${pokemonCount.toLocaleString()}+` : "1,351+", label: "Pokémon & all generational forms" },
            { value: "2", label: "independent game modes & leaderboards" },
            { value: "9", label: "stat categories with server anti-cheat" },
          ].map((item) => (
            <div key={item.label} className="p-6 rounded-2xl bg-card/60 shadow-sm flex flex-col items-center text-center">
              <p className="text-4xl font-black tracking-tight text-foreground tabular-nums">{item.value}</p>
              <p className="mt-1 text-xs uppercase font-bold text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pick a Mode */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Game Modes</p>
          <h2 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl text-foreground">
            Two games. Separate leaderboards.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Link
            href="/play"
            className="group rounded-3xl bg-card/85 p-8 shadow-[0_16px_36px_-18px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <ArrowUpDown className="h-4 w-4" /> Higher or Lower
            </p>
            <h3 className="mt-3 text-2xl font-black text-foreground">Call the next stat.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              One Pokémon reveals its value. Guess if the hidden Pokémon has a higher, lower, or equal stat across HP, BST, Speed, Height, Weight, and more.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
              Start Higher / Lower run <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>

          <Link
            href="/abilities"
            className="group rounded-3xl bg-card/85 p-8 shadow-[0_16px_36px_-18px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Sparkles className="h-4 w-4 text-amber-500" /> Guess the Pokémon
            </p>
            <h3 className="mt-3 text-2xl font-black text-foreground">Read the complete ability set.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Inspect all regular and hidden abilities. Name the exact Pokémon from 4 contenders and build an independent Guesser streak on its own leaderboard.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
              Start Guesser run <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl text-foreground">
            Study. Call it. Staxx.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Every round starts with one visible clue. Your job is to make the call before the streak snaps.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: "01", t: "Study", d: "Start with the known stat, or the full ability dossier in front of you." },
            { n: "02", t: "Call it", d: "Pick higher, lower, or same — or name the Pokémon from four choices." },
            { n: "03", t: "Staxx", d: "A correct call increases your streak and evolves your aura tier." },
          ].map((step) => (
            <div className="rounded-2xl bg-card/80 p-6 shadow-md" key={step.n}>
              <p className="text-xs font-black text-primary">{step.n}</p>
              <h3 className="mt-4 text-xl font-black text-foreground">{step.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard preview */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-8 rounded-3xl bg-card/80 p-8 shadow-2xl lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Leaderboard</p>
            <h2 className="mt-2 text-3xl font-black text-foreground">Current All-Time Leaders</h2>
            <p className="mt-2 text-xs text-muted-foreground">Compete across Daily, Weekly, and All-Time leaderboards.</p>
            <Link
              href="/leaderboard"
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
            >
              See full standings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border/20">
            {topPlayers.length ? (
              topPlayers.map((player) => {
                const tier = getAuraTier(player.score);
                return (
                  <div key={player.rank} className="grid grid-cols-[2.5rem_1fr_auto] items-center py-3.5">
                    <span className="font-mono text-sm text-muted-foreground font-bold">{String(player.rank).padStart(2, "0")}</span>
                    <div>
                      <p className="font-bold text-sm text-foreground">{player.display_name || player.username || "Trainer"}</p>
                      <p className="text-xs text-muted-foreground">{tier.name} aura</p>
                    </div>
                    <span
                      className="text-2xl font-black tabular-nums"
                      style={{ color: tier.level ? tier.primaryColor : undefined }}
                    >
                      {player.score}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-sm text-muted-foreground">The board is waiting for its first run.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

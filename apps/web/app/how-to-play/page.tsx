import { BookOpen, Sparkles, Flame, Zap, Shield, Crown } from "lucide-react";
import { AURA_TIERS } from "@/lib/aura-config";

export const metadata = {
  title: "How to Play — staxx.gg",
  description: "Learn the rules, stat categories, and aura evolution progression for staxx.gg.",
};

export default function HowToPlayPage() {
  const statCategories = [
    { name: "HP", desc: "Base Hit Points of the Pokémon." },
    { name: "Attack", desc: "Base physical offensive power." },
    { name: "Defence", desc: "Base physical defensive resistance." },
    { name: "Special Attack", desc: "Base special offensive power." },
    { name: "Special Defence", desc: "Base special defensive resistance." },
    { name: "Speed", desc: "Determines turn order in battle." },
    { name: "BST (Base Stat Total)", desc: "The sum of all six base battle stats." },
    { name: "Height", desc: "Measured and displayed in metres (m)." },
    { name: "Weight", desc: "Measured and displayed in kilograms (kg)." },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-redaction">
      {/* Title */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-foreground">How to Play</h1>
        <p className="mt-2 text-muted-foreground max-w-lg">
          Master the stats, choose your guesses wisely, and staxx your winning streak.
        </p>
      </div>

      {/* Core Rules */}
      <div className="mb-12 space-y-4">
        <h2 className="text-2xl font-black text-foreground">The Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card/70">
            <span className="text-3xl font-extrabold text-primary mb-2 block">1</span>
            <h3 className="font-bold text-foreground">Examine Pokémon A</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Check the revealed numerical value for the selected stat category on the left Pokémon.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card/70">
            <span className="text-3xl font-extrabold text-primary mb-2 block">2</span>
            <h3 className="font-bold text-foreground">Predict Pokémon B</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Guess if Pokémon B has a <strong>HIGHER ↑</strong>, <strong>LOWER ↓</strong>, or <strong>EQUAL =</strong> value.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-border bg-card/70">
            <span className="text-3xl font-extrabold text-primary mb-2 block">3</span>
            <h3 className="font-bold text-foreground">Evolve Your Aura</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Correct answers advance the run and increase your streak. One wrong guess ends the run!
            </p>
          </div>
        </div>
      </div>

      {/* The 9 Stat Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-foreground mb-4">9 Comparison Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {statCategories.map((s) => (
            <div key={s.name} className="p-4 rounded-xl border border-border/60 bg-secondary/40">
              <span className="font-bold text-sm text-foreground block">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The Signature Streak Aura Progression */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-foreground mb-2">Signature Evolving Aura Tiers</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Your aura visibly evolves at specific milestone thresholds. Higher tiers unlock multi-layered energy, particle fields, and sound celebrations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AURA_TIERS.map((tier) => (
            <div
              key={tier.level}
              className="p-5 rounded-2xl border bg-card/80 flex flex-col justify-between"
              style={{ borderColor: tier.primaryColor }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase ${tier.badgeClass}`}>
                    Tier {tier.level}: {tier.name}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground font-mono">
                    {tier.maxStreak !== null ? `${tier.minStreak}–${tier.maxStreak}` : `${tier.minStreak}+`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </div>

              <div
                className="mt-4 h-1.5 w-full rounded-full"
                style={{ backgroundColor: tier.primaryColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

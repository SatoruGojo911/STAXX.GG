"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { PokemonPublic, StatCategory } from "@/types";
import { Badge } from "@/components/ui/badge";

interface PokemonCardProps {
  pokemon: PokemonPublic;
  position: "A" | "B";
  revealedValue?: number | null;
  statCategory: StatCategory | string;
  statUnit?: string;
  isRevealing?: boolean;
}

// Clean, purple-free type palette
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  fire: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", glow: "rgba(249, 115, 22, 0.15)" },
  water: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", glow: "rgba(59, 130, 246, 0.15)" },
  electric: { bg: "bg-amber-400/10", border: "border-amber-400/30", text: "text-amber-300", glow: "rgba(251, 191, 36, 0.15)" },
  grass: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "rgba(16, 185, 129, 0.15)" },
  psychic: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", glow: "rgba(244, 63, 94, 0.15)" },
  dragon: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", glow: "rgba(14, 165, 233, 0.15)" },
  ghost: { bg: "bg-slate-500/15", border: "border-slate-500/30", text: "text-slate-300", glow: "rgba(148, 163, 184, 0.15)" },
  ice: { bg: "bg-cyan-400/10", border: "border-cyan-400/30", text: "text-cyan-300", glow: "rgba(34, 211, 238, 0.15)" },
  normal: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400", glow: "rgba(161, 161, 170, 0.1)" },
  fighting: { bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-500", glow: "rgba(180, 83, 9, 0.15)" },
  poison: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", glow: "rgba(20, 184, 166, 0.15)" },
  ground: { bg: "bg-yellow-700/10", border: "border-yellow-700/30", text: "text-yellow-500", glow: "rgba(161, 98, 7, 0.15)" },
  flying: { bg: "bg-blue-400/10", border: "border-blue-400/30", text: "text-blue-300", glow: "rgba(96, 165, 250, 0.15)" },
  bug: { bg: "bg-lime-500/10", border: "border-lime-500/30", text: "text-lime-400", glow: "rgba(132, 204, 22, 0.15)" },
  rock: { bg: "bg-stone-500/10", border: "border-stone-500/30", text: "text-stone-300", glow: "rgba(120, 113, 108, 0.15)" },
  steel: { bg: "bg-zinc-400/10", border: "border-zinc-400/30", text: "text-zinc-300", glow: "rgba(161, 161, 170, 0.15)" },
  dark: { bg: "bg-neutral-800/20", border: "border-neutral-700/40", text: "text-neutral-300", glow: "rgba(64, 64, 64, 0.15)" },
  fairy: { bg: "bg-rose-400/10", border: "border-rose-400/30", text: "text-rose-300", glow: "rgba(251, 113, 133, 0.15)" },
};

export function PokemonCard({
  pokemon,
  position,
  revealedValue,
  statCategory,
  statUnit = "",
  isRevealing = false,
}: PokemonCardProps) {
  const primaryType = pokemon.types?.[0]?.toLowerCase() || "normal";
  const typeStyle = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;

  const displayValue = position === "A" ? pokemon.stat_value : revealedValue;
  const isHidden = position === "B" && (displayValue === undefined || displayValue === null);
  const artworkSrc = pokemon.artwork_url || pokemon.sprite_url || "/file.svg";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="liquid-glass-card relative flex flex-col items-center justify-between w-full max-w-sm rounded-3xl p-6 transition-all duration-300"
    >
      {/* Top Specular Liquid Highlight Bar */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Position Tag & Form Tag */}
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 border border-border text-[11px] font-bold text-foreground font-redaction">
          {position}
        </span>
        {pokemon.form_name && (
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 bg-secondary/50">
            {pokemon.form_name}
          </Badge>
        )}
      </div>

      {/* Pokémon Types */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        {pokemon.types?.map((t) => {
          const tLower = t.toLowerCase();
          const tStyle = TYPE_COLORS[tLower] || TYPE_COLORS.normal;
          return (
            <span
              key={t}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-redaction uppercase border ${tStyle.bg} ${tStyle.border} ${tStyle.text}`}
            >
              {t}
            </span>
          );
        })}
      </div>

      {/* Pokémon Artwork with subtle liquid shadow */}
      <div className="relative my-6 flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center">
        <div
          className="absolute inset-2 rounded-full blur-2xl opacity-20"
          style={{ backgroundColor: typeStyle.glow }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkSrc}
          alt={pokemon.display_name}
          className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          loading="eager"
        />
      </div>

      {/* Pokémon Name & Number */}
      <div className="flex flex-col items-center gap-1 text-center w-full">
        <h3 className="font-redaction text-2xl font-black tracking-tight text-foreground line-clamp-1">
          {pokemon.display_name}
        </h3>
        {pokemon.species_id && (
          <span className="text-xs text-muted-foreground font-mono">
            #{String(pokemon.species_id).padStart(4, "0")}
          </span>
        )}
      </div>

      {/* Stat Value Container - Frosted Glass Bar */}
      <div className="mt-5 flex w-full flex-col items-center justify-center rounded-2xl bg-secondary/40 p-4 border border-border/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-redaction">
          {statCategory.replace("_", " ")}
        </span>

        <AnimatePresence mode="wait">
          {isHidden ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-1 text-muted-foreground"
            >
              <HelpCircle className="h-5 w-5 animate-pulse text-primary" />
              <span className="font-redaction text-2xl font-bold tracking-widest text-muted-foreground/80">???</span>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex items-baseline gap-1 py-1"
            >
              <span className="font-redaction text-3xl font-black tabular-nums tracking-tight text-foreground">
                {displayValue}
              </span>
              {statUnit && (
                <span className="text-sm font-bold text-muted-foreground lowercase">
                  {statUnit}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

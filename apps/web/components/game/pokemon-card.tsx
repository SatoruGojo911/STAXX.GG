"use client";

import * as React from "react";
import Image from "next/image";
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

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  fire: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-500", glow: "rgba(249, 115, 22, 0.25)" },
  water: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-500", glow: "rgba(59, 130, 246, 0.25)" },
  electric: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-500", glow: "rgba(234, 179, 8, 0.25)" },
  grass: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-500", glow: "rgba(16, 185, 129, 0.25)" },
  psychic: { bg: "bg-pink-500/10", border: "border-pink-500/40", text: "text-pink-500", glow: "rgba(236, 72, 153, 0.25)" },
  dragon: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-500", glow: "rgba(168, 85, 247, 0.25)" },
  ghost: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-400", glow: "rgba(99, 102, 241, 0.25)" },
  ice: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", glow: "rgba(6, 182, 212, 0.25)" },
  normal: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", glow: "rgba(148, 163, 184, 0.2)" },
  fighting: { bg: "bg-amber-700/10", border: "border-amber-700/40", text: "text-amber-600", glow: "rgba(180, 83, 9, 0.2)" },
  poison: { bg: "bg-fuchsia-600/10", border: "border-fuchsia-600/40", text: "text-fuchsia-500", glow: "rgba(192, 38, 211, 0.2)" },
  ground: { bg: "bg-yellow-700/10", border: "border-yellow-700/40", text: "text-yellow-600", glow: "rgba(161, 98, 7, 0.2)" },
  flying: { bg: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400", glow: "rgba(14, 165, 233, 0.2)" },
  bug: { bg: "bg-lime-500/10", border: "border-lime-500/40", text: "text-lime-500", glow: "rgba(132, 204, 22, 0.2)" },
  rock: { bg: "bg-stone-500/10", border: "border-stone-500/40", text: "text-stone-400", glow: "rgba(120, 113, 108, 0.2)" },
  steel: { bg: "bg-zinc-500/10", border: "border-zinc-500/40", text: "text-zinc-400", glow: "rgba(113, 113, 122, 0.2)" },
  dark: { bg: "bg-gray-800/20", border: "border-gray-700/50", text: "text-gray-400", glow: "rgba(55, 65, 81, 0.3)" },
  fairy: { bg: "bg-rose-400/10", border: "border-rose-400/40", text: "text-rose-400", glow: "rgba(251, 113, 133, 0.2)" },
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

  // Determine whether to display the value
  const displayValue = position === "A" ? pokemon.stat_value : revealedValue;
  const isHidden = position === "B" && (displayValue === undefined || displayValue === null);

  const artworkSrc = pokemon.artwork_url || pokemon.sprite_url || "/file.svg";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col items-center justify-between w-full max-w-sm rounded-2xl border-2 bg-card/90 p-5 shadow-lg backdrop-blur-xs transition-all ${typeStyle.border}`}
      style={{
        boxShadow: `0 10px 25px -5px ${typeStyle.glow}`,
      }}
    >
      {/* Position Tag (A vs B) */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground font-redaction">
          {position}
        </span>
        {pokemon.form_name && (
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2">
            {pokemon.form_name}
          </Badge>
        )}
      </div>

      {/* Pokémon Types */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {pokemon.types?.map((t) => {
          const tLower = t.toLowerCase();
          const tStyle = TYPE_COLORS[tLower] || TYPE_COLORS.normal;
          return (
            <span
              key={t}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-redaction uppercase border ${tStyle.bg} ${tStyle.border} ${tStyle.text}`}
            >
              {t}
            </span>
          );
        })}
      </div>

      {/* Pokémon Artwork */}
      <div className="relative my-4 flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
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

      {/* Pokémon Name & Info */}
      <div className="flex flex-col items-center gap-1 text-center w-full">
        <h3 className="font-redaction text-2xl font-bold tracking-tight text-foreground line-clamp-1">
          {pokemon.display_name}
        </h3>
        {pokemon.species_id && (
          <span className="text-xs text-muted-foreground font-mono">
            #{String(pokemon.species_id).padStart(4, "0")}
          </span>
        )}
      </div>

      {/* Statistic Section */}
      <div className="mt-4 flex w-full flex-col items-center justify-center rounded-xl bg-secondary/60 p-3.5 border border-border/40">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-redaction">
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
              <HelpCircle className="h-6 w-6 animate-pulse text-primary" />
              <span className="font-redaction text-2xl font-bold tracking-widest">???</span>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex items-baseline gap-1 py-1"
            >
              <span className="font-redaction text-3xl font-extrabold tabular-nums tracking-tight text-primary">
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

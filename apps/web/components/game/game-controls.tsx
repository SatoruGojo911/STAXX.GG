"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Equal } from "lucide-react";
import { GuessAnswer } from "@/types";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  onGuess: (answer: GuessAnswer) => void;
  disabled: boolean;
}

export function GameControls({ onGuess, disabled }: GameControlsProps) {
  // Keyboard event listeners
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "h") {
        e.preventDefault();
        onGuess("higher");
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "l") {
        e.preventDefault();
        onGuess("lower");
      } else if (e.key === "ArrowRight" || e.key === "=" || e.key.toLowerCase() === "e") {
        e.preventDefault();
        onGuess("equal");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGuess, disabled]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md font-redaction">
      <div className="grid grid-cols-3 gap-3 w-full">
        {/* HIGHER Button */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("higher")}
            className="liquid-glass relative flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black shadow-lg transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            <ArrowUp className="h-5 w-5 stroke-[2.5] transition-transform group-hover:-translate-y-0.5" />
            <span className="text-xs tracking-wider uppercase mt-1">HIGHER</span>
            <span className="text-[10px] text-muted-foreground font-mono">[↑ / H]</span>
          </button>
        </motion.div>

        {/* EQUAL Button */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("equal")}
            className="liquid-glass relative flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black shadow-lg transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
            <Equal className="h-5 w-5 stroke-[2.5]" />
            <span className="text-xs tracking-wider uppercase mt-1">EQUAL</span>
            <span className="text-[10px] text-muted-foreground font-mono">[→ / E]</span>
          </button>
        </motion.div>

        {/* LOWER Button */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("lower")}
            className="liquid-glass relative flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black shadow-lg transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
            <ArrowDown className="h-5 w-5 stroke-[2.5] transition-transform group-hover:translate-y-0.5" />
            <span className="text-xs tracking-wider uppercase mt-1">LOWER</span>
            <span className="text-[10px] text-muted-foreground font-mono">[↓ / L]</span>
          </button>
        </motion.div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Predict if the right Pokémon has a higher, lower, or equal stat
      </p>
    </div>
  );
}

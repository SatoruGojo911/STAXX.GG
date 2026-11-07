"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Equal } from "lucide-react";
import { GuessAnswer } from "@/types";

interface GameControlsProps {
  onGuess: (answer: GuessAnswer) => void;
  disabled: boolean;
}

export function GameControls({ onGuess, disabled }: GameControlsProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "h") {
        e.preventDefault();
        onGuess("higher");
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "l") {
        e.preventDefault();
        onGuess("lower");
      } else if (e.key === "ArrowRight" || e.key === "=" || e.key.toLowerCase() === "e" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        onGuess("equal");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGuess, disabled]);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-md font-redaction">
      <div className="grid grid-cols-3 gap-2 w-full">
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("higher")}
            className="relative flex flex-col items-center justify-center h-16 w-full rounded-none bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-700 font-black shadow-none transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5] transition-transform group-hover:-translate-y-0.5" />
            <span className="text-xs tracking-wider uppercase mt-1">Higher</span>
            <span className="text-[10px] text-white/80 font-mono">[↑ / H]</span>
          </button>
        </motion.div>

        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("equal")}
            className="relative flex flex-col items-center justify-center h-16 w-full rounded-none bg-sky-600 text-white hover:bg-sky-500 border border-sky-700 font-black shadow-none transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <Equal className="h-5 w-5 stroke-[2.5]" />
            <span className="text-xs tracking-wider uppercase mt-1">Same</span>
            <span className="text-[10px] text-white/80 font-mono">[→ / S]</span>
          </button>
        </motion.div>

        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("lower")}
            className="relative flex flex-col items-center justify-center h-16 w-full rounded-none bg-rose-600 text-white hover:bg-rose-500 border border-rose-700 font-black shadow-none transition-all disabled:opacity-40 cursor-pointer overflow-hidden group"
          >
            <ArrowDown className="h-5 w-5 stroke-[2.5] transition-transform group-hover:translate-y-0.5" />
            <span className="text-xs tracking-wider uppercase mt-1">Lower</span>
            <span className="text-[10px] text-white/80 font-mono">[↓ / L]</span>
          </button>
        </motion.div>
      </div>

      <p className="hidden text-[11px] text-muted-foreground text-center sm:block">
        Predict if the right Pokémon has a higher, lower, or same stat
      </p>
    </div>
  );
}

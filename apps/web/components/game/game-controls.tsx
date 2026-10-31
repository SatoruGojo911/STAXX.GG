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
        {/* HIGHER */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.96 }}>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("higher")}
            className="flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md transition-all active:shadow-xs disabled:opacity-50"
          >
            <ArrowUp className="h-6 w-6 stroke-[3]" />
            <span className="text-sm tracking-wider uppercase mt-1">HIGHER</span>
            <span className="text-[10px] opacity-75 font-mono">[↑ / H]</span>
          </Button>
        </motion.div>

        {/* EQUAL */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.96 }}>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("equal")}
            className="flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-md transition-all active:shadow-xs disabled:opacity-50"
          >
            <Equal className="h-6 w-6 stroke-[3]" />
            <span className="text-sm tracking-wider uppercase mt-1">EQUAL</span>
            <span className="text-[10px] opacity-75 font-mono">[→ / E]</span>
          </Button>
        </motion.div>

        {/* LOWER */}
        <motion.div whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.96 }}>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => onGuess("lower")}
            className="flex flex-col items-center justify-center h-20 w-full rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md transition-all active:shadow-xs disabled:opacity-50"
          >
            <ArrowDown className="h-6 w-6 stroke-[3]" />
            <span className="text-sm tracking-wider uppercase mt-1">LOWER</span>
            <span className="text-[10px] opacity-75 font-mono">[↓ / L]</span>
          </Button>
        </motion.div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Guess if the right Pokémon has a higher, lower, or equal stat
      </p>
    </div>
  );
}

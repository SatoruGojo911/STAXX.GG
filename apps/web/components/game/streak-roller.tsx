"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { getAuraTier } from "@/lib/aura-config";

interface StreakRollerProps {
  streak: number;
  showPlusOne?: boolean;
}

export function StreakRoller({ streak, showPlusOne }: StreakRollerProps) {
  const [prevStreak, setPrevStreak] = React.useState(streak);
  const [animating, setAnimating] = React.useState(false);
  const tier = getAuraTier(streak);

  React.useEffect(() => {
    if (streak !== prevStreak) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setPrevStreak(streak);
        setAnimating(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [streak, prevStreak]);

  return (
    <div className="fixed top-20 right-4 sm:top-20 sm:right-6 z-40 select-none">
      <div className="relative flex items-center gap-2">
        {/* Floating +1 Pop Notification */}
        <AnimatePresence>
          {(showPlusOne || animating) && streak > 0 && (
            <motion.div
              key={`plus-${streak}`}
              initial={{ opacity: 0, scale: 0.4, y: 15, x: 10 }}
              animate={{ opacity: 1, scale: 1.15, y: -8, x: -6 }}
              exit={{ opacity: 0, scale: 0.8, y: -25 }}
              transition={{ type: "spring", stiffness: 450, damping: 20 }}
              className="absolute -top-3 -left-10 z-50 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 font-redaction text-xs font-black text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)] backdrop-blur-md"
            >
              <span>+1</span>
              <Flame className="h-3 w-3 fill-emerald-400" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uiverse-inspired Tumbler Roller Card */}
        <div
          className="streak-roller-card flex items-center rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md transition-all duration-300"
          style={{
            borderColor: streak > 0 ? `${tier.primaryColor}55` : "rgba(255, 255, 255, 0.08)",
            boxShadow:
              streak > 0
                ? `0 12px 28px -10px rgba(0,0,0,0.8), 0 0 20px ${tier.glowColor}`
                : "0 10px 24px -10px rgba(0,0,0,0.7)",
          }}
        >
          <div className="streak-loader flex items-center font-redaction">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mr-1.5 flex items-center gap-1">
              <Flame
                className="h-3.5 w-3.5 transition-colors"
                style={{
                  color: streak > 0 ? tier.primaryColor : "currentColor",
                  fill: streak > 0 ? tier.primaryColor : "transparent",
                }}
              />
              STAXX
            </span>

            {/* Tumbler Container with Soft Vertical Fade Masks */}
            <div className="streak-words relative h-8 overflow-hidden flex items-center justify-center min-w-[28px]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={streak}
                  initial={{ y: 28, opacity: 0.2, filter: "blur(2px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -28, opacity: 0.2, filter: "blur(2px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 24,
                    mass: 0.7,
                  }}
                  className="streak-word block font-black text-xl tabular-nums tracking-tight leading-none text-center"
                  style={{
                    color: streak > 0 ? tier.primaryColor : "inherit",
                  }}
                >
                  {streak}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

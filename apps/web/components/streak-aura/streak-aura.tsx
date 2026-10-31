"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getAuraTier } from "@/lib/aura-config";
import { AuraParticles } from "./aura-particles";
import { StreakDisplay } from "./streak-display";

interface StreakAuraProps {
  streak: number;
  personalBest?: number;
  isEvolution?: boolean;
}

export function StreakAura({ streak, personalBest = 0, isEvolution = false }: StreakAuraProps) {
  const tier = getAuraTier(streak);
  const shouldReduceMotion = useReducedMotion();
  const [showEvolutionBanner, setShowEvolutionBanner] = React.useState(false);
  const prevTierLevelRef = React.useRef(tier.level);

  // Trigger special evolution animation when crossing into a higher tier
  React.useEffect(() => {
    if (tier.level > prevTierLevelRef.current && tier.level > 0) {
      setShowEvolutionBanner(true);
      const timer = setTimeout(() => setShowEvolutionBanner(false), 2400);
      return () => clearTimeout(timer);
    }
    prevTierLevelRef.current = tier.level;
  }, [tier.level]);

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none">
      {/* Evolution Milestone Announcement Overlay */}
      <AnimatePresence>
        {showEvolutionBanner && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1.05, y: -20 }}
            exit={{ opacity: 0, scale: 1.15, y: -30 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="liquid-glass absolute -top-12 z-50 flex items-center gap-2 rounded-full px-5 py-2 font-redaction text-xs font-black uppercase tracking-widest text-foreground shadow-2xl"
            style={{
              borderColor: tier.primaryColor,
              boxShadow: `0 0 35px ${tier.glowColor}`,
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: tier.primaryColor }} />
            <span>AURA EVOLVED: {tier.name}</span>
            <Sparkles className="h-4 w-4" style={{ color: tier.primaryColor }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Aura Container */}
      <div className="relative flex items-center justify-center p-6">
        {/* Particle Fields */}
        <AuraParticles tier={tier} streak={streak} />

        {/* Outer Liquid Ring (Tier 5+) */}
        {tier.level >= 5 && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 140 + tier.level * 6,
              height: 140 + tier.level * 6,
              border: `1px solid ${tier.primaryColor}`,
              opacity: 0.35,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18 - tier.level, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Soft Liquid Glow Pulsing Ring */}
        {tier.level > 0 && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 110 + tier.level * 4,
              height: 110 + tier.level * 4,
              backgroundColor: tier.glowColor,
              filter: "blur(24px)",
            }}
            animate={{
              scale: [0.95, 1.1, 0.95],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.max(1.4, 2.6 - tier.level * 0.15),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Central Streak Counter Disk - Pure Liquid Frosted Glass */}
        <motion.div
          key={streak}
          initial={shouldReduceMotion ? {} : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="liquid-glass relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full transition-all duration-300"
          style={{
            borderColor: tier.level > 0 ? tier.primaryColor : undefined,
          }}
        >
          {/* Specular Highlight Arc */}
          <div className="pointer-events-none absolute inset-x-3 top-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground font-redaction">
            STREAK
          </span>
          <span
            className="font-redaction text-4xl font-black tabular-nums tracking-tighter"
            style={{ color: tier.level > 0 ? tier.primaryColor : "inherit" }}
          >
            {streak}
          </span>
        </motion.div>
      </div>

      {/* Subtext info & Next milestone */}
      <StreakDisplay streak={streak} personalBest={personalBest} />
    </div>
  );
}

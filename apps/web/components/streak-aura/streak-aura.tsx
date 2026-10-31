"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
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

  // Compute glowing style per tier
  const auraGlowStyle = React.useMemo(() => {
    if (tier.level === 0) return {};
    return {
      boxShadow: `0 0 ${20 + tier.level * 10}px ${tier.glowColor}, inset 0 0 ${10 + tier.level * 4}px ${tier.glowColor}`,
      borderColor: tier.primaryColor,
    };
  }, [tier]);

  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none">
      {/* Evolution Milestone Announcement Overlay */}
      <AnimatePresence>
        {showEvolutionBanner && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1.05, y: -20 }}
            exit={{ opacity: 0, scale: 1.2, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute -top-12 z-50 flex items-center gap-2 rounded-full px-5 py-1.5 font-redaction text-sm font-extrabold uppercase tracking-widest text-white shadow-xl backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${tier.primaryColor}, ${tier.secondaryColor})`,
              boxShadow: `0 0 30px ${tier.glowColor}`,
            }}
          >
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>AURA EVOLVED: {tier.name}!</span>
            <Sparkles className="h-4 w-4 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Aura Container */}
      <div className="relative flex items-center justify-center p-6">
        {/* Particle Fields */}
        <AuraParticles tier={tier} streak={streak} />

        {/* Outer Rotating Energy Ring (Tier 5+) */}
        {tier.level >= 5 && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 140 + tier.level * 6,
              height: 140 + tier.level * 6,
              border: `2px dashed ${tier.secondaryColor}`,
              opacity: 0.5,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 16 - tier.level, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Inner Pulsing Aura Ring */}
        {tier.level > 0 && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 110 + tier.level * 4,
              height: 110 + tier.level * 4,
              backgroundColor: tier.glowColor,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.75, 0.4],
            }}
            transition={{
              duration: Math.max(1.2, 2.4 - tier.level * 0.15),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Central Streak Counter Disk */}
        <motion.div
          key={streak}
          initial={shouldReduceMotion ? {} : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 bg-card/90 backdrop-blur-md transition-all duration-300"
          style={auraGlowStyle}
        >
          <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground font-redaction">
            STREAK
          </span>
          <span
            className="font-redaction text-4xl font-extrabold tabular-nums tracking-tighter"
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

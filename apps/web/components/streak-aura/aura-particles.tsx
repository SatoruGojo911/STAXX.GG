"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AuraTier } from "@/types";

interface AuraParticlesProps {
  tier: AuraTier;
  streak: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export function AuraParticles({ tier, streak }: AuraParticlesProps) {
  const shouldReduceMotion = useReducedMotion();

  // Scale particle count based on tier
  const particleCount = React.useMemo(() => {
    if (shouldReduceMotion) return 0;
    if (tier.level === 0) return 0;
    if (tier.level === 1) return 4;
    if (tier.level === 2) return 8;
    if (tier.level === 3) return 12;
    if (tier.level === 4) return 16;
    if (tier.level === 5) return 22;
    if (tier.level === 6) return 28;
    if (tier.level === 7) return 36;
    return 48; // Godlike
  }, [tier.level, shouldReduceMotion]);

  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 160,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 1.5,
      color: i % 2 === 0 ? tier.primaryColor : tier.secondaryColor,
    }));
  }, [particleCount, tier.primaryColor, tier.secondaryColor]);

  if (particleCount === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.2],
            x: [0, p.x],
            y: [0, p.y - 40],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

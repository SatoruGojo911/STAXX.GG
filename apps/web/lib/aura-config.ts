import { AuraTier } from "@/types";

export const AURA_TIERS: AuraTier[] = [
  {
    level: 0,
    name: "Normal",
    minStreak: 0,
    maxStreak: 0,
    colorName: "neutral",
    primaryColor: "#94a3b8",
    secondaryColor: "#64748b",
    glowColor: "rgba(148, 163, 184, 0.2)",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    description: "Beginning your run",
  },
  {
    level: 1,
    name: "Spark",
    minStreak: 1,
    maxStreak: 4,
    colorName: "amber",
    primaryColor: "#f59e0b",
    secondaryColor: "#d97706",
    glowColor: "rgba(245, 158, 11, 0.35)",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    description: "A gentle glowing outline with soft sparks",
  },
  {
    level: 2,
    name: "Flame",
    minStreak: 5,
    maxStreak: 9,
    colorName: "orange",
    primaryColor: "#f97316",
    secondaryColor: "#ef4444",
    glowColor: "rgba(249, 115, 22, 0.5)",
    badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    description: "Fiery orange and red pulsing flame aura",
  },
  {
    level: 3,
    name: "Supercharged",
    minStreak: 10,
    maxStreak: 19,
    colorName: "cyan-blue",
    primaryColor: "#06b6d4",
    secondaryColor: "#3b82f6",
    glowColor: "rgba(6, 182, 212, 0.6)",
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    description: "Electric blue energy waves and radiant power",
  },
  {
    level: 4,
    name: "Radiant",
    minStreak: 20,
    maxStreak: 34,
    colorName: "gold-purple",
    primaryColor: "#eab308",
    secondaryColor: "#a855f7",
    glowColor: "rgba(234, 179, 8, 0.65)",
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    description: "Multiple layered aura rings with floating gold & purple energy",
  },
  {
    level: 5,
    name: "Ascended",
    minStreak: 35,
    maxStreak: 49,
    colorName: "dragon-purple",
    primaryColor: "#9333ea",
    secondaryColor: "#4f46e5",
    glowColor: "rgba(147, 51, 234, 0.75)",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    description: "Intense dragon-inspired aura with rotating outer ring",
  },
  {
    level: 6,
    name: "Legendary",
    minStreak: 50,
    maxStreak: 74,
    colorName: "legendary-gold",
    primaryColor: "#fbbf24",
    secondaryColor: "#06b6d4",
    glowColor: "rgba(251, 191, 36, 0.8)",
    badgeClass: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    description: "Bright gold, cyan and violet layered aura with glowing trails",
  },
  {
    level: 7,
    name: "Mythical",
    minStreak: 75,
    maxStreak: 99,
    colorName: "mythic-magenta",
    primaryColor: "#ec4899",
    secondaryColor: "#8b5cf6",
    glowColor: "rgba(236, 72, 153, 0.85)",
    badgeClass: "bg-pink-500/20 text-pink-400 border-pink-500/40",
    description: "Multicoloured evolving mythical energy and particle fields",
  },
  {
    level: 8,
    name: "Godlike",
    minStreak: 100,
    maxStreak: null,
    colorName: "godlike-rainbow",
    primaryColor: "#ffd700",
    secondaryColor: "#7c3aed",
    glowColor: "rgba(255, 215, 0, 0.95)",
    badgeClass: "bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-cyan-500/20 text-yellow-300 border-yellow-400/50",
    description: "The ultimate evolving aura. Pure mastery of the statistics.",
  },
];

export function getAuraTier(streak: number): AuraTier {
  if (streak <= 0) return AURA_TIERS[0];
  for (let i = AURA_TIERS.length - 1; i >= 0; i--) {
    if (streak >= AURA_TIERS[i].minStreak) {
      return AURA_TIERS[i];
    }
  }
  return AURA_TIERS[0];
}

export function getNextMilestone(streak: number): { nextTier: AuraTier | null; needed: number; progress: number } {
  const currentTier = getAuraTier(streak);
  const nextTierIndex = currentTier.level + 1;

  if (nextTierIndex >= AURA_TIERS.length) {
    return { nextTier: null, needed: 0, progress: 100 };
  }

  const nextTier = AURA_TIERS[nextTierIndex];
  const target = nextTier.minStreak;
  const currentBase = currentTier.minStreak;
  const needed = Math.max(0, target - streak);
  const range = target - currentBase;
  const progress = Math.min(100, Math.max(0, Math.round(((streak - currentBase) / range) * 100)));

  return { nextTier, needed, progress };
}

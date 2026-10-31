import { AuraTier } from "@/types";

export const AURA_TIERS: AuraTier[] = [
  {
    level: 0,
    name: "Normal",
    minStreak: 0,
    maxStreak: 0,
    colorName: "neutral",
    primaryColor: "#a1a1aa",
    secondaryColor: "#71717a",
    glowColor: "rgba(161, 161, 170, 0.2)",
    badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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
    glowColor: "rgba(249, 115, 22, 0.45)",
    badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    description: "Fiery orange and ember pulse aura",
  },
  {
    level: 3,
    name: "Supercharged",
    minStreak: 10,
    maxStreak: 19,
    colorName: "electric-cyan",
    primaryColor: "#06b6d4",
    secondaryColor: "#0284c7",
    glowColor: "rgba(6, 182, 212, 0.5)",
    badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    description: "Electric ice-blue energy waves and radiant power",
  },
  {
    level: 4,
    name: "Radiant",
    minStreak: 20,
    maxStreak: 34,
    colorName: "sun-gold",
    primaryColor: "#eab308",
    secondaryColor: "#f59e0b",
    glowColor: "rgba(234, 179, 8, 0.55)",
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    description: "Layered aura rings with radiant gold energy",
  },
  {
    level: 5,
    name: "Ascended",
    minStreak: 35,
    maxStreak: 49,
    colorName: "sapphire-blue",
    primaryColor: "#2563eb",
    secondaryColor: "#0284c7",
    glowColor: "rgba(37, 99, 235, 0.6)",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    description: "Deep sapphire energy arcs with rotating outer ring",
  },
  {
    level: 6,
    name: "Legendary",
    minStreak: 50,
    maxStreak: 74,
    colorName: "legendary-platinum",
    primaryColor: "#38bdf8",
    secondaryColor: "#fbbf24",
    glowColor: "rgba(56, 189, 248, 0.65)",
    badgeClass: "bg-sky-400/20 text-sky-300 border-sky-400/40",
    description: "Bright platinum, cyan, and amber layered aura",
  },
  {
    level: 7,
    name: "Mythical",
    minStreak: 75,
    maxStreak: 99,
    colorName: "aurora-emerald",
    primaryColor: "#10b981",
    secondaryColor: "#06b6d4",
    glowColor: "rgba(16, 185, 129, 0.7)",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description: "Ethereal emerald and northern aurora energy fields",
  },
  {
    level: 8,
    name: "Godlike",
    minStreak: 100,
    maxStreak: null,
    colorName: "liquid-diamond",
    primaryColor: "#ffffff",
    secondaryColor: "#38bdf8",
    glowColor: "rgba(255, 255, 255, 0.8)",
    badgeClass: "bg-white/20 text-white border-white/40",
    description: "The ultimate liquid diamond and chrome aura. Complete mastery.",
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

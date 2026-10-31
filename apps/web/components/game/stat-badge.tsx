"use client";

import * as React from "react";
import { Heart, Swords, Shield, Zap, Wind, Scale, Ruler, Sparkles, BarChart3 } from "lucide-react";
import { StatCategory } from "@/types";

interface StatBadgeProps {
  category: StatCategory | string;
  unit?: string;
  label?: string;
}

const STAT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  hp: { label: "HP", icon: Heart, color: "#ef4444", bg: "bg-red-500/10 text-red-400 border-red-500/20" },
  attack: { label: "Attack", icon: Swords, color: "#f97316", bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  defence: { label: "Defence", icon: Shield, color: "#eab308", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  special_attack: { label: "Special Attack", icon: Zap, color: "#38bdf8", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  special_defence: { label: "Special Defence", icon: Shield, color: "#0ea5e9", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  speed: { label: "Speed", icon: Wind, color: "#06b6d4", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  bst: { label: "Base Stat Total (BST)", icon: BarChart3, color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  height: { label: "Height", icon: Ruler, color: "#10b981", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  weight: { label: "Weight", icon: Scale, color: "#94a3b8", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export function StatBadge({ category, unit, label }: StatBadgeProps) {
  const key = category.toLowerCase();
  const config = STAT_CONFIG[key] || {
    label: label || category,
    icon: Sparkles,
    color: "#a1a1aa",
    bg: "bg-secondary text-foreground border-border",
  };

  const Icon = config.icon;

  return (
    <div className={`liquid-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-redaction font-bold uppercase tracking-wider ${config.bg}`}>
      <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
      <span>{label || config.label}</span>
      {unit && <span className="text-[11px] lowercase opacity-75">({unit})</span>}
    </div>
  );
}

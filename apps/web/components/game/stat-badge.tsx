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
  hp: { label: "HP", icon: Heart, color: "#ef4444", bg: "bg-red-500/15 text-red-500 border-red-500/30" },
  attack: { label: "Attack", icon: Swords, color: "#f97316", bg: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
  defence: { label: "Defence", icon: Shield, color: "#eab308", bg: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  special_attack: { label: "Special Attack", icon: Zap, color: "#3b82f6", bg: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  special_defence: { label: "Special Defence", icon: Sparkles, color: "#8b5cf6", bg: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
  speed: { label: "Speed", icon: Wind, color: "#06b6d4", bg: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30" },
  bst: { label: "Base Stat Total (BST)", icon: BarChart3, color: "#a855f7", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  height: { label: "Height", icon: Ruler, color: "#10b981", bg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  weight: { label: "Weight", icon: Scale, color: "#64748b", bg: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

export function StatBadge({ category, unit, label }: StatBadgeProps) {
  const key = category.toLowerCase();
  const config = STAT_CONFIG[key] || {
    label: label || category,
    icon: Sparkles,
    color: "#94a3b8",
    bg: "bg-secondary text-foreground border-border",
  };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-redaction font-bold uppercase tracking-wider shadow-xs ${config.bg}`}>
      <Icon className="h-4 w-4" style={{ color: config.color }} />
      <span>{label || config.label}</span>
      {unit && <span className="text-xs lowercase text-muted-foreground">({unit})</span>}
    </div>
  );
}

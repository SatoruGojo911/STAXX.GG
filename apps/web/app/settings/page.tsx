"use client";

import * as React from "react";
import { Settings, Moon, Sun, Monitor, Volume2, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [animationsEnabled, setAnimationsEnabled] = React.useState(true);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl font-redaction">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card/80 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Theme & Appearance</h2>
          <p className="text-xs text-muted-foreground">Select your preferred color theme.</p>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex items-center gap-2 h-11 font-bold rounded-xl"
            >
              <Sun className="h-4 w-4" /> Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex items-center gap-2 h-11 font-bold rounded-xl"
            >
              <Moon className="h-4 w-4" /> Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="flex items-center gap-2 h-11 font-bold rounded-xl"
            >
              <Monitor className="h-4 w-4" /> System
            </Button>
          </div>
        </div>

        {/* Gameplay Preferences */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card/80 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Gameplay Preferences</h2>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Aura Particles & Animations</span>
              <span className="text-xs text-muted-foreground">Enable rich visual effects and tier particles</span>
            </div>
            <Button
              variant={animationsEnabled ? "default" : "outline"}
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              size="sm"
              className="font-bold rounded-xl"
            >
              {animationsEnabled ? "Enabled" : "Reduced"}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Sound Effects</span>
              <span className="text-xs text-muted-foreground">Audio cues for guess results & milestone evolutions</span>
            </div>
            <Button
              variant={soundEnabled ? "default" : "outline"}
              onClick={() => setSoundEnabled(!soundEnabled)}
              size="sm"
              className="font-bold rounded-xl"
            >
              {soundEnabled ? "Enabled" : "Muted"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

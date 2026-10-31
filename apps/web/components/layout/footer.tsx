import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/60 py-8 px-4 sm:px-6 transition-colors">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-redaction text-lg font-bold tracking-tight text-foreground">
              staxx<span className="text-primary">.</span>gg
            </span>
            <span className="text-xs text-muted-foreground">• PLAY. GUESS. STAXX.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A Pokémon Higher or Lower game platform. Built with Next.js, FastAPI, MongoDB & Redis.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-redaction text-xs text-muted-foreground">
          <Link href="/how-to-play" className="hover:text-foreground transition-colors">
            Rules & Auras
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">
            Leaderboards
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

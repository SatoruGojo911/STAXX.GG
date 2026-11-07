"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/play" || pathname === "/abilities") {
    return null;
  }

  return (
    <footer className="w-full border-t border-border bg-secondary/35 py-8 px-4 sm:px-6 transition-colors">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-redaction text-lg font-bold tracking-tight text-foreground">
              staxx<span className="text-primary">.</span>gg
            </span>
            <span className="text-xs text-muted-foreground">• PLAY. GUESS. STAXX.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Higher or Lower and Guess the Pokémon for trainers who trust their instincts.
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

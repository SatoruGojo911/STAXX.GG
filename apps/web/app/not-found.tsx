"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Swords, Sparkles, Ghost, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 font-redaction min-h-[calc(100vh-16rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center text-center max-w-lg w-full"
      >
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl" />

        {/* Thematic Badge */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.08, 1] }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/80 border border-border/60 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md"
        >
          <Ghost className="h-10 w-10 text-primary animate-pulse" />
        </motion.div>

        {/* 404 Header */}
        <p className="display-kicker text-primary font-bold">404 Error — Out of Bounds</p>
        <h1 className="mt-2 text-6xl sm:text-7xl font-black tracking-tight text-foreground">
          A WILD 404<br />APPEARED!
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
          The Pokémon or page you are looking for has fled into the tall grass. It looks like this route fainted.
        </p>

        {/* Quick Navigation Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className:
                "w-full sm:w-auto h-12 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2",
            })}
          >
            <Home className="h-4 w-4" /> Return Home
          </Link>

          <Link
            href="/play"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className:
                "w-full sm:w-auto h-12 rounded-2xl bg-card/80 border-border/80 px-6 text-sm font-bold text-foreground shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2",
            })}
          >
            <Swords className="h-4 w-4 text-primary" /> Play Higher or Lower
          </Link>
        </div>

        {/* Mini Link back to Abilities Mode */}
        <Link
          href="/abilities"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Try Guess the Pokémon</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  );
}

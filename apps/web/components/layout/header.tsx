"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Swords,
  Trophy,
  BookOpen,
  Sparkles,
  Flame,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GoogleSignInModal } from "@/components/auth/google-sign-in-modal";

type PanelId = "play" | "user";

const playLinks = [
  { href: "/play", label: "Higher or Lower", icon: ArrowUpDown },
  { href: "/abilities", label: "Guess the Pokémon", icon: Sparkles },
];

const navBtn = (active: boolean) =>
  `flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium outline-none transition-colors ${
    active
      ? "bg-secondary/70 font-bold text-foreground"
      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
  }`;

const panelLink =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 md:min-w-64";

export function Header() {
  const pathname = usePathname();
  const headerRef = React.useRef<HTMLElement>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Expanding panel state. `panel` is kept after closing so the content
  // stays visible while the header animates shut.
  const [open, setOpen] = React.useState(false);
  const [panel, setPanel] = React.useState<PanelId>("play");

  const togglePanel = (id: PanelId) => {
    setMobileMenuOpen(false);
    if (open && panel === id) {
      setOpen(false);
    } else {
      setPanel(id);
      setOpen(true);
    }
  };

  React.useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch {
        // guest or logged out
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Close on route change
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    window.location.href = "/";
  };

  const playActive = playLinks.some((link) => pathname === link.href);
  const navLinks = [
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/how-to-play", label: "How to Play", icon: BookOpen },
  ];

  const playOpen = open && panel === "play";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-colors"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-redaction text-2xl font-bold tracking-[-0.06em] text-foreground transition-colors group-hover:text-primary">
            STAXX
            <span className="text-primary transition-colors group-hover:text-amber-500">
              .
            </span>
            GG
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-1 font-redaction">
          <button
            type="button"
            onClick={() => togglePanel("play")}
            aria-expanded={playOpen}
            aria-controls="header-panel"
            className={`${navBtn(playActive || playOpen)} flex items-center justify-center`}
          >
            <Swords
              className={`h-4 w-4 ${playActive || playOpen ? "text-primary" : "text-muted-foreground"}`}
            />
            Play
            <ChevronDown
              className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${
                playOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${navBtn(isActive)} flex items-center justify-center`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!loading && user ? (
            <button
              type="button"
              onClick={() => togglePanel("user")}
              aria-expanded={open && panel === "user"}
              aria-controls="header-panel"
              aria-label="Account menu"
              className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full p-0 ring-1 ring-border outline-none transition-shadow hover:ring-primary"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatar_url || ""}
                  alt={user.display_name}
                />
                <AvatarFallback className="bg-primary font-redaction text-xs font-bold uppercase text-primary-foreground">
                  {user.display_name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <GoogleSignInModal
                currentUser={null}
                onSuccess={(u) => setUser(u)}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex h-9 rounded-xl font-redaction font-bold text-xs"
                  >
                    Sign In
                  </Button>
                }
              />
              <Link
                href="/play"
                className={buttonVariants({
                  size: "sm",
                  className:
                    "flex h-9 items-center rounded-xl bg-primary px-4 font-redaction font-bold text-primary-foreground hover:bg-primary/90",
                })}
              >
                Play Now
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => {
              setOpen(false);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanding panel: the header itself grows to hold the menu */}
      <div
        id="header-panel"
        className={`grid transition-[grid-template-rows,visibility] duration-200 ease-out ${
          open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="container mx-auto px-4 pb-4 pt-1 font-redaction sm:px-6">
            {panel === "play" && (
              <div className="flex flex-col gap-1 md:flex-row md:gap-2">
                {playLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`${panelLink} ${isActive ? "bg-secondary/50" : ""}`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={isActive ? "font-bold" : ""}>
                        {link.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {panel === "user" && user && (
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-end md:gap-2">
                <div className="px-3 py-2 md:mr-auto md:px-0">
                  <p className="text-sm font-bold leading-none">
                    {user.display_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.account_type === "guest"
                      ? "Guest Trainer"
                      : user.email || "Trainer"}
                  </p>
                </div>
                <Link
                  href={`/profile/${encodeURIComponent(user.username || user.display_name)}`}
                  onClick={() => setOpen(false)}
                  className={`${panelLink} md:min-w-0`}
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Profile & Stats
                </Link>
                {user.account_type === "guest" && (
                  <GoogleSignInModal
                    currentUser={user}
                    onSuccess={(u) => setUser(u)}
                    trigger={
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className={`${panelLink} font-bold text-primary md:min-w-0`}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                        Link Google
                      </button>
                    }
                  />
                )}
                <Link
                  href="/play"
                  onClick={() => setOpen(false)}
                  className={`${panelLink} md:min-w-0`}
                >
                  <Swords className="h-4 w-4 text-muted-foreground" />
                  Resume Run
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${panelLink} cursor-pointer text-destructive md:min-w-0`}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="space-y-2 border-t border-border/40 px-4 py-4 md:hidden">
          <p className="px-3 pt-1 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            Play
          </p>
          {playLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-redaction text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary/70 font-bold text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-redaction text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary/70 font-bold text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

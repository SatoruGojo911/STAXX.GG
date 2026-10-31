"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, BookOpen, Flame, User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, getStoredToken } from "@/lib/api";
import { User } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/play", label: "Play", icon: Swords },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/how-to-play", label: "How to Play", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 liquid-glass transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-redaction text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            staxx<span className="text-primary group-hover:text-amber-500 transition-colors">.</span>gg
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <Flame className="h-3 w-3 fill-primary" /> BETA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 font-redaction">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-secondary text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User profile / Guest status */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full ring-1 ring-border p-0 inline-flex items-center justify-center cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || ""} alt={user.display_name} />
                  <AvatarFallback className="font-redaction text-xs font-bold uppercase bg-primary text-primary-foreground">
                    {user.display_name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-redaction">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.account_type === "guest" ? "Guest Trainer" : user.email || "Trainer"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={`/profile/${encodeURIComponent(user.username || user.display_name)}`} className="flex items-center gap-2 w-full">
                    <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile & Stats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/play" className="flex items-center gap-2 w-full">
                    <Swords className="h-4 w-4 text-muted-foreground" /> Resume Run
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/play"
              className={buttonVariants({
                size: "sm",
                className: "font-redaction font-bold h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center",
              })}
            >
              Play Now
            </Link>
          )}

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-md px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-redaction font-medium transition-colors ${
                  isActive ? "bg-secondary text-primary font-bold" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
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

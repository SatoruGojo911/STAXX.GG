"use client";

import * as React from "react";
import { Loader2, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { User } from "@/types";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInModalProps {
  currentUser?: User | null;
  onSuccess?: (user: User) => void;
  trigger?: React.ReactNode;
}

export function GoogleSignInModal({
  currentUser,
  onSuccess,
  trigger,
}: GoogleSignInModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isGuest = currentUser?.account_type === "guest";

  const handleCredentialResponse = React.useCallback(
    async (response: any) => {
      try {
        setLoading(true);
        setError(null);
        let user: User;
        if (isGuest) {
          user = await api.claimGuest(response.credential);
        } else {
          user = await api.loginGoogle(response.credential);
        }
        setOpen(false);
        if (onSuccess) {
          onSuccess(user);
        } else {
          window.location.reload();
        }
      } catch (err: any) {
        setError(err?.message || "Google authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [isGuest, onSuccess]
  );

  // Initialize official Google Identity Services (GIS) if client ID is set
  React.useEffect(() => {
    if (!open || !clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: isGuest ? "continue_with" : "signin_with",
          shape: "pill",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // cleanup script if needed
    };
  }, [open, clientId, isGuest, handleCredentialResponse]);

  // Demo sign-in for testing/development
  async function handleDemoGoogleSignIn() {
    try {
      setLoading(true);
      setError(null);
      const mockToken = "mock_google_token_ash";
      let user: User;
      if (isGuest) {
        user = await api.claimGuest(mockToken);
      } else {
        user = await api.loginGoogle(mockToken);
      }
      setOpen(false);
      if (onSuccess) {
        onSuccess(user);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message || "Demo sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ? (trigger as any) : undefined}>
        {!trigger && (
          <Button
            variant="default"
            size="sm"
            className="rounded-xl font-redaction font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isGuest ? "Save Profile (Google)" : "Sign In with Google"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md p-6 font-redaction bg-card/95 backdrop-blur-xl border-border/80 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black text-foreground">
            {isGuest ? "Link Your Google Account" : "Sign In to STAXX.GG"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {isGuest
              ? "Keep your best streaks, rank on global leaderboards, and access your profile anywhere."
              : "Track your personal bests, earn evolving aura tiers, and climb the leaderboard."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col items-center gap-4">
          {error && (
            <div className="w-full rounded-xl bg-destructive/15 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
              {error}
            </div>
          )}

          {/* Real Google GIS Container */}
          {clientId && (
            <div ref={googleBtnRef} className="flex min-h-[44px] justify-center items-center" />
          )}

          {/* Fallback / Instant Demo Login for Testing */}
          <button
            type="button"
            disabled={loading}
            onClick={handleDemoGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-secondary/80 py-3.5 px-4 text-sm font-bold text-foreground shadow-md transition-all hover:bg-secondary active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isGuest ? "Link via Google (One-Click Test)" : "Sign In with Google (One-Click Test)"}
            </span>
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            STAXX uses secure HTTP-only session cookies and official Google OAuth 2.0 tokens.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

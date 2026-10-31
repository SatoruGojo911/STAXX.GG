export const metadata = {
  title: "Terms of Service — staxx.gg",
  description: "Terms and conditions of using staxx.gg.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl font-redaction space-y-6">
      <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          By accessing and playing staxx.gg, you agree to abide by these terms of service, fair play policies, and anti-cheat regulations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Fair Play & Anti-Cheat</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Players are prohibited from using bots, automated scripts, replay attacks, or exploiting client/network anomalies to fabricate streak scores. We reserve the right to remove unverified or flagged scores from the public leaderboards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Service Availability</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          staxx.gg is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We strive to maintain continuous uptime but do not guarantee uninterrupted access.
        </p>
      </section>
    </div>
  );
}

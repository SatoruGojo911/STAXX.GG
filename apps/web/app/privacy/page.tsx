export const metadata = {
  title: "Privacy Policy — staxx.gg",
  description: "Privacy policy and data retention practices for staxx.gg.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl font-redaction space-y-6">
      <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          staxx.gg allows guests to play without creating an account. For guest players, we assign a temporary session token stored in an HTTP-only cookie. For players who sign in via Google OAuth, we receive your public name, email address, profile avatar, and unique Google subject ID to maintain your persistent streak records and leaderboard standing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Game Data & Anti-Cheat</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We record game round timestamps, selected statistics, and submitted guesses to audit high-streak authenticity and maintain the integrity of our global leaderboards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Pokémon Intellectual Property</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pokémon and Pokémon character names and images are trademarks of Nintendo, Creatures Inc., and Game Freak. staxx.gg is an unofficial fan project and is not affiliated with or endorsed by Nintendo or The Pokémon Company.
        </p>
      </section>
    </div>
  );
}

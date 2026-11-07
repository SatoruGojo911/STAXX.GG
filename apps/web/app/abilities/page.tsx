import { AbilityGameBoard } from "@/components/game/ability-game-board";

export const metadata = { title: "Guess the Pokémon — staxx.gg", description: "Identify Pokémon from their full ability set and build a Guess the Pokémon streak." };

export default function AbilityModePage() {
  return <div className="flex flex-1 flex-col items-center justify-center px-4 py-2"><AbilityGameBoard /></div>;
}

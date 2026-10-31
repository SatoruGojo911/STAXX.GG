import { GameBoard } from "@/components/game/game-board";

export const metadata = {
  title: "Play — staxx.gg",
  description: "Play Pokémon Higher or Lower. Guess whether the next Pokémon stat is higher, lower, or equal.",
};

export default function PlayPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <GameBoard />
    </div>
  );
}

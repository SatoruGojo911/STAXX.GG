#!/usr/bin/env python3
"""
STAXX.GG — Database Seeder
============================
Seeds MongoDB with test data for development: users, game sessions,
rounds, and player_stats.

Usage:
    python seed_database.py
    python seed_database.py --clean     # Drop existing test data first
    python seed_database.py --verbose
"""

import argparse
import asyncio
import hashlib
import logging
import os
import random
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/staxx")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "staxx")

logger = logging.getLogger("staxx.seeder")

# ---------------------------------------------------------------------------
# Test data definitions
# ---------------------------------------------------------------------------

TEST_USERS = [
    {
        "google_id": "test_google_001",
        "email": "ash@pokemon-trainer.test",
        "display_name": "Ash Ketchum",
        "avatar_url": "https://i.pravatar.cc/150?u=ash",
    },
    {
        "google_id": "test_google_002",
        "email": "misty@pokemon-trainer.test",
        "display_name": "Misty Waterflower",
        "avatar_url": "https://i.pravatar.cc/150?u=misty",
    },
    {
        "google_id": "test_google_003",
        "email": "brock@pokemon-trainer.test",
        "display_name": "Brock Harrison",
        "avatar_url": "https://i.pravatar.cc/150?u=brock",
    },
    {
        "google_id": "test_google_004",
        "email": "gary@pokemon-trainer.test",
        "display_name": "Gary Oak",
        "avatar_url": "https://i.pravatar.cc/150?u=gary",
    },
    {
        "google_id": "test_google_005",
        "email": "cynthia@pokemon-trainer.test",
        "display_name": "Cynthia Shirona",
        "avatar_url": "https://i.pravatar.cc/150?u=cynthia",
    },
]

# Some well-known Pokémon for generating test rounds
SAMPLE_POKEMON = [
    {"canonical_id": "pikachu", "display_name": "Pikachu", "bst": 320, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"},
    {"canonical_id": "charizard", "display_name": "Charizard", "bst": 534, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png"},
    {"canonical_id": "mewtwo", "display_name": "Mewtwo", "bst": 680, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png"},
    {"canonical_id": "snorlax", "display_name": "Snorlax", "bst": 540, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png"},
    {"canonical_id": "gengar", "display_name": "Gengar", "bst": 500, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png"},
    {"canonical_id": "garchomp", "display_name": "Garchomp", "bst": 600, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png"},
    {"canonical_id": "lucario", "display_name": "Lucario", "bst": 525, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png"},
    {"canonical_id": "eevee", "display_name": "Eevee", "bst": 325, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"},
    {"canonical_id": "dragonite", "display_name": "Dragonite", "bst": 600, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png"},
    {"canonical_id": "blastoise", "display_name": "Blastoise", "bst": 530, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png"},
    {"canonical_id": "alakazam", "display_name": "Alakazam", "bst": 500, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png"},
    {"canonical_id": "magikarp", "display_name": "Magikarp", "bst": 200, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/129.png"},
    {"canonical_id": "gyarados", "display_name": "Gyarados", "bst": 540, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png"},
    {"canonical_id": "tyranitar", "display_name": "Tyranitar", "bst": 600, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png"},
    {"canonical_id": "rayquaza", "display_name": "Rayquaza", "bst": 680, "artwork_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png"},
]


# ---------------------------------------------------------------------------
# Seeder
# ---------------------------------------------------------------------------

class DatabaseSeeder:
    """Seeds the database with test data."""

    def __init__(self, clean: bool = False):
        self.clean = clean
        self.user_ids: list[ObjectId] = []
        self.session_count = 0
        self.round_count = 0
        self.stats_count = 0

    async def run(self) -> None:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[MONGODB_DATABASE]

        try:
            await db.command("ping")
            logger.info("MongoDB connected")

            if self.clean:
                await self._clean(db)

            await self._seed_users(db)
            await self._seed_game_sessions(db)
            await self._seed_player_stats(db)

        finally:
            client.close()

        self._print_report()

    async def _clean(self, db: Any) -> None:
        """Remove test data based on known test markers."""
        logger.info("Cleaning existing test data...")

        # Remove test users
        result = await db.users.delete_many(
            {"google_id": {"$regex": "^test_google_"}}
        )
        logger.info("Removed %d test users", result.deleted_count)

        # Remove game sessions for test users
        result = await db.game_sessions.delete_many(
            {"_metadata.is_test": True}
        )
        logger.info("Removed %d test game sessions", result.deleted_count)

        # Remove player_stats for test users
        result = await db.player_stats.delete_many(
            {"_metadata.is_test": True}
        )
        logger.info("Removed %d test player_stats", result.deleted_count)

    async def _seed_users(self, db: Any) -> None:
        """Create test user accounts."""
        logger.info("Seeding users...")
        now = datetime.now(timezone.utc)

        for user_data in TEST_USERS:
            # Check if user already exists
            existing = await db.users.find_one({"google_id": user_data["google_id"]})
            if existing:
                self.user_ids.append(existing["_id"])
                logger.debug("User already exists: %s", user_data["display_name"])
                continue

            doc = {
                **user_data,
                "created_at": now - timedelta(days=random.randint(1, 90)),
                "last_login": now - timedelta(hours=random.randint(0, 48)),
                "is_banned": False,
                "_metadata": {"is_test": True},
            }
            result = await db.users.insert_one(doc)
            self.user_ids.append(result.inserted_id)
            logger.info("Created user: %s", user_data["display_name"])

    async def _seed_game_sessions(self, db: Any) -> None:
        """Create game sessions with rounds for each test user."""
        logger.info("Seeding game sessions...")
        now = datetime.now(timezone.utc)

        for idx, user_id in enumerate(self.user_ids):
            # Each user gets 3-8 game sessions spread over recent days
            num_sessions = random.randint(3, 8)

            for s in range(num_sessions):
                session_time = now - timedelta(
                    days=random.randint(0, 14),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                )

                # Generate rounds
                rounds, score = self._generate_rounds(session_time)

                session_doc = {
                    "user_id": user_id,
                    "status": "completed",
                    "score": score,
                    "rounds": rounds,
                    "comparison_stat": "bst",
                    "started_at": session_time,
                    "completed_at": session_time + timedelta(minutes=random.randint(1, 10)),
                    "_metadata": {"is_test": True},
                }

                await db.game_sessions.insert_one(session_doc)
                self.session_count += 1
                self.round_count += len(rounds)

        logger.info(
            "Created %d sessions with %d total rounds",
            self.session_count, self.round_count,
        )

    def _generate_rounds(self, base_time: datetime) -> tuple[list[dict], int]:
        """
        Generate a sequence of rounds for a game session.
        Returns (rounds_list, final_score).
        """
        rounds: list[dict] = []
        score = 0
        available = list(SAMPLE_POKEMON)

        # Pick a starting Pokémon
        current = random.choice(available)
        num_rounds = random.randint(3, 15)

        for r in range(num_rounds):
            # Pick a challenger (different from current)
            challenger_pool = [p for p in available if p["canonical_id"] != current["canonical_id"]]
            if not challenger_pool:
                break
            challenger = random.choice(challenger_pool)

            # Determine correct answer
            if challenger["bst"] > current["bst"]:
                correct = "higher"
            elif challenger["bst"] < current["bst"]:
                correct = "lower"
            else:
                correct = random.choice(["higher", "lower"])

            # Simulate player guess (correct ~65% of the time for realistic data)
            if random.random() < 0.65:
                guess = correct
                is_correct = True
                score += 1
            else:
                guess = "lower" if correct == "higher" else "higher"
                is_correct = False

            round_doc = {
                "round_number": r + 1,
                "pokemon_shown": {
                    "canonical_id": current["canonical_id"],
                    "display_name": current["display_name"],
                    "bst": current["bst"],
                    "artwork_url": current["artwork_url"],
                },
                "pokemon_challenger": {
                    "canonical_id": challenger["canonical_id"],
                    "display_name": challenger["display_name"],
                    "bst": challenger["bst"],
                    "artwork_url": challenger["artwork_url"],
                },
                "player_guess": guess,
                "correct_answer": correct,
                "is_correct": is_correct,
                "answered_at": base_time + timedelta(seconds=r * random.randint(3, 15)),
            }
            rounds.append(round_doc)

            if not is_correct:
                # Game over on wrong answer
                break

            # Move to next
            current = challenger

        return rounds, score

    async def _seed_player_stats(self, db: Any) -> None:
        """Create or update player_stats aggregates for test users."""
        logger.info("Seeding player stats...")
        now = datetime.now(timezone.utc)

        for user_id in self.user_ids:
            # Aggregate from seeded sessions
            pipeline = [
                {"$match": {"user_id": user_id, "status": "completed"}},
                {
                    "$group": {
                        "_id": "$user_id",
                        "total_games": {"$sum": 1},
                        "best_score": {"$max": "$score"},
                        "total_score": {"$sum": "$score"},
                        "avg_score": {"$avg": "$score"},
                        "first_game": {"$min": "$started_at"},
                        "last_game": {"$max": "$completed_at"},
                    }
                },
            ]

            db_ref = db  # type: ignore
            results = await db_ref.game_sessions.aggregate(pipeline).to_list(1)

            if not results:
                continue

            agg = results[0]
            stats_doc = {
                "user_id": user_id,
                "total_games": agg["total_games"],
                "best_score": agg["best_score"],
                "total_score": agg["total_score"],
                "average_score": round(agg["avg_score"], 2),
                "first_game_at": agg["first_game"],
                "last_game_at": agg["last_game"],
                "current_streak": random.randint(0, 5),
                "best_streak": random.randint(3, 10),
                "updated_at": now,
                "_metadata": {"is_test": True},
            }

            await db_ref.player_stats.update_one(
                {"user_id": user_id},
                {"$set": stats_doc},
                upsert=True,
            )
            self.stats_count += 1
            logger.debug("Updated stats for user %s", user_id)

        logger.info("Seeded %d player_stats entries", self.stats_count)

    def _print_report(self) -> None:
        print("\n" + "=" * 60)
        print("  STAXX.GG — Database Seed Report")
        print("=" * 60)
        print(f"  Users created:        {len(self.user_ids)}")
        print(f"  Game sessions:        {self.session_count}")
        print(f"  Total rounds:         {self.round_count}")
        print(f"  Player stats:         {self.stats_count}")
        print()
        print("  Test users:")
        for u in TEST_USERS:
            print(f"    - {u['display_name']} ({u['email']})")
        print("=" * 60 + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="STAXX.GG — Seed database with test data",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Remove existing test data before seeding",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    seeder = DatabaseSeeder(clean=args.clean)
    asyncio.run(seeder.run())


if __name__ == "__main__":
    main()

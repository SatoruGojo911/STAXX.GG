#!/usr/bin/env python3
"""
STAXX.GG - Pokémon Data Importer
=================================
Imports all Pokémon data from PokéAPI into MongoDB.

Handles all form types: standard, mega, primal, gmax, regional variants,
battle forms, and other alternate forms. Uses async I/O for efficient
parallel fetching with rate limiting and exponential backoff.

Usage:
    python import_pokemon.py --mode full --concurrency 10
    python import_pokemon.py --mode rebuild --species-limit 50 --verbose
"""

import argparse
import asyncio
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import aiohttp
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne, IndexModel, ASCENDING

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/staxx")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "staxx")
POKEAPI_BASE_URL = os.getenv("POKEAPI_BASE_URL", "https://pokeapi.co/api/v2").rstrip("/")
DATA_VERSION = int(os.getenv("DATA_VERSION", "1"))

COLLECTION_NAME = "pokemon"

# Rate-limit: token-bucket parameters
RATE_LIMIT_PER_SECOND = 50

# Retry / back-off
MAX_RETRIES = 3
BACKOFF_BASE = 1.0  # seconds
BACKOFF_MAX = 30.0  # seconds

logger = logging.getLogger("staxx.importer")


# ---------------------------------------------------------------------------
# Form classification helpers
# ---------------------------------------------------------------------------

FORM_SUFFIXES: list[tuple[str, str, str]] = [
    # (suffix, category, display_prefix_or_template)
    ("-mega-x", "mega", "Mega {species} X"),
    ("-mega-y", "mega", "Mega {species} Y"),
    ("-mega", "mega", "Mega {species}"),
    ("-primal", "primal", "Primal {species}"),
    ("-gmax", "gmax", "Gigantamax {species}"),
    ("-alola", "alolan", "Alolan {species}"),
    ("-galar", "galarian", "Galarian {species}"),
    ("-hisui", "hisuian", "Hisuian {species}"),
    ("-paldea", "paldean", "Paldean {species}"),
    ("-paldea-combat-breed", "paldean", "Paldean {species} (Combat Breed)"),
    ("-paldea-blaze-breed", "paldean", "Paldean {species} (Blaze Breed)"),
    ("-paldea-aqua-breed", "paldean", "Paldean {species} (Aqua Breed)"),
]

# Battle / alternate forms that should get "(Form)" display style
BATTLE_FORM_POKEMON: set[str] = {
    "deoxys", "wormadam", "giratina", "shaymin", "basculin", "darmanitan",
    "tornadus", "thundurus", "landorus", "keldeo", "meloetta", "aegislash",
    "pumpkaboo", "gourgeist", "wishiwashi", "minior", "mimikyu",
    "toxtricity", "eiscue", "indeedee", "morpeko", "urshifu", "basculegion",
    "enamorus", "palafin", "ogerpon", "terapagos", "zacian", "zamazenta",
    "eternatus", "calyrex", "oinkologne", "maushold", "squawkabilly",
    "dudunsparce",
}

GENDER_FORM_POKEMON: set[str] = {
    "meowstic", "indeedee", "basculegion", "oinkologne",
}


def _title_case_name(name: str) -> str:
    """Title-case a hyphenated Pokémon name, e.g. 'ho-oh' -> 'Ho-Oh'."""
    return "-".join(part.capitalize() for part in name.split("-"))


def classify_form(pokemon_name: str, species_name: str, is_default: bool) -> tuple[str, str, str]:
    """
    Returns (form_category, form_name, display_name) for a given variety name.

    Parameters
    ----------
    pokemon_name : str
        The variety (pokemon) name, e.g. ``"charizard-mega-x"``.
    species_name : str
        The species name, e.g. ``"charizard"``.
    is_default : bool
        Whether this variety is the default one for the species.
    """
    species_display = _title_case_name(species_name)

    if is_default or pokemon_name == species_name:
        return ("default", "", species_display)

    # Check known suffixes first
    for suffix, category, template in FORM_SUFFIXES:
        if pokemon_name.endswith(suffix) or pokemon_name == species_name + suffix:
            form_label = template.replace("{species}", "").strip()
            display = template.replace("{species}", species_display)
            return (category, form_label, display)

    # Derive the form suffix by stripping the species prefix
    if pokemon_name.startswith(species_name + "-"):
        form_suffix = pokemon_name[len(species_name) + 1:]
    else:
        form_suffix = pokemon_name

    # Gender forms
    if form_suffix in ("male", "female") or species_name in GENDER_FORM_POKEMON:
        form_label = _title_case_name(form_suffix)
        display = f"{species_display} ({form_label})"
        return ("battle", form_label, display)

    # Known battle / alternate form species
    if species_name in BATTLE_FORM_POKEMON:
        form_label = _title_case_name(form_suffix)
        display = f"{species_display} ({form_label})"
        return ("battle", form_label, display)

    # Totem, starter, etc.
    if "totem" in form_suffix:
        form_label = _title_case_name(form_suffix)
        display = f"{species_display} ({form_label})"
        return ("other", form_label, display)

    # Generic alternate form
    form_label = _title_case_name(form_suffix)
    display = f"{species_display} ({form_label})"
    return ("other", form_label, display)


# ---------------------------------------------------------------------------
# Async HTTP client with rate limiting and retries
# ---------------------------------------------------------------------------

class RateLimiter:
    """Simple async token-bucket rate limiter."""

    def __init__(self, rate: float):
        self._rate = rate
        self._interval = 1.0 / rate
        self._sem = asyncio.Semaphore(int(rate))
        self._lock = asyncio.Lock()
        self._last = 0.0

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            wait = self._last + self._interval - now
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


class PokeAPIClient:
    """Async PokéAPI client with rate limiting, retries, and caching."""

    def __init__(self, base_url: str, concurrency: int):
        self.base_url = base_url
        self._semaphore = asyncio.Semaphore(concurrency)
        self._rate_limiter = RateLimiter(RATE_LIMIT_PER_SECOND)
        self._session: Optional[aiohttp.ClientSession] = None
        self._cache: dict[str, Any] = {}
        self.request_count = 0
        self.error_count = 0

    async def __aenter__(self) -> "PokeAPIClient":
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        # Some PokeAPI edge nodes return Zstandard by default. Explicitly request
        # universally-supported encodings so imports also work without a zstd codec.
        self._session = aiohttp.ClientSession(
            timeout=timeout,
            headers={"Accept-Encoding": "gzip, deflate"},
        )
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._session:
            await self._session.close()

    async def get(self, path: str) -> Optional[dict]:
        """
        GET a path relative to base_url with retries and rate limiting.
        Returns parsed JSON dict or None on permanent failure.
        """
        url = f"{self.base_url}/{path.lstrip('/')}"

        if url in self._cache:
            return self._cache[url]

        async with self._semaphore:
            for attempt in range(1, MAX_RETRIES + 1):
                await self._rate_limiter.acquire()
                try:
                    self.request_count += 1
                    async with self._session.get(url) as resp:  # type: ignore[union-attr]
                        if resp.status == 200:
                            data = await resp.json()
                            self._cache[url] = data
                            return data
                        elif resp.status == 404:
                            logger.warning("404 Not Found: %s", url)
                            return None
                        else:
                            logger.warning(
                                "HTTP %d for %s (attempt %d/%d)",
                                resp.status, url, attempt, MAX_RETRIES,
                            )
                except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
                    logger.warning(
                        "Request error for %s (attempt %d/%d): %s",
                        url, attempt, MAX_RETRIES, exc,
                    )

                if attempt < MAX_RETRIES:
                    delay = min(BACKOFF_BASE * (2 ** (attempt - 1)), BACKOFF_MAX)
                    logger.debug("Backing off %.1fs before retry", delay)
                    await asyncio.sleep(delay)

            self.error_count += 1
            logger.error("Failed to fetch %s after %d attempts", url, MAX_RETRIES)
            return None


# ---------------------------------------------------------------------------
# Data extraction
# ---------------------------------------------------------------------------

def extract_pokemon_entry(
    pokemon_data: dict,
    species_data: dict,
    is_default_variety: bool,
) -> dict:
    """
    Build a standardised document from PokéAPI pokemon + species data.
    """
    pokemon_name: str = pokemon_data["name"]
    species_name: str = species_data["name"]
    pokeapi_id: int = pokemon_data["id"]
    species_id: int = species_data["id"]

    # Generation
    generation_url: str = species_data.get("generation", {}).get("url", "")
    generation = _parse_generation(generation_url)

    # Form classification
    form_category, form_name, display_name = classify_form(
        pokemon_name, species_name, is_default_variety,
    )

    # Types
    types = [
        t["type"]["name"]
        for t in sorted(pokemon_data.get("types", []), key=lambda t: t["slot"])
    ]

    # Abilities (including hidden abilities, so each prompt shows the complete set)
    abilities = [
        ability["ability"]["name"].replace("-", " ").title()
        for ability in sorted(pokemon_data.get("abilities", []), key=lambda ability: ability["slot"])
        if ability.get("ability", {}).get("name")
    ]

    # Stats
    stat_map: dict[str, int] = {}
    api_stat_names = {
        "hp": "hp",
        "attack": "attack",
        "defense": "defense",
        "special-attack": "special_attack",
        "special-defense": "special_defense",
        "speed": "speed",
    }
    for s in pokemon_data.get("stats", []):
        api_name = s["stat"]["name"]
        if api_name in api_stat_names:
            stat_map[api_stat_names[api_name]] = s["base_stat"]

    stats = {
        "hp": stat_map.get("hp", 0),
        "attack": stat_map.get("attack", 0),
        "defense": stat_map.get("defense", 0),
        "special_attack": stat_map.get("special_attack", 0),
        "special_defense": stat_map.get("special_defense", 0),
        "speed": stat_map.get("speed", 0),
    }
    bst = sum(stats.values())

    # Dimensions
    height = pokemon_data.get("height", 0)
    weight = pokemon_data.get("weight", 0)

    # Artwork
    sprites = pokemon_data.get("sprites", {})
    official_artwork = (
        sprites.get("other", {}).get("official-artwork", {}).get("front_default")
    )
    sprite_url = sprites.get("front_default")
    artwork_url = official_artwork or sprite_url or ""

    return {
        "canonical_id": pokemon_name,
        "pokeapi_id": pokeapi_id,
        "species_id": species_id,
        "name": pokemon_name,
        "display_name": display_name,
        "form_name": form_name,
        "form_category": form_category,
        "generation": generation,
        "types": types,
        "abilities": abilities,
        "stats": stats,
        "bst": bst,
        "height": height,
        "height_m": round(height / 10.0, 1),
        "weight": weight,
        "weight_kg": round(weight / 10.0, 1),
        "artwork_url": artwork_url,
        "sprite_url": sprite_url or "",
        "is_playable": True,
        "data_version": DATA_VERSION,
        "imported_at": datetime.now(timezone.utc),
    }


def _parse_generation(url: str) -> int:
    """Parse generation number from PokéAPI URL like '.../generation/1/'."""
    if not url:
        return 0
    parts = url.rstrip("/").split("/")
    try:
        return int(parts[-1])
    except (ValueError, IndexError):
        return 0


# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------

async def ensure_indexes(collection: Any) -> None:
    """Create required indexes on the pokemon collection."""
    indexes = [
        IndexModel([("canonical_id", ASCENDING)], unique=True),
        IndexModel([("species_id", ASCENDING)]),
        IndexModel([("types", ASCENDING)]),
        IndexModel([("bst", ASCENDING)]),
        IndexModel([("is_playable", ASCENDING)]),
        IndexModel([("form_category", ASCENDING)]),
    ]
    await collection.create_indexes(indexes)
    logger.info("MongoDB indexes ensured on '%s'", collection.name)


async def bulk_upsert(collection: Any, entries: list[dict]) -> int:
    """Upsert a batch of entries; returns number of upserted/modified docs."""
    if not entries:
        return 0

    ops = [
        UpdateOne(
            {"canonical_id": entry["canonical_id"]},
            {"$set": entry},
            upsert=True,
        )
        for entry in entries
    ]
    result = await collection.bulk_write(ops, ordered=False)
    return result.upserted_count + result.modified_count


# ---------------------------------------------------------------------------
# Main importer
# ---------------------------------------------------------------------------

class PokemonImporter:
    """Orchestrates the full import pipeline."""

    def __init__(
        self,
        mode: str = "full",
        batch_size: int = 100,
        concurrency: int = 10,
        species_limit: Optional[int] = None,
    ):
        self.mode = mode
        self.batch_size = batch_size
        self.concurrency = concurrency
        self.species_limit = species_limit

        # Stats tracking
        self.total_species = 0
        self.total_entries = 0
        self.entries_by_category: dict[str, int] = {}
        self.missing_artwork: list[str] = []
        self.errors: list[str] = []
        self.start_time = 0.0

    async def run(self) -> None:
        self.start_time = time.monotonic()

        # MongoDB setup
        mongo_client = AsyncIOMotorClient(MONGODB_URI)
        db = mongo_client[MONGODB_DATABASE]
        collection = db[COLLECTION_NAME]

        if self.mode == "rebuild":
            logger.info("REBUILD mode — dropping collection '%s'", COLLECTION_NAME)
            await collection.drop()

        await ensure_indexes(collection)

        # Determine existing entries for incremental mode
        existing_ids: set[str] = set()
        if self.mode == "incremental":
            cursor = collection.find({}, {"canonical_id": 1})
            async for doc in cursor:
                existing_ids.add(doc["canonical_id"])
            logger.info("Incremental mode — %d existing entries found", len(existing_ids))

        async with PokeAPIClient(POKEAPI_BASE_URL, self.concurrency) as api:
            # 1. Fetch species list
            logger.info("Fetching species list...")
            species_list_data = await api.get("/pokemon-species?limit=2000")
            if not species_list_data:
                logger.error("Failed to fetch species list. Aborting.")
                return

            all_species = species_list_data.get("results", [])
            if self.species_limit:
                all_species = all_species[: self.species_limit]

            self.total_species = len(all_species)
            logger.info("Processing %d species...", self.total_species)

            # 2. Process species in batches
            all_entries: list[dict] = []
            all_canonical_ids: set[str] = set()

            for batch_start in range(0, len(all_species), self.concurrency):
                batch_end = min(batch_start + self.concurrency, len(all_species))
                species_batch = all_species[batch_start:batch_end]

                tasks = [
                    self._process_species(api, sp, existing_ids)
                    for sp in species_batch
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for result in results:
                    if isinstance(result, Exception):
                        err_msg = f"Species processing error: {result}"
                        logger.error(err_msg)
                        self.errors.append(err_msg)
                        continue
                    if result:
                        for entry in result:
                            all_entries.append(entry)
                            all_canonical_ids.add(entry["canonical_id"])

                processed = min(batch_end, len(all_species))
                logger.info(
                    "Fetched %d/%d species (%d entries so far)",
                    processed, self.total_species, len(all_entries),
                )

                # Flush to DB when we have enough entries
                if len(all_entries) >= self.batch_size:
                    batch_to_write = all_entries[: self.batch_size]
                    all_entries = all_entries[self.batch_size:]
                    count = await bulk_upsert(collection, batch_to_write)
                    logger.info("Wrote %d entries to MongoDB", count)

            # Flush remaining
            if all_entries:
                count = await bulk_upsert(collection, all_entries)
                logger.info("Wrote final %d entries to MongoDB", count)

            self.total_entries = len(all_canonical_ids)

            # 3. In rebuild mode, remove entries no longer in the API
            if self.mode == "rebuild":
                # Already dropped, nothing extra needed
                pass
            elif self.mode == "full":
                # Remove stale entries
                result = await collection.delete_many(
                    {"canonical_id": {"$nin": list(all_canonical_ids)}}
                )
                if result.deleted_count:
                    logger.info("Removed %d stale entries", result.deleted_count)

            # Log API stats
            logger.info(
                "API requests: %d total, %d errors",
                api.request_count, api.error_count,
            )

        mongo_client.close()
        self._print_summary()

    async def _process_species(
        self,
        api: PokeAPIClient,
        species_ref: dict,
        existing_ids: set[str],
    ) -> list[dict]:
        """Fetch species data and all its varieties, returning entry dicts."""
        species_name = species_ref["name"]

        # Fetch species details
        species_data = await api.get(f"/pokemon-species/{species_name}")
        if not species_data:
            self.errors.append(f"Failed to fetch species: {species_name}")
            return []

        entries: list[dict] = []
        varieties = species_data.get("varieties", [])

        for variety in varieties:
            pokemon_ref = variety.get("pokemon", {})
            pokemon_name = pokemon_ref.get("name", "")
            is_default = variety.get("is_default", False)

            if not pokemon_name:
                continue

            # Skip already-imported entries in incremental mode
            if self.mode == "incremental" and pokemon_name in existing_ids:
                logger.debug("Skipping (already exists): %s", pokemon_name)
                continue

            # Fetch full pokemon data
            pokemon_data = await api.get(f"/pokemon/{pokemon_name}")
            if not pokemon_data:
                self.errors.append(f"Failed to fetch pokemon: {pokemon_name}")
                continue

            entry = extract_pokemon_entry(pokemon_data, species_data, is_default)

            # Track artwork issues
            if not entry["artwork_url"]:
                self.missing_artwork.append(pokemon_name)
                logger.warning("Missing artwork for %s", pokemon_name)

            # Track category counts
            cat = entry["form_category"]
            self.entries_by_category[cat] = self.entries_by_category.get(cat, 0) + 1

            entries.append(entry)

        return entries

    def _print_summary(self) -> None:
        duration = time.monotonic() - self.start_time
        minutes, seconds = divmod(duration, 60)

        print("\n" + "=" * 60)
        print("  STAXX.GG — Pokémon Import Summary")
        print("=" * 60)
        print(f"  Mode:                 {self.mode}")
        print(f"  Duration:             {int(minutes)}m {seconds:.1f}s")
        print(f"  Species processed:    {self.total_species}")
        print(f"  Total entries:        {self.total_entries}")
        print()
        print("  Entries by form category:")
        for cat in sorted(self.entries_by_category.keys()):
            count = self.entries_by_category[cat]
            print(f"    {cat:20s} {count}")
        print()
        print(f"  Missing artwork:      {len(self.missing_artwork)}")
        if self.missing_artwork[:10]:
            for name in self.missing_artwork[:10]:
                print(f"    - {name}")
            if len(self.missing_artwork) > 10:
                print(f"    ... and {len(self.missing_artwork) - 10} more")
        print()
        print(f"  Errors:               {len(self.errors)}")
        if self.errors[:10]:
            for err in self.errors[:10]:
                print(f"    - {err}")
            if len(self.errors) > 10:
                print(f"    ... and {len(self.errors) - 10} more")
        print("=" * 60 + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="STAXX.GG — Import Pokémon data from PokéAPI into MongoDB",
    )
    parser.add_argument(
        "--mode",
        choices=["full", "incremental", "rebuild"],
        default="full",
        help="Import mode (default: full)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Number of entries per MongoDB batch write (default: 100)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Max concurrent API requests (default: 10)",
    )
    parser.add_argument(
        "--species-limit",
        type=int,
        default=None,
        help="Max species to process (for testing)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Silence noisy libraries
    logging.getLogger("aiohttp").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)

    logger.info("Starting Pokémon import (mode=%s)", args.mode)

    importer = PokemonImporter(
        mode=args.mode,
        batch_size=args.batch_size,
        concurrency=args.concurrency,
        species_limit=args.species_limit,
    )
    asyncio.run(importer.run())


if __name__ == "__main__":
    main()

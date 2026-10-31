#!/usr/bin/env python3
"""
STAXX.GG — Pokémon Data Validator
==================================
Validates imported Pokémon data in MongoDB for correctness and consistency.

Usage:
    python validate_pokemon.py
    python validate_pokemon.py --verbose
"""

import argparse
import asyncio
import logging
import os
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/staxx")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "staxx")
COLLECTION_NAME = "pokemon"

VALID_TYPES = frozenset([
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy",
])

VALID_FORM_CATEGORIES = frozenset([
    "default", "mega", "primal", "gmax", "alolan", "galarian",
    "hisuian", "paldean", "battle", "other",
])

STAT_KEYS = ["hp", "attack", "defense", "special_attack", "special_defense", "speed"]

# Reasonable stat ranges
MIN_STAT = 1
MAX_STAT = 255
MIN_BST = 150
MAX_BST = 1500  # generous upper bound (Eternatus Eternamax is 1125)

logger = logging.getLogger("staxx.validator")


# ---------------------------------------------------------------------------
# Validation checks
# ---------------------------------------------------------------------------

class ValidationReport:
    """Collects validation results."""

    def __init__(self) -> None:
        self.total: int = 0
        self.passed: int = 0
        self.warnings: list[str] = []
        self.errors: list[str] = []
        self.category_counts: Counter = Counter()
        self.type_counts: Counter = Counter()
        self.generation_counts: Counter = Counter()
        self.missing_artwork: list[str] = []
        self.missing_sprite: list[str] = []
        self.duplicate_ids: list[str] = []

    def add_error(self, msg: str) -> None:
        self.errors.append(msg)
        logger.error(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)
        logger.warning(msg)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0


async def validate(verbose: bool = False) -> ValidationReport:
    """Run all validation checks and return a report."""
    report = ValidationReport()

    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DATABASE]
    collection = db[COLLECTION_NAME]

    count = await collection.count_documents({})
    if count == 0:
        report.add_error("Collection is empty — no data to validate.")
        client.close()
        return report

    report.total = count
    logger.info("Validating %d entries...", count)

    # Check for duplicate canonical_ids
    pipeline = [
        {"$group": {"_id": "$canonical_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}},
    ]
    async for doc in collection.aggregate(pipeline):
        report.duplicate_ids.append(doc["_id"])
        report.add_error(f"Duplicate canonical_id: {doc['_id']} (count={doc['count']})")

    # Validate each entry
    cursor = collection.find({})
    checked = 0
    async for entry in cursor:
        cid = entry.get("canonical_id", "<unknown>")
        entry_valid = True

        # --- Required fields ---
        for field in [
            "canonical_id", "pokeapi_id", "species_id", "name",
            "display_name", "form_category", "types", "stats", "bst",
            "height", "weight", "is_playable", "data_version",
        ]:
            if field not in entry:
                report.add_error(f"[{cid}] Missing required field: {field}")
                entry_valid = False

        if not entry_valid:
            continue

        # --- Stats validation ---
        stats = entry.get("stats", {})
        for key in STAT_KEYS:
            val = stats.get(key, -1)
            if not isinstance(val, (int, float)):
                report.add_error(f"[{cid}] Stat '{key}' is not numeric: {val}")
                entry_valid = False
            elif val < 0:
                report.add_error(f"[{cid}] Stat '{key}' is negative: {val}")
                entry_valid = False
            elif val > MAX_STAT:
                report.add_warning(f"[{cid}] Stat '{key}' unusually high: {val}")

        # --- BST validation ---
        expected_bst = sum(stats.get(k, 0) for k in STAT_KEYS)
        actual_bst = entry.get("bst", 0)
        if actual_bst != expected_bst:
            report.add_error(
                f"[{cid}] BST mismatch: stored={actual_bst}, calculated={expected_bst}"
            )
            entry_valid = False

        if actual_bst < MIN_BST:
            report.add_warning(f"[{cid}] BST unusually low: {actual_bst}")
        if actual_bst > MAX_BST:
            report.add_warning(f"[{cid}] BST unusually high: {actual_bst}")

        # --- Types validation ---
        types = entry.get("types", [])
        if not types:
            report.add_error(f"[{cid}] No types defined")
            entry_valid = False
        elif len(types) > 2:
            report.add_error(f"[{cid}] More than 2 types: {types}")
            entry_valid = False
        else:
            for t in types:
                if t not in VALID_TYPES:
                    report.add_error(f"[{cid}] Invalid type: '{t}'")
                    entry_valid = False
                report.type_counts[t] += 1

        # --- Form category ---
        cat = entry.get("form_category", "")
        if cat not in VALID_FORM_CATEGORIES:
            report.add_warning(f"[{cid}] Unknown form_category: '{cat}'")
        report.category_counts[cat] += 1

        # --- Generation ---
        gen = entry.get("generation", 0)
        if gen < 1 or gen > 9:
            report.add_warning(f"[{cid}] Unusual generation: {gen}")
        report.generation_counts[gen] += 1

        # --- Artwork ---
        artwork = entry.get("artwork_url", "")
        if not artwork:
            report.missing_artwork.append(cid)

        sprite = entry.get("sprite_url", "")
        if not sprite:
            report.missing_sprite.append(cid)

        # --- Dimensions ---
        height = entry.get("height", -1)
        weight = entry.get("weight", -1)
        if height < 0:
            report.add_warning(f"[{cid}] Negative height: {height}")
        if weight < 0:
            report.add_warning(f"[{cid}] Negative weight: {weight}")

        # --- Height/weight conversion ---
        height_m = entry.get("height_m", -1)
        if height >= 0 and abs(height_m - height / 10.0) > 0.01:
            report.add_error(
                f"[{cid}] height_m mismatch: stored={height_m}, expected={height / 10.0}"
            )

        weight_kg = entry.get("weight_kg", -1)
        if weight >= 0 and abs(weight_kg - weight / 10.0) > 0.01:
            report.add_error(
                f"[{cid}] weight_kg mismatch: stored={weight_kg}, expected={weight / 10.0}"
            )

        if entry_valid:
            report.passed += 1

        checked += 1
        if checked % 200 == 0:
            logger.info("Validated %d/%d entries...", checked, count)

    client.close()
    return report


def print_report(report: ValidationReport) -> None:
    """Print a formatted validation report."""
    status = "✅ PASSED" if report.is_valid else "❌ FAILED"

    print("\n" + "=" * 60)
    print("  STAXX.GG — Pokémon Data Validation Report")
    print("=" * 60)
    print(f"  Status:           {status}")
    print(f"  Total entries:    {report.total}")
    print(f"  Valid entries:    {report.passed}")
    print(f"  Errors:           {len(report.errors)}")
    print(f"  Warnings:         {len(report.warnings)}")
    print()

    if report.duplicate_ids:
        print(f"  Duplicate IDs:    {len(report.duplicate_ids)}")
        for did in report.duplicate_ids[:10]:
            print(f"    - {did}")
        print()

    print("  Entries by form category:")
    for cat, cnt in sorted(report.category_counts.items()):
        print(f"    {cat:20s} {cnt}")
    print()

    print("  Entries by generation:")
    for gen in sorted(report.generation_counts.keys()):
        cnt = report.generation_counts[gen]
        print(f"    Gen {gen:2d}:           {cnt}")
    print()

    print("  Type distribution:")
    for t, cnt in sorted(report.type_counts.items(), key=lambda x: -x[1]):
        print(f"    {t:12s} {cnt}")
    print()

    print(f"  Missing artwork:  {len(report.missing_artwork)}")
    if report.missing_artwork[:5]:
        for name in report.missing_artwork[:5]:
            print(f"    - {name}")
        if len(report.missing_artwork) > 5:
            print(f"    ... and {len(report.missing_artwork) - 5} more")
    print()

    print(f"  Missing sprites:  {len(report.missing_sprite)}")
    print()

    if report.errors:
        print("  First 20 errors:")
        for err in report.errors[:20]:
            print(f"    ✗ {err}")
        if len(report.errors) > 20:
            print(f"    ... and {len(report.errors) - 20} more")
        print()

    if report.warnings:
        print(f"  Warnings ({len(report.warnings)} total, showing first 20):")
        for warn in report.warnings[:20]:
            print(f"    ⚠ {warn}")
        if len(report.warnings) > 20:
            print(f"    ... and {len(report.warnings) - 20} more")
        print()

    print("=" * 60 + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="STAXX.GG — Validate imported Pokémon data",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    report = asyncio.run(validate(verbose=args.verbose))
    print_report(report)

    sys.exit(0 if report.is_valid else 1)


if __name__ == "__main__":
    main()

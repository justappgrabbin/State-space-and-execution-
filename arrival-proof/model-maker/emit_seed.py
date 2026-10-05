#!/usr/bin/env python3
"""
Emit one real seed from a locally-created dimensional TRIDENT model.

Writes exactly one JSON object to stdout. No network access.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "vendor" / "trident"
sys.path.insert(0, str(VENDOR))

from model import Trident, TridentConfig  # noqa: E402

DIMENSIONS = ("Movement", "Evolution", "Being", "Design")


def tokenize(text: str, vocab_size: int = 4096) -> list[int]:
    ids = [ord(c) % vocab_size for c in text]
    return ids or [32]


def printable_projection(ids: list[int]) -> str:
    chars = []
    for value in ids:
        if 32 <= value <= 126:
            chars.append(chr(value))
        else:
            chars.append(f"<{value}>")
    return "".join(chars)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--dimension", required=True, choices=DIMENSIONS)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--max-new", type=int, default=12)
    parser.add_argument("--temperature", type=float, default=0.8)
    parser.add_argument("--top-k", type=int, default=40)
    args = parser.parse_args()

    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text("utf-8"))
    row = next((x for x in manifest["models"] if x["dimension"] == args.dimension), None)
    if row is None:
        raise SystemExit(f"missing model for {args.dimension}")

    cfg = TridentConfig()
    cfg.heads = [args.dimension]
    model = Trident(cfg)

    artifact = manifest_path.parent / row["artifact"]
    state = torch.load(artifact, map_location="cpu")
    model.load_state_dict(state)

    prompt_ids = tokenize(args.prompt, cfg.vocab_size)
    ids = torch.tensor([prompt_ids], dtype=torch.long)

    # Deterministic sampling for replayability.
    torch.manual_seed(int(row["seed"]))
    out = model.generate(
        ids,
        max_new=max(1, args.max_new),
        temp=args.temperature,
        top_k=args.top_k,
        head=args.dimension,
    )
    all_ids = out[0].tolist()
    generated_ids = all_ids[len(prompt_ids):]

    payload = {
        "modelId": f"synthia-dimension:{args.dimension}",
        "dimension": args.dimension,
        "artifact": row["artifact"],
        "artifactSha256": row["sha256"],
        "prompt": args.prompt,
        "promptTokenIds": prompt_ids,
        "generatedTokenIds": generated_ids,
        "generatedProjection": printable_projection(generated_ids),
        "samplingSeed": row["seed"],
    }
    print(json.dumps(payload, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

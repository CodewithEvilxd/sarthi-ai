"""Scan backend code for large prompt strings to optimize token usage.

Run: python backend/scripts/analyze_prompt_sizes.py

This prints the largest triple-quoted strings (likely prompts) and their file locations.
"""
import ast
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "app"

prompts = []

for py in ROOT.rglob("*.py"):
    try:
        src = py.read_text(encoding="utf-8")
        tree = ast.parse(src)
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                val = node.value
                if "You are" in val or "Provide your" in val or "Return ONLY" in val or "MUST" in val:
                    prompts.append((py.relative_to(ROOT.parent), len(val), val.strip().replace("\n", " ")[:200]))
    except Exception:
        continue

prompts.sort(key=lambda x: x[1], reverse=True)

print("Top prompt-like strings by character length:")
for path, length, snippet in prompts[:20]:
    print(f"{length:6d} chars - {path}")
    print(f"  -> {snippet}...\n")

if not prompts:
    print("No candidate prompts found. Try searching manually for long triple-quoted strings.")

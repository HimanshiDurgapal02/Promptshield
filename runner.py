"""Runs every attack against HelpBot, checks for leaks, scores, and saves to MySQL.

Usage:  python scanner/runner.py weak|defended|both [--no-db]
"""
import sys
from attacks import ATTACKS
from chatbot import ask_chatbot
from defense import defended_chatbot
from scorer import is_leaked, calculate_score, risk_level


def weak_chatbot(message):
    return ask_chatbot(message), "none"


def run_scan(mode, save=True):
    bot = weak_chatbot if mode == "weak" else defended_chatbot
    results = []
    print(f"\n=== Scan: {mode} chatbot, {len(ATTACKS)} attacks ===")
    for attack in ATTACKS:
        reply, layer = bot(attack["prompt"])
        leaked = is_leaked(reply)
        results.append({**attack, "response": reply, "leaked": leaked, "layer": layer})
        print(f"[{'LEAKED' if leaked else 'safe  '}] {attack['id']} {attack['name']}")

    score = calculate_score(results)
    leaked_count = sum(1 for r in results if r["leaked"])
    print(f"Score: {score}/100 ({risk_level(score)} risk) - {leaked_count}/{len(results)} attacks leaked the secret")

    if save:
        from db import save_run
        print(f"Saved to MySQL as run #{save_run(mode, score, results)}")
    return score


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    mode = args[0] if args else "both"
    save = "--no-db" not in sys.argv
    if mode not in ("weak", "defended", "both"):
        sys.exit("Usage: python scanner/runner.py weak|defended|both [--no-db]")
    for m in (["weak", "defended"] if mode == "both" else [mode]):
        run_scan(m, save)

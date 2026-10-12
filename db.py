"""Saves scan results to MySQL."""
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_conn():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "promptshield"),
    )


def save_run(mode, score, results):
    conn = get_conn()
    cur = conn.cursor()
    leaked_count = sum(1 for r in results if r["leaked"])
    cur.execute(
        "INSERT INTO scan_runs (mode, score, total_attacks, leaked_count) VALUES (%s, %s, %s, %s)",
        (mode, score, len(results), leaked_count),
    )
    run_id = cur.lastrowid
    rows = [
        (run_id, r["id"], r["category"], r["name"], r["prompt"], r["response"], r["leaked"], r["layer"])
        for r in results
    ]
    cur.executemany(
        "INSERT INTO attack_results (run_id, attack_id, category, name, prompt, response, leaked, layer) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
        rows,
    )
    conn.commit()
    conn.close()
    return run_id

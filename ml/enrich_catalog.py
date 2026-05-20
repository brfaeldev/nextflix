"""
Enriquece filmes no SQLite com posters do TMDB.
Requer TMDB_API_KEY no .env na raiz do projeto.
Uso: python ml/enrich_catalog.py
"""

from __future__ import annotations

import os
import sqlite3
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

from ml.settings import DB_PATH

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

TMDB_BASE = "https://api.themoviedb.org/3"
PLACEHOLDER = "https://placehold.co/300x450/1a1a1a/666?text=Sem+Capa"


def search_poster(title: str, year: int | None, api_key: str) -> tuple[str | None, int | None]:
    params = {"api_key": api_key, "query": title.split("(")[0].strip()}
    if year:
        params["year"] = year

    response = requests.get(f"{TMDB_BASE}/search/movie", params=params, timeout=10)
    response.raise_for_status()
    results = response.json().get("results", [])
    if not results:
        return None, None

    best = results[0]
    poster_path = best.get("poster_path")
    poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
    return poster_url, best.get("id")


def main() -> None:
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        print("TMDB_API_KEY não definida. Copie .env.example para .env")
        print("Continuando com placeholder para filmes sem capa.")

    conn = sqlite3.connect(DB_PATH)
    movies = conn.execute(
        "SELECT id, title, year, poster_url FROM movies WHERE poster_url IS NULL OR poster_url = ''"
    ).fetchall()

    updated = 0
    for movie_id, title, year, _ in movies:
        poster_url = PLACEHOLDER
        tmdb_id = None

        if api_key:
            try:
                found_url, found_id = search_poster(title, year, api_key)
                if found_url:
                    poster_url = found_url
                    tmdb_id = found_id
                time.sleep(0.25)
            except requests.RequestException as error:
                print(f"Erro TMDB ({title}): {error}")

        conn.execute(
            "UPDATE movies SET poster_url = ?, tmdb_id = ? WHERE id = ?",
            (poster_url, tmdb_id, movie_id),
        )
        updated += 1
        if updated % 50 == 0:
            conn.commit()
            print(f"  {updated}/{len(movies)} filmes processados...")

    conn.commit()
    conn.close()
    print(f"Catálogo enriquecido: {updated} filmes.")


if __name__ == "__main__":
    main()

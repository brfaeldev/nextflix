"""
Baixa (se necessário) o MovieLens 100k, popula o SQLite e gera sequências para a RNN.
Uso: python -m ml.carregar_dados
"""

from __future__ import annotations

import pickle
import sqlite3
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np

from ml.settings import (
    DB_PATH,
    GENRES,
    MIN_RATING,
    MOVIELENS_DIR,
    PROCESSED_DIR,
    WINDOW_SIZE,
)

ML100K_URL = "https://files.grouplens.org/datasets/movielens/ml-100k.zip"


def download_movielens() -> Path:
    MOVIELENS_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = MOVIELENS_DIR.parent / "ml-100k.zip"

    if (MOVIELENS_DIR / "u.data").exists():
        return MOVIELENS_DIR

    print("Baixando MovieLens 100k...")
    urlretrieve(ML100K_URL, zip_path)
    with zipfile.ZipFile(zip_path, "r") as archive:
        archive.extractall(MOVIELENS_DIR.parent)

    extracted = MOVIELENS_DIR.parent / "ml-100k"
    if extracted.exists() and extracted != MOVIELENS_DIR:
        for item in extracted.iterdir():
            target = MOVIELENS_DIR / item.name
            if not target.exists():
                item.rename(target)

    return MOVIELENS_DIR


def parse_movies() -> list[dict]:
    rows = []
    for line in (MOVIELENS_DIR / "u.item").read_text(encoding="latin-1").splitlines():
        parts = line.split("|")
        if len(parts) < 24:
            continue
        movie_id = int(parts[0])
        title = parts[1].strip()
        year = None
        if "(" in title and ")" in title:
            try:
                year = int(title.rsplit("(", 1)[1].rstrip(")"))
            except ValueError:
                year = None
        flags = [int(x) for x in parts[5:24]]
        genres = "|".join(g for g, flag in zip(GENRES, flags) if flag == 1)
        rows.append({"id": movie_id, "title": title, "year": year, "genres": genres})
    return rows


def parse_ratings() -> list[tuple]:
    rows = []
    for line in (MOVIELENS_DIR / "u.data").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        user_id, movie_id, rating, timestamp = line.split("\t")
        rows.append(
            (int(user_id), int(movie_id), float(rating), "movielens", int(timestamp))
        )
    return rows


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          year INTEGER,
          genres TEXT,
          poster_url TEXT,
          tmdb_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS ratings (
          user_id INTEGER NOT NULL,
          movie_id INTEGER NOT NULL,
          rating REAL NOT NULL,
          source TEXT NOT NULL DEFAULT 'app',
          created_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, movie_id)
        );
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          movie_id INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          genre TEXT,
          dwell_seconds INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recommendations_cache (
          user_id INTEGER PRIMARY KEY,
          movie_ids_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        """
    )


def seed_database(movies: list[dict], ratings: list[tuple]) -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        init_schema(conn)
        conn.execute("DELETE FROM ratings WHERE source = 'movielens'")
        conn.executemany(
            "INSERT OR REPLACE INTO movies (id, title, year, genres) VALUES (?, ?, ?, ?)",
            [(m["id"], m["title"], m["year"], m["genres"]) for m in movies],
        )
        conn.executemany(
            """INSERT OR REPLACE INTO ratings (user_id, movie_id, rating, source, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            ratings,
        )
        conn.commit()
        print(f"SQLite atualizado: {DB_PATH}")
        print(f"  Filmes: {len(movies)}")
        print(f"  Avaliações MovieLens: {len(ratings)}")
    finally:
        conn.close()


def build_sequences(ratings_rows: list[tuple]) -> tuple[np.ndarray, np.ndarray, dict]:
    from collections import defaultdict

    by_user: dict[int, list[tuple]] = defaultdict(list)
    for user_id, movie_id, rating, _source, timestamp in ratings_rows:
        if rating >= MIN_RATING:
            by_user[user_id].append((timestamp, movie_id))

    movie_ids = sorted({movie_id for rows in by_user.values() for _, movie_id in rows})
    movie_to_idx = {movie_id: idx + 1 for idx, movie_id in enumerate(movie_ids)}
    idx_to_movie = {idx: movie_id for movie_id, idx in movie_to_idx.items()}

    X, y = [], []
    for rows in by_user.values():
        rows.sort(key=lambda item: item[0])
        seq = [movie_to_idx[movie_id] for _, movie_id in rows]
        for i in range(len(seq) - WINDOW_SIZE):
            X.append(seq[i : i + WINDOW_SIZE])
            y.append(seq[i + WINDOW_SIZE])

    return np.array(X, dtype=np.int32), np.array(y, dtype=np.int32), {
        "movie_to_idx": movie_to_idx,
        "idx_to_movie": idx_to_movie,
        "num_movies": len(movie_ids) + 1,
    }


def main() -> None:
    download_movielens()
    movies = parse_movies()
    ratings = parse_ratings()
    seed_database(movies, ratings)

    X, y, mappings = build_sequences(ratings)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    np.save(PROCESSED_DIR / "X.npy", X)
    np.save(PROCESSED_DIR / "y.npy", y)
    with open(PROCESSED_DIR / "mappings.pkl", "wb") as file:
        pickle.dump(mappings, file)

    print(f"Sequências geradas: {len(X)} amostras (janela={WINDOW_SIZE})")


if __name__ == "__main__":
    main()

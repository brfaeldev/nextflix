"""
Lógica de recomendação: RNN + cold start com populares.
"""

from __future__ import annotations

import json
import pickle
import sqlite3
import time

import numpy as np

from ml.settings import DB_PATH, MIN_RATING, MODELS_DIR, TOP_K, WINDOW_SIZE
from ml.numpy_rnn import SimpleRNNRecommender

_model = None
_mappings = None


def load_model():
    global _model, _mappings
    if _model is None:
        model_path = MODELS_DIR / "rnn.pkl"
        map_path = MODELS_DIR / "mappings.pkl"
        if not model_path.exists() or not map_path.exists():
            raise FileNotFoundError(
                "Modelo não encontrado. Rode: python -m ml.carregar_dados && python -m ml.modelo"
            )
        _model = SimpleRNNRecommender.load(model_path)
        with open(map_path, "rb") as file:
            _mappings = pickle.load(file)
    return _model, _mappings


def get_user_history(user_id: int) -> list[int]:
    conn = sqlite3.connect(DB_PATH)
    try:
        rows = conn.execute(
            """
            SELECT movie_id FROM ratings
            WHERE user_id = ? AND rating >= ?
            ORDER BY created_at ASC
            """,
            (user_id, MIN_RATING),
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def get_popular_movies(limit: int = TOP_K) -> list[int]:
    conn = sqlite3.connect(DB_PATH)
    try:
        rows = conn.execute(
            """
            SELECT movie_id, COUNT(*) AS total
            FROM ratings
            GROUP BY movie_id
            ORDER BY total DESC
            LIMIT ?
            """,
            (limit * 2,),
        ).fetchall()
        return [row[0] for row in rows[:limit]]
    finally:
        conn.close()


def predict_next_movies(user_id: int, top_k: int = TOP_K) -> list[int]:
    history = get_user_history(user_id)
    seen = set(history)

    if len(history) < WINDOW_SIZE:
        return [m for m in get_popular_movies(top_k * 2) if m not in seen][:top_k]

    model, mappings = load_model()
    movie_to_idx = mappings["movie_to_idx"]
    idx_to_movie = mappings["idx_to_movie"]

    indices = [movie_to_idx[mid] for mid in history if mid in movie_to_idx]
    if len(indices) < WINDOW_SIZE:
        return [m for m in get_popular_movies(top_k * 2) if m not in seen][:top_k]

    window = np.array(indices[-WINDOW_SIZE:], dtype=np.int32)
    exclude_idx = {movie_to_idx[mid] for mid in seen if mid in movie_to_idx}
    top = model.predict_top_k(window, k=top_k * 3, exclude=exclude_idx)

    results = []
    for idx, _ in top:
        movie_id = idx_to_movie.get(int(idx))
        if movie_id and movie_id not in seen:
            results.append(movie_id)
        if len(results) >= top_k:
            break
    return results


def get_movies_by_ids(movie_ids: list[int]) -> list[dict]:
    if not movie_ids:
        return []
    conn = sqlite3.connect(DB_PATH)
    try:
        placeholders = ",".join("?" * len(movie_ids))
        rows = conn.execute(
            f"""
            SELECT id, title, year, genres, poster_url
            FROM movies WHERE id IN ({placeholders})
            """,
            movie_ids,
        ).fetchall()
        by_id = {
            row[0]: {
                "id": row[0],
                "title": row[1],
                "year": row[2],
                "genres": row[3].split("|") if row[3] else [],
                "poster": row[4],
            }
            for row in rows
        }
        return [by_id[mid] for mid in movie_ids if mid in by_id]
    finally:
        conn.close()


def recommend_for_user(user_id: int, top_k: int = TOP_K) -> list[dict]:
    movie_ids = predict_next_movies(user_id, top_k)
    return get_movies_by_ids(movie_ids)


def update_cache(user_id: int, movie_ids: list[int]) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO recommendations_cache (user_id, movie_ids_json, updated_at)
            VALUES (?, ?, ?)
            """,
            (user_id, json.dumps(movie_ids), int(time.time())),
        )
        conn.commit()
    finally:
        conn.close()


def reload_model() -> None:
    global _model, _mappings
    _model = None
    _mappings = None
    load_model()

"""
Retreina o modelo com dados do SQLite (MovieLens + interações do app).
Uso: python -m ml.retrain_job
"""

from __future__ import annotations

import pickle
import sqlite3

import numpy as np

try:
    from ml.carregar_dados import build_sequences
except ImportError:
    from carregar_dados import build_sequences

from ml.settings import DB_PATH, MIN_RATING, MODELS_DIR, PROCESSED_DIR
from ml.numpy_rnn import SimpleRNNRecommender
from ml.recomendacao import predict_next_movies, reload_model, update_cache


def load_all_ratings() -> list[tuple]:
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT user_id, movie_id, rating, source, created_at FROM ratings"
    ).fetchall()
    conn.close()
    return list(rows)


def cache_all_app_users() -> None:
    conn = sqlite3.connect(DB_PATH)
    users = conn.execute("SELECT id FROM users").fetchall()
    conn.close()

    for (user_id,) in users:
        movie_ids = predict_next_movies(user_id)
        update_cache(user_id, movie_ids)


def main() -> None:
    print("Recarregando sequências...")
    ratings = load_all_ratings()
    positive = [r for r in ratings if r[2] >= MIN_RATING]

    X, y, mappings = build_sequences(positive)
    if len(X) == 0:
        print("Sem dados suficientes para retreino.")
        return

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    np.save(PROCESSED_DIR / "X.npy", X)
    np.save(PROCESSED_DIR / "y.npy", y)
    with open(PROCESSED_DIR / "mappings.pkl", "wb") as file:
        pickle.dump(mappings, file)

    print(f"Treinando com {len(X)} amostras...")
    model = SimpleRNNRecommender(num_movies=mappings["num_movies"])
    model.train(X, y, epochs=3, batch_size=128)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.save(MODELS_DIR / "rnn.pkl")
    with open(MODELS_DIR / "mappings.pkl", "wb") as file:
        pickle.dump(mappings, file)

    reload_model()
    cache_all_app_users()
    print("Retreino concluído.")


if __name__ == "__main__":
    main()

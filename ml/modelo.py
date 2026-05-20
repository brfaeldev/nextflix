"""
Treina a RNN de próximo filme com janela deslizante.
Uso: python -m ml.modelo
"""

from __future__ import annotations

import pickle

import numpy as np

from ml.settings import BATCH_SIZE, EPOCHS, MODELS_DIR, PROCESSED_DIR
from ml.numpy_rnn import SimpleRNNRecommender


def main() -> None:
    X = np.load(PROCESSED_DIR / "X.npy")
    y = np.load(PROCESSED_DIR / "y.npy")

    with open(PROCESSED_DIR / "mappings.pkl", "rb") as file:
        mappings = pickle.load(file)

    num_movies = mappings["num_movies"]
    model = SimpleRNNRecommender(num_movies=num_movies)
    losses = model.train(X, y, epochs=EPOCHS, batch_size=BATCH_SIZE)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.save(MODELS_DIR / "rnn.pkl")

    with open(MODELS_DIR / "mappings.pkl", "wb") as file:
        pickle.dump(mappings, file)

    with open(MODELS_DIR / "history.pkl", "wb") as file:
        pickle.dump({"loss": losses}, file)

    print(f"Modelo salvo em {MODELS_DIR / 'rnn.pkl'}")
    print(f"Loss final: {losses[-1]:.4f}")


if __name__ == "__main__":
    main()

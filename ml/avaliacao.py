"""
Avalia o modelo RNN (Hit@10 / Hit@5).
Uso: python -m ml.avaliacao
"""

from __future__ import annotations

import pickle

import matplotlib.pyplot as plt
import numpy as np

from ml.settings import MODELS_DIR, PROCESSED_DIR, TOP_K
from ml.numpy_rnn import SimpleRNNRecommender


def hit_rate_at_k(model, X, y, k: int = TOP_K) -> float:
    hits = 0
    for i in range(len(X)):
        top = model.predict_top_k(X[i], k=k)
        predicted = {idx for idx, _ in top}
        if y[i] in predicted:
            hits += 1
    return hits / len(X) if len(X) else 0.0


def main() -> None:
    X = np.load(PROCESSED_DIR / "X.npy")
    y = np.load(PROCESSED_DIR / "y.npy")
    model = SimpleRNNRecommender.load(MODELS_DIR / "rnn.pkl")

    split = int(len(X) * 0.9)
    X_test, y_test = X[split:], y[split:]

    print(f"Hit@5:  {hit_rate_at_k(model, X_test, y_test, k=5):.4f}")
    print(f"Hit@10: {hit_rate_at_k(model, X_test, y_test, k=10):.4f}")

    history_path = MODELS_DIR / "history.pkl"
    if history_path.exists():
        with open(history_path, "rb") as file:
            history = pickle.load(file)
        plt.figure(figsize=(8, 4))
        plt.plot(history.get("loss", []), label="loss")
        plt.legend()
        plt.title("Treino RNN (NumPy)")
        plt.tight_layout()
        out = MODELS_DIR / "training_loss.png"
        plt.savefig(out)
        print(f"Gráfico salvo em {out}")


if __name__ == "__main__":
    main()

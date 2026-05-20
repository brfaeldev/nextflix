"""
RNN simples (Elman) em NumPy — compatível com Python 3.14+.
"""

from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np


class SimpleRNNRecommender:
    def __init__(
        self,
        num_movies: int,
        embed_dim: int = 64,
        hidden_dim: int = 128,
        seed: int = 42,
    ):
        self.num_movies = num_movies
        self.embed_dim = embed_dim
        self.hidden_dim = hidden_dim
        rng = np.random.default_rng(seed)

        scale = 0.01
        self.E = rng.normal(0, scale, (num_movies, embed_dim))
        self.W_xh = rng.normal(0, scale, (embed_dim, hidden_dim))
        self.W_hh = rng.normal(0, scale, (hidden_dim, hidden_dim))
        self.b_h = np.zeros(hidden_dim)
        self.W_hy = rng.normal(0, scale, (hidden_dim, num_movies))
        self.b_y = np.zeros(num_movies)

    def _forward(self, x_seq: np.ndarray) -> tuple[np.ndarray, list]:
        h = np.zeros(self.hidden_dim)
        states = []
        for movie_idx in x_seq:
            x = self.E[movie_idx]
            h = np.tanh(x @ self.W_xh + h @ self.W_hh + self.b_h)
            states.append(h.copy())
        logits = h @ self.W_hy + self.b_y
        return logits, states

    def predict_proba(self, x_seq: np.ndarray) -> np.ndarray:
        logits, _ = self._forward(x_seq)
        logits = logits - np.max(logits)
        exp = np.exp(logits)
        return exp / np.sum(exp)

    def predict_top_k(self, x_seq: np.ndarray, k: int = 10, exclude: set | None = None):
        probs = self.predict_proba(x_seq)
        ranked = np.argsort(probs)[::-1]
        exclude = exclude or set()
        results = []
        for idx in ranked:
            movie_idx = int(idx)
            if movie_idx in exclude:
                continue
            results.append((movie_idx, float(probs[idx])))
            if len(results) >= k:
                break
        return results

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epochs: int = 5,
        learning_rate: float = 0.01,
        batch_size: int = 128,
    ) -> list[float]:
        losses = []
        n = len(X)
        indices = np.arange(n)

        for _ in range(epochs):
            rng = np.random.default_rng()
            rng.shuffle(indices)
            epoch_loss = 0.0

            for start in range(0, n, batch_size):
                batch_idx = indices[start : start + batch_size]
                batch_loss = 0.0

                grad_E = np.zeros_like(self.E)
                grad_W_xh = np.zeros_like(self.W_xh)
                grad_W_hh = np.zeros_like(self.W_hh)
                grad_b_h = np.zeros_like(self.b_h)
                grad_W_hy = np.zeros_like(self.W_hy)
                grad_b_y = np.zeros_like(self.b_y)

                for i in batch_idx:
                    x_seq = X[i]
                    target = y[i]
                    logits, states = self._forward(x_seq)
                    probs = self.exp_softmax(logits)
                    loss = -np.log(probs[target] + 1e-9)
                    batch_loss += loss

                    d_logits = probs.copy()
                    d_logits[target] -= 1.0

                    h_last = states[-1]
                    grad_W_hy += np.outer(h_last, d_logits)
                    grad_b_y += d_logits

                    dh = d_logits @ self.W_hy.T
                    for t in reversed(range(len(x_seq))):
                        dh_raw = dh * (1 - states[t] ** 2)
                        x = self.E[x_seq[t]]
                        grad_W_xh += np.outer(x, dh_raw)
                        grad_W_hh += (
                            np.outer(states[t - 1], dh_raw) if t > 0 else 0
                        )
                        grad_b_h += dh_raw
                        grad_E[x_seq[t]] += dh_raw @ self.W_xh.T
                        if t > 0:
                            dh = dh_raw @ self.W_hh.T
                        else:
                            dh = np.zeros(self.hidden_dim)

                count = len(batch_idx)
                scale = learning_rate / max(count, 1)
                self.E -= scale * grad_E
                self.W_xh -= scale * grad_W_xh
                self.W_hh -= scale * grad_W_hh
                self.b_h -= scale * grad_b_h
                self.W_hy -= scale * grad_W_hy
                self.b_y -= scale * grad_b_y
                epoch_loss += batch_loss / count

            losses.append(epoch_loss / max(n // batch_size, 1))

        return losses

    @staticmethod
    def exp_softmax(logits: np.ndarray) -> np.ndarray:
        logits = logits - np.max(logits)
        exp = np.exp(logits)
        return exp / np.sum(exp)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as file:
            pickle.dump(self, file)

    @staticmethod
    def load(path: Path) -> "SimpleRNNRecommender":
        with open(path, "rb") as file:
            return pickle.load(file)

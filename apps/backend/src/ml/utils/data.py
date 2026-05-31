import os
from pathlib import Path

import numpy as np
import pandas as pd

SEQUENCE_LENGTH = 3
RANDOM_SEED = 42

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "raw" / "ml-100k" / "u.data"


def load_ratings(data_path=None):
    path = Path(data_path) if data_path else DATA_PATH

    if not path.exists():
        raise FileNotFoundError(f"Dataset não encontrado: {path}")

    columns = ["user_id", "movie_id", "rating", "timestamp"]
    df = pd.read_csv(path, sep="\t", names=columns)
    return df.sort_values(by=["user_id", "timestamp"])


def build_sequences(df, sequence_length=SEQUENCE_LENGTH):
    user_sequences = {}

    for user_id, group in df.groupby("user_id"):
        user_sequences[user_id] = group["movie_id"].tolist()

    X, y = [], []

    for movies in user_sequences.values():
        if len(movies) <= sequence_length:
            continue

        for i in range(len(movies) - sequence_length):
            X.append(movies[i : i + sequence_length])
            y.append(movies[i + sequence_length])

    return np.array(X, dtype=np.int64), np.array(y, dtype=np.int64)


def split_examples(X, y, train_ratio=0.7, val_ratio=0.15, seed=RANDOM_SEED):
    if len(X) != len(y):
        raise ValueError("X e y devem ter o mesmo tamanho")

    rng = np.random.default_rng(seed)
    indices = rng.permutation(len(X))

    train_end = int(len(X) * train_ratio)
    val_end = train_end + int(len(X) * val_ratio)

    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]

    return {
        "train": (X[train_idx], y[train_idx]),
        "val": (X[val_idx], y[val_idx]),
        "test": (X[test_idx], y[test_idx]),
    }


def get_num_movies(df):
    return int(df["movie_id"].max())


def popular_movie_from_targets(y_train):
    values, counts = np.unique(y_train, return_counts=True)
    return int(values[counts.argmax()])

import json
import os
import sys
from pathlib import Path

import pandas as pd
import torch

ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from models.model import RecommenderLSTM  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent
ITEM_PATH = BASE_DIR / "../data/raw/ml-100k/u.item"
MODEL_PATH = BASE_DIR / "nextflix_lstm.pth"
CONFIG_PATH = BASE_DIR / "model_config.json"


def load_movie_titles():
    movies_df = pd.read_csv(
        ITEM_PATH,
        sep="|",
        encoding="latin-1",
        header=None,
    )
    return {int(row[0]): row[1] for _, row in movies_df.iterrows()}


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Modelo não treinado. Execute: python train.py (em {BASE_DIR})"
        )

    if CONFIG_PATH.exists():
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        num_movies = config["num_movies"]
        model = RecommenderLSTM(
            num_movies,
            embedding_dim=config.get("embedding_dim", 64),
            hidden_size=config.get("hidden_size", 128),
        )
    else:
        data_path = BASE_DIR / "../data/raw/ml-100k/u.data"
        df = pd.read_csv(data_path, sep="\t", names=["user_id", "movie_id", "rating", "timestamp"])
        num_movies = int(df["movie_id"].max())
        model = RecommenderLSTM(num_movies)

    model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    model.eval()
    return model


def predict_next(history_ids):
    model = load_model()
    history = [int(m) for m in history_ids]

    if not history:
        raise ValueError("Histórico vazio")

    input_tensor = torch.LongTensor([history])

    with torch.no_grad():
        logits = model(input_tensor)

    predicted_movie = torch.argmax(logits, dim=1).item()
    titles = load_movie_titles()
    title = titles.get(predicted_movie, "Desconhecido")
    return predicted_movie, title


if __name__ == "__main__":
    history = sys.argv[1:]
    movie_id, title = predict_next(history)
    print(f"{movie_id}|{title}")

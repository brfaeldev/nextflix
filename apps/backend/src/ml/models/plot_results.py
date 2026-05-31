"""
Gera figuras do treinamento e matriz de confusão a partir do modelo já treinado.
Uso: python plot_results.py
"""

import json
import sys
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset

ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from models.model import RecommenderLSTM  # noqa: E402
from utils.data import SEQUENCE_LENGTH, build_sequences, load_ratings, split_examples  # noqa: E402
from utils.plots import generate_all_figures  # noqa: E402

OUTPUT_DIR = Path(__file__).resolve().parent
MODEL_PATH = OUTPUT_DIR / "nextflix_lstm.pth"
CONFIG_PATH = OUTPUT_DIR / "model_config.json"


def load_test_predictions():
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    df = load_ratings()
    X, y = build_sequences(df, SEQUENCE_LENGTH)
    splits = split_examples(X, y)
    X_test, y_test = splits["test"]

    model = RecommenderLSTM(
        config["num_movies"],
        embedding_dim=config.get("embedding_dim", 64),
        hidden_size=config.get("hidden_size", 128),
    )
    model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    model.eval()

    loader = DataLoader(
        TensorDataset(torch.LongTensor(X_test), torch.LongTensor(y_test)),
        batch_size=256,
        shuffle=False,
    )

    preds = []
    with torch.no_grad():
        for batch_x, _ in loader:
            logits = model(batch_x)
            preds.append(torch.argmax(logits, dim=1).cpu().numpy())

    y_pred = np.concatenate(preds)
    return y_test, y_pred


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not MODEL_PATH.exists():
        print("Modelo não encontrado. Execute: python train.py")
        sys.exit(1)

    y_true, y_pred = load_test_predictions()
    paths = generate_all_figures(OUTPUT_DIR, y_true, y_pred)

    print("Figuras geradas em:", OUTPUT_DIR / "figures")
    for p in paths:
        print(f"  - {p.name}")


if __name__ == "__main__":
    main()

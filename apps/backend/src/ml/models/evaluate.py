"""
Avalia o modelo no conjunto de teste e compara com baselines (popular, aleatório).
Uso: python evaluate.py
"""

import json
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

ML_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_ROOT))

from models.model import RecommenderLSTM  # noqa: E402
from utils.data import (  # noqa: E402
    SEQUENCE_LENGTH,
    build_sequences,
    load_ratings,
    popular_movie_from_targets,
    split_examples,
)
from utils.metrics import evaluate_logits  # noqa: E402
from utils.plots import generate_all_figures  # noqa: E402

OUTPUT_DIR = Path(__file__).resolve().parent
MODEL_PATH = OUTPUT_DIR / "nextflix_lstm.pth"
CONFIG_PATH = OUTPUT_DIR / "model_config.json"
REPORT_PATH = OUTPUT_DIR / "evaluation_report.json"


def popular_baseline_metrics(y_true, popular_id, ks=(1, 5, 10)):
    hit_rate = float(np.mean(y_true == popular_id))
    metrics = {f"hit@{k}": round(hit_rate, 4) for k in ks}
    metrics["ndcg@10"] = round(hit_rate, 4)
    return metrics


def random_baseline_metrics(y_true, num_movies, ks=(1, 5, 10), seed=42):
    rng = np.random.default_rng(seed)
    logits = torch.tensor(rng.random((len(y_true), num_movies + 1)), dtype=torch.float32)
    targets = torch.LongTensor(y_true)
    return evaluate_logits(logits, targets, ks=ks)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not MODEL_PATH.exists():
        print(f"Modelo não encontrado. Execute primeiro: python train.py")
        sys.exit(1)

    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    df = load_ratings()
    X, y = build_sequences(df, SEQUENCE_LENGTH)
    splits = split_examples(X, y)

    X_train, y_train = splits["train"]
    X_test, y_test = splits["test"]

    num_movies = config["num_movies"]
    model = RecommenderLSTM(
        num_movies,
        embedding_dim=config.get("embedding_dim", 64),
        hidden_size=config.get("hidden_size", 128),
    )
    model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    model.eval()

    test_loader = DataLoader(
        TensorDataset(torch.LongTensor(X_test), torch.LongTensor(y_test)),
        batch_size=256,
        shuffle=False,
    )

    all_logits = []
    all_targets = []

    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            all_logits.append(model(batch_x))
            all_targets.append(batch_y)

    logits = torch.cat(all_logits)
    targets = torch.cat(all_targets)
    y_true = targets.cpu().numpy()
    y_pred = torch.argmax(logits, dim=1).cpu().numpy()
    lstm_metrics = evaluate_logits(logits, targets)

    popular_id = popular_movie_from_targets(y_train)
    popular_metrics = popular_baseline_metrics(y_test, popular_id)
    random_metrics = random_baseline_metrics(y_test, num_movies)

    report = {
        "test_samples": len(y_test),
        "split_seed": 42,
        "split_ratios": [0.7, 0.15, 0.15],
        "metrics": {
            "lstm": lstm_metrics,
            "popular_baseline": popular_metrics,
            "random_baseline": random_metrics,
        },
        "popular_movie_id": popular_id,
        "model_config": config,
    }

    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("=== Avaliação no conjunto de TESTE (não visto no treino) ===\n")
    print(f"Amostras de teste: {len(y_test)}\n")

    rows = [
        ("LSTM (Nextflix)", lstm_metrics),
        ("Baseline popular", popular_metrics),
        ("Baseline aleatório", random_metrics),
    ]

    print(f"{'Modelo':<22} {'Hit@1':>8} {'Hit@5':>8} {'Hit@10':>8} {'NDCG@10':>10}")
    print("-" * 60)

    for name, m in rows:
        print(
            f"{name:<22} {m['hit@1']:>8.4f} {m['hit@5']:>8.4f} "
            f"{m['hit@10']:>8.4f} {m['ndcg@10']:>10.4f}"
        )

    print(f"\nRelatório salvo em: {REPORT_PATH}")

    figure_paths = generate_all_figures(OUTPUT_DIR, y_true, y_pred)
    if figure_paths:
        print("\nFiguras salvas em:", OUTPUT_DIR / "figures")
        for fig_path in figure_paths:
            print(f"  - {fig_path.name}")


if __name__ == "__main__":
    main()

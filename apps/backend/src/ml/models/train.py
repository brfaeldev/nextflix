"""
Treinamento do LSTM com divisão treino/validação/teste e salvamento do melhor modelo.
Uso: python train.py [--epochs 10] [--lr 0.001] [--batch-size 64]
"""

import argparse
import json
import sys
from datetime import datetime, timezone
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
    get_num_movies,
    load_ratings,
    split_examples,
)
from utils.metrics import evaluate_logits  # noqa: E402

OUTPUT_DIR = Path(__file__).resolve().parent
MODEL_PATH = OUTPUT_DIR / "nextflix_lstm.pth"
CONFIG_PATH = OUTPUT_DIR / "model_config.json"
HISTORY_PATH = OUTPUT_DIR / "training_history.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Treina o LSTM de recomendação Nextflix")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--embedding-dim", type=int, default=64)
    parser.add_argument("--hidden-size", type=int, default=128)
    return parser.parse_args()


def make_loader(X, y, batch_size, shuffle):
    dataset = TensorDataset(
        torch.LongTensor(X),
        torch.LongTensor(y),
    )
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train(is_train)
    total_loss = 0.0
    all_logits = []
    all_targets = []

    for batch_x, batch_y in loader:
        if is_train:
            optimizer.zero_grad()

        logits = model(batch_x)
        loss = criterion(logits, batch_y)

        if is_train:
            loss.backward()
            optimizer.step()

        total_loss += loss.item() * len(batch_y)
        all_logits.append(logits.detach())
        all_targets.append(batch_y)

    logits_cat = torch.cat(all_logits)
    targets_cat = torch.cat(all_targets)
    metrics = evaluate_logits(logits_cat, targets_cat)
    avg_loss = total_loss / len(loader.dataset)

    return avg_loss, metrics


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    args = parse_args()
    df = load_ratings()
    num_movies = get_num_movies(df)
    X, y = build_sequences(df, SEQUENCE_LENGTH)
    splits = split_examples(X, y)

    X_train, y_train = splits["train"]
    X_val, y_val = splits["val"]
    X_test, y_test = splits["test"]

    print("Dataset MovieLens 100k")
    print(f"  Exemplos totais: {len(X)}")
    print(f"  Treino: {len(X_train)} | Validação: {len(X_val)} | Teste: {len(X_test)}")
    print(f"  Filmes no vocabulário: {num_movies}")

    train_loader = make_loader(X_train, y_train, args.batch_size, shuffle=True)
    val_loader = make_loader(X_val, y_val, args.batch_size, shuffle=False)

    model = RecommenderLSTM(
        num_movies,
        embedding_dim=args.embedding_dim,
        hidden_size=args.hidden_size,
    )
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    history = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "hyperparameters": vars(args),
        "split": {
            "train": len(X_train),
            "val": len(X_val),
            "test": len(X_test),
            "ratios": [0.7, 0.15, 0.15],
            "seed": 42,
        },
        "epochs": [],
    }

    best_val_hit10 = -1.0
    best_state = None

    for epoch in range(1, args.epochs + 1):
        train_loss, train_metrics = run_epoch(
            model, train_loader, criterion, optimizer
        )
        val_loss, val_metrics = run_epoch(model, val_loader, criterion)

        epoch_record = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "val_loss": round(val_loss, 4),
            "train": train_metrics,
            "val": val_metrics,
        }
        history["epochs"].append(epoch_record)

        print(
            f"Epoch {epoch}/{args.epochs} | "
            f"train_loss={train_loss:.4f} val_loss={val_loss:.4f} | "
            f"val Hit@10={val_metrics['hit@10']:.4f} val NDCG@10={val_metrics['ndcg@10']:.4f}"
        )

        if val_metrics["hit@10"] > best_val_hit10:
            best_val_hit10 = val_metrics["hit@10"]
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    if best_state is None:
        best_state = model.state_dict()

    torch.save(best_state, MODEL_PATH)

    config = {
        "num_movies": num_movies,
        "sequence_length": SEQUENCE_LENGTH,
        "embedding_dim": args.embedding_dim,
        "hidden_size": args.hidden_size,
        "hyperparameters": vars(args),
        "best_val_hit@10": best_val_hit10,
        "model_file": MODEL_PATH.name,
    }

    CONFIG_PATH.write_text(json.dumps(config, indent=2), encoding="utf-8")
    history["finished_at"] = datetime.now(timezone.utc).isoformat()
    history["best_val_hit@10"] = best_val_hit10
    HISTORY_PATH.write_text(json.dumps(history, indent=2), encoding="utf-8")

    print(f"\nMelhor modelo salvo em: {MODEL_PATH}")
    print(f"Configuração: {CONFIG_PATH}")
    print(f"Histórico de treino: {HISTORY_PATH}")


if __name__ == "__main__":
    main()

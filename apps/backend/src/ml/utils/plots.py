"""
Gráficos do treinamento e matriz de confusão (top-N filmes mais frequentes no teste).
"""

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix

FIGURES_DIR_NAME = "figures"
TOP_N_MOVIES = 12


def _figures_dir(output_dir: Path) -> Path:
    path = output_dir / FIGURES_DIR_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_movie_titles(item_path: Path) -> dict:
    if not item_path.exists():
        return {}

    df = pd.read_csv(
        item_path,
        sep="|",
        encoding="latin-1",
        header=None,
    )
    titles = {}
    for _, row in df.iterrows():
        movie_id = int(row[0])
        title = str(row[1])
        if len(title) > 28:
            title = f"{title[:25]}..."
        titles[movie_id] = title
    return titles


def plot_training_history(history_path: Path, output_dir: Path) -> list[Path]:
    history = json.loads(history_path.read_text(encoding="utf-8"))
    epochs = [e["epoch"] for e in history["epochs"]]
    train_loss = [e["train_loss"] for e in history["epochs"]]
    val_loss = [e["val_loss"] for e in history["epochs"]]
    val_hit10 = [e["val"]["hit@10"] for e in history["epochs"]]
    val_ndcg10 = [e["val"]["ndcg@10"] for e in history["epochs"]]

    fig_dir = _figures_dir(output_dir)
    saved = []

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, train_loss, marker="o", label="Treino")
    ax.plot(epochs, val_loss, marker="o", label="Validação")
    ax.set_xlabel("Época")
    ax.set_ylabel("Loss (CrossEntropy)")
    ax.set_title("Nextflix LSTM — Loss por época")
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    loss_path = fig_dir / "training_loss.png"
    fig.savefig(loss_path, dpi=150)
    plt.close(fig)
    saved.append(loss_path)

    fig, ax1 = plt.subplots(figsize=(8, 5))
    ax1.plot(epochs, val_hit10, marker="s", color="#e50914", label="Hit@10 (val)")
    ax1.set_xlabel("Época")
    ax1.set_ylabel("Hit@10")
    ax1.set_title("Nextflix LSTM — Métricas de validação")
    ax1.grid(True, alpha=0.3)

    ax2 = ax1.twinx()
    ax2.plot(epochs, val_ndcg10, marker="^", color="#1f77b4", label="NDCG@10 (val)")
    ax2.set_ylabel("NDCG@10")

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="lower right")

    fig.tight_layout()
    metrics_path = fig_dir / "training_metrics.png"
    fig.savefig(metrics_path, dpi=150)
    plt.close(fig)
    saved.append(metrics_path)

    return saved


def plot_baselines_comparison(report_path: Path, output_dir: Path) -> Path:
    report = json.loads(report_path.read_text(encoding="utf-8"))
    metrics = report["metrics"]

    labels = ["LSTM", "Popular", "Aleatório"]
    keys = ["lstm", "popular_baseline", "random_baseline"]
    hit10 = [metrics[k]["hit@10"] for k in keys]
    ndcg10 = [metrics[k]["ndcg@10"] for k in keys]

    x = np.arange(len(labels))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x - width / 2, hit10, width, label="Hit@10", color="#e50914")
    ax.bar(x + width / 2, ndcg10, width, label="NDCG@10", color="#444444")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("Score")
    ax.set_title("Comparação no conjunto de TESTE")
    ax.legend()
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()

    fig_dir = _figures_dir(output_dir)
    path = fig_dir / "baselines_comparison.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return path


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    movie_titles: dict,
    output_dir: Path,
    top_n: int = TOP_N_MOVIES,
) -> tuple[Path, Path, Path]:
    """
    Matriz de confusão nos top-N filmes mais frequentes no conjunto de teste.
    (Matriz 1682×1682 seria ilegível; esta é a prática usual em multiclasse.)
    """
    unique, counts = np.unique(y_true, return_counts=True)
    top_labels = unique[np.argsort(-counts)][:top_n]
    top_labels = sorted(top_labels.tolist())

    mask = np.isin(y_true, top_labels)
    y_true_sub = y_true[mask]
    y_pred_sub = y_pred[mask]

    cm = confusion_matrix(y_true_sub, y_pred_sub, labels=top_labels)
    row_sums = cm.sum(axis=1, keepdims=True)
    cm_norm = np.divide(
        cm.astype(float),
        row_sums,
        where=row_sums > 0,
        out=np.zeros_like(cm, dtype=float),
    )

    tick_labels = [
        f"{mid}\n{movie_titles.get(mid, '?')}" for mid in top_labels
    ]

    fig_dir = _figures_dir(output_dir)
    json_path = fig_dir / "confusion_matrix.json"
    json_path.write_text(
        json.dumps(
            {
                "note": (
                    f"Matriz {top_n}×{top_n} nos filmes mais frequentes no teste. "
                    "Linha = filme real; coluna = filme previsto."
                ),
                "labels": top_labels,
                "label_titles": [movie_titles.get(i, "?") for i in top_labels],
                "matrix_counts": cm.tolist(),
                "matrix_normalized_rows": np.round(cm_norm, 4).tolist(),
                "samples_in_matrix": int(len(y_true_sub)),
                "total_test_samples": int(len(y_true)),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    saved_paths = []

    for matrix, title, filename, fmt in [
        (cm, "Matriz de confusão (contagens)", "confusion_matrix.png", "d"),
        (
            cm_norm,
            "Matriz de confusão (normalizada por linha, % do real)",
            "confusion_matrix_normalized.png",
            ".0%",
        ),
    ]:
        fig, ax = plt.subplots(figsize=(12, 10))
        im = ax.imshow(matrix, cmap="YlOrRd" if fmt == "d" else "Blues", aspect="auto")
        ax.set_xticks(range(len(top_labels)))
        ax.set_yticks(range(len(top_labels)))
        ax.set_xticklabels(tick_labels, rotation=45, ha="right", fontsize=7)
        ax.set_yticklabels(tick_labels, fontsize=7)
        ax.set_xlabel("Filme previsto (próximo na sequência)")
        ax.set_ylabel("Filme real (próximo na sequência)")
        ax.set_title(
            f"{title}\nTop {top_n} filmes no teste — {len(y_true_sub)} amostras"
        )

        thresh = matrix.max() / 2 if matrix.max() > 0 else 0
        for i in range(matrix.shape[0]):
            for j in range(matrix.shape[1]):
                val = matrix[i, j]
                if fmt == "d":
                    text = str(int(val)) if val > 0 else ""
                else:
                    text = f"{val:.0%}" if val > 0.01 else ""
                color = "white" if val > thresh else "black"
                ax.text(j, i, text, ha="center", va="center", color=color, fontsize=7)

        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        fig.tight_layout()
        path = fig_dir / filename
        fig.savefig(path, dpi=150)
        plt.close(fig)
        saved_paths.append(path)

    return saved_paths[0], saved_paths[1], json_path


def generate_all_figures(
    output_dir: Path,
    y_true: np.ndarray | None = None,
    y_pred: np.ndarray | None = None,
) -> list[Path]:
    output_dir = Path(output_dir)
    history_path = output_dir / "training_history.json"
    report_path = output_dir / "evaluation_report.json"
    item_path = output_dir.parent / "data" / "raw" / "ml-100k" / "u.item"

    saved = []

    if history_path.exists():
        saved.extend(plot_training_history(history_path, output_dir))

    if report_path.exists():
        saved.append(plot_baselines_comparison(report_path, output_dir))

    if y_true is not None and y_pred is not None:
        titles = load_movie_titles(item_path)
        cm_paths = plot_confusion_matrix(y_true, y_pred, titles, output_dir)
        saved.extend(cm_paths[:2])

    return saved

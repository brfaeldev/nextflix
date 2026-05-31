import numpy as np
import torch


def hit_at_k(logits, targets, k=10):
    """Proporção de exemplos em que o alvo aparece no top-K."""
    if len(targets) == 0:
        return 0.0

    top_k = torch.topk(logits, k, dim=1).indices.cpu().numpy()
    targets_np = targets.cpu().numpy()
    hits = sum(target in row for target, row in zip(targets_np, top_k))
    return hits / len(targets_np)


def ndcg_at_k(logits, targets, k=10):
    """NDCG@K médio para recomendação com um único item relevante."""
    if len(targets) == 0:
        return 0.0

    top_k = torch.topk(logits, k, dim=1).indices.cpu().numpy()
    targets_np = targets.cpu().numpy()
    scores = []

    for target, row in zip(targets_np, top_k):
        if target not in row:
            scores.append(0.0)
            continue
        rank = int(np.where(row == target)[0][0]) + 1
        scores.append(1.0 / np.log2(rank + 1))

    return float(np.mean(scores))


def evaluate_logits(logits, targets, ks=(1, 5, 10)):
    metrics = {}

    for k in ks:
        metrics[f"hit@{k}"] = round(hit_at_k(logits, targets, k), 4)

    metrics["ndcg@10"] = round(ndcg_at_k(logits, targets, 10), 4)
    return metrics

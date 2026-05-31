"""
Experimentos variando hiperparâmetros (requisito de experimentação do roteiro).
Uso: python experiment.py
"""

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

EXPERIMENTS = [
    {"epochs": 5, "lr": 0.001, "batch_size": 64},
    {"epochs": 10, "lr": 0.001, "batch_size": 64},
    {"epochs": 10, "lr": 0.0005, "batch_size": 128},
]

MODELS_DIR = Path(__file__).resolve().parent
RESULTS_PATH = MODELS_DIR / "experiments_results.json"


def run_one(params):
    cmd = [
        sys.executable,
        str(MODELS_DIR / "train.py"),
        "--epochs",
        str(params["epochs"]),
        "--lr",
        str(params["lr"]),
        "--batch-size",
        str(params["batch_size"]),
    ]
    subprocess.run(cmd, check=True)

    evaluate = subprocess.run(
        [sys.executable, str(MODELS_DIR / "evaluate.py")],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    report = json.loads(
        (MODELS_DIR / "evaluation_report.json").read_text(encoding="utf-8")
    )
    history = json.loads(
        (MODELS_DIR / "training_history.json").read_text(encoding="utf-8")
    )

    return {
        "params": params,
        "test_metrics": report["metrics"]["lstm"],
        "best_val_hit@10": history.get("best_val_hit@10"),
        "evaluate_stdout": evaluate.stdout,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    results = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "runs": [],
    }

    for i, params in enumerate(EXPERIMENTS, start=1):
        print(f"\n>>> Experimento {i}/{len(EXPERIMENTS)}: {params}")
        record = run_one(params)
        results["runs"].append(record)
        print(f"    Test Hit@10 = {record['test_metrics']['hit@10']}")

    best = max(results["runs"], key=lambda r: r["test_metrics"]["hit@10"])
    results["best_run"] = best
    results["finished_at"] = datetime.now(timezone.utc).isoformat()

    RESULTS_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nResultados consolidados em: {RESULTS_PATH}")
    print(
        f"Melhor configuração: {best['params']} "
        f"(Hit@10 teste = {best['test_metrics']['hit@10']})"
    )


if __name__ == "__main__":
    main()

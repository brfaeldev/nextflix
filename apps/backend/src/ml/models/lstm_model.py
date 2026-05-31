"""
Script legado — redireciona para o pipeline de treinamento com validação.
Prefira: python train.py
"""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    train_script = Path(__file__).resolve().parent / "train.py"
    print("Use o pipeline completo de treino (treino/val/teste + métricas).")
    print(f"Executando: {train_script}\n")
    sys.exit(subprocess.call([sys.executable, str(train_script), *sys.argv[1:]]))

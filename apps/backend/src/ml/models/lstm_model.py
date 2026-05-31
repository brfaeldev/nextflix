import pandas as pd
import numpy as np
import os

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# ====================================
# CARREGAR DATASET
# ====================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "../data/raw/ml-100k/u.data"
)

columns = ["user_id", "movie_id", "rating", "timestamp"]

df = pd.read_csv(
    DATA_PATH,
    sep="\t",
    names=columns
)

# ====================================
# ORDENAR DADOS
# ====================================

df = df.sort_values(by=["user_id", "timestamp"])

# ====================================
# CRIAR SEQUÊNCIAS
# ====================================

user_sequences = {}

for user_id, group in df.groupby("user_id"):

    movies = group["movie_id"].tolist()

    user_sequences[user_id] = movies

# ====================================
# PREPARAR TREINO
# ====================================

sequence_length = 3

X = []
y = []

for movies in user_sequences.values():

    if len(movies) <= sequence_length:
        continue

    for i in range(len(movies) - sequence_length):

        X.append(movies[i:i + sequence_length])

        y.append(movies[i + sequence_length])

X = np.array(X)
y = np.array(y)

print("Dados preparados ✅")
print("X shape:", X.shape)
print("y shape:", y.shape)

# ====================================
# TRANSFORMAR EM TENSORES
# ====================================

X_tensor = torch.LongTensor(X)
y_tensor = torch.LongTensor(y)

dataset = TensorDataset(X_tensor, y_tensor)

dataloader = DataLoader(
    dataset,
    batch_size=64,
    shuffle=True
)

# ====================================
# MODELO LSTM
# ====================================

class RecommenderLSTM(nn.Module):

    def __init__(self, num_movies):

        super().__init__()

        self.embedding = nn.Embedding(
            num_movies + 1,
            64
        )

        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=128,
            batch_first=True
        )

        self.fc = nn.Linear(
            128,
            num_movies + 1
        )

    def forward(self, x):

        x = self.embedding(x)

        output, (hidden, cell) = self.lstm(x)

        hidden = hidden[-1]

        out = self.fc(hidden)

        return out

# ====================================
# INICIALIZAR MODELO
# ====================================

num_movies = df["movie_id"].max()

model = RecommenderLSTM(num_movies)

print("\nModelo criado ✅")

# ====================================
# LOSS E OTIMIZADOR
# ====================================

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.001
)

# ====================================
# TREINAMENTO
# ====================================

epochs = 3

for epoch in range(epochs):

    total_loss = 0

    for batch_X, batch_y in dataloader:

        optimizer.zero_grad()

        outputs = model(batch_X)

        loss = criterion(outputs, batch_y)

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1} | Loss: {total_loss:.4f}")

print("\nTreinamento concluído 🚀")

# ====================================
# SALVAR MODELO
# ====================================

MODEL_PATH = os.path.join(
    BASE_DIR,
    "nextflix_lstm.pth"
)

torch.save(
    model.state_dict(),
    MODEL_PATH
)

print("\nModelo salvo ✅")
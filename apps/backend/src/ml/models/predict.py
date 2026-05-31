import torch
import torch.nn as nn
import pandas as pd
import os
import sys

# ====================================
# UTF-8
# ====================================

sys.stdout.reconfigure(encoding='utf-8')

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
# CAMINHOS
# ====================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "../data/raw/ml-100k/u.data"
)

ITEM_PATH = os.path.join(
    BASE_DIR,
    "../data/raw/ml-100k/u.item"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "nextflix_lstm.pth"
)

# ====================================
# CARREGAR FILMES
# ====================================

movies_df = pd.read_csv(
    ITEM_PATH,
    sep="|",
    encoding="latin-1",
    header=None
)

movie_titles = {}

for _, row in movies_df.iterrows():

    movie_id = row[0]
    movie_title = row[1]

    movie_titles[movie_id] = movie_title

# ====================================
# CARREGAR DATASET
# ====================================

columns = [
    "user_id",
    "movie_id",
    "rating",
    "timestamp"
]

df = pd.read_csv(
    DATA_PATH,
    sep="\t",
    names=columns
)

num_movies = df["movie_id"].max()

# ====================================
# CARREGAR MODELO
# ====================================

model = RecommenderLSTM(num_movies)

model.load_state_dict(
    torch.load(MODEL_PATH)
)

model.eval()

# ====================================
# HISTÓRICO VINDO DO NODE
# ====================================

history = sys.argv[1:]

history = [
    int(movie)
    for movie in history
]

input_tensor = torch.LongTensor(
    [history]
)

# ====================================
# PREVISÃO
# ====================================

with torch.no_grad():

    prediction = model(input_tensor)

predicted_movie = torch.argmax(
    prediction,
    dim=1
).item()

# ====================================
# RESULTADO FINAL
# ====================================

recommended_title = movie_titles.get(
    predicted_movie,
    "Desconhecido"
)

print(f"{predicted_movie}|{recommended_title}")
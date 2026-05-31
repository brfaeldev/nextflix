import torch
import torch.nn as nn


class RecommenderLSTM(nn.Module):
    """RNN (LSTM) para prever o próximo filme dado uma sequência de IDs."""

    def __init__(self, num_movies, embedding_dim=64, hidden_size=128):
        super().__init__()
        self.num_movies = num_movies
        self.embedding = nn.Embedding(num_movies + 1, embedding_dim)
        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_size,
            batch_first=True,
        )
        self.fc = nn.Linear(hidden_size, num_movies + 1)

    def forward(self, x):
        x = self.embedding(x)
        _, (hidden, _) = self.lstm(x)
        hidden = hidden[-1]
        return self.fc(hidden)

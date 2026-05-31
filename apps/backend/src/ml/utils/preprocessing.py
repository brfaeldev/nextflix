import pandas as pd
import os

# Caminho absoluto do arquivo atual
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Caminho do dataset
DATA_PATH = os.path.join(
    BASE_DIR,
    "../data/raw/ml-100k/u.data"
)

# Ler dataset
columns = ["user_id", "movie_id", "rating", "timestamp"]

df = pd.read_csv(
    DATA_PATH,
    sep="\t",
    names=columns
)

print("Dataset carregado ✅")
print(df.head())

# Ordenar por usuário e tempo
df = df.sort_values(by=["user_id", "timestamp"])

print("\nDataset ordenado ✅")
print(df.head())

# Criar sequências por usuário
user_sequences = {}

for user_id, group in df.groupby("user_id"):

    movies = group["movie_id"].tolist()

    user_sequences[user_id] = movies

print("\nExemplo de sequência:")
print(user_sequences[1][:10])

# ====================================
# CRIAR DADOS DE TREINO
# ====================================

sequence_length = 3

X = []
y = []

for movies in user_sequences.values():

    # Ignorar usuários com poucas interações
    if len(movies) <= sequence_length:
        continue

    for i in range(len(movies) - sequence_length):

        input_sequence = movies[i:i + sequence_length]

        target_movie = movies[i + sequence_length]

        X.append(input_sequence)
        y.append(target_movie)

print("\nDados de treino criados ✅")

print(f"Total de exemplos: {len(X)}")

print("\nExemplo:")
print("Entrada:", X[0])
print("Saída:", y[0])
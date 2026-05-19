from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "apps" / "api" / "data" / "nextflix.db"
MOVIELENS_DIR = ROOT / "data" / "movielens" / "ml-100k"
MODELS_DIR = ROOT / "models"
PROCESSED_DIR = ROOT / "data" / "processed"

WINDOW_SIZE = 3
MIN_RATING = 4.0
TOP_K = 10
EMBED_DIM = 64
RNN_UNITS = 128
EPOCHS = 3
BATCH_SIZE = 128
ML_SERVICE_URL = "http://localhost:5001"

GENRES = [
    "Unknown",
    "Action",
    "Adventure",
    "Animation",
    "Children",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Fantasy",
    "Film-Noir",
    "Horror",
    "Musical",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "War",
    "Western",
]

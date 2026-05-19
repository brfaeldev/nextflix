"""
Serviço FastAPI de recomendações (porta 5001).
Uso: uvicorn ml.serve:app --reload --port 5001
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from ml.recomendacao import (
        predict_next_movies,
        recommend_for_user,
        reload_model,
        update_cache,
    )
except ImportError:
    from recomendacao import (
        predict_next_movies,
        recommend_for_user,
        reload_model,
        update_cache,
    )

app = FastAPI(title="Nextflix ML")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    user_id: int
    top_k: int = 10


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(body: PredictRequest):
    try:
        movie_ids = predict_next_movies(body.user_id, body.top_k)
        movies = recommend_for_user(body.user_id, body.top_k)
        update_cache(body.user_id, movie_ids)
        return {"user_id": body.user_id, "movies": movies}
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/reload")
def reload():
    reload_model()
    return {"reloaded": True}

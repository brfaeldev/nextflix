# Nextflix

Sistema de recomendação de filmes com RNN (janela deslizante) treinada no MovieLens 100k, demo web em vanilla JS e API Node + SQLite.

## Pré-requisitos

- Node.js 18+
- Python 3.10+ (testado em 3.14 com RNN em NumPy)

## Configuração

```bash
cp .env.example .env
# Opcional: TMDB_API_KEY para capas dos filmes
```

## Instalação

```bash
cd apps/api && npm install && cd ../..
pip install -r ml/requirements.txt
```

## Dados e modelo

```bash
python -m ml.carregar_dados   # baixa MovieLens e popula o banco
python -m ml.modelo           # treina a RNN
python -m ml.avaliacao        # métricas Hit@5 / Hit@10
python -m ml.enrich_catalog   # posters TMDB (opcional)
```

## Executar a demo

Três terminais:

```bash
npm run api    # http://localhost:3000
npm run ml     # http://localhost:5001
npm run web    # http://localhost:5500
```

Fluxo: cadastro → login → curtir filmes → recomendações personalizadas.

Botão **Atualizar recomendações** na home dispara `python -m ml.retrain_job`.

## Estrutura

- `apps/web` — frontend HTML/CSS/JS
- `apps/api` — API Express + SQLite
- `ml/` — pipeline RNN, FastAPI de inferência
- `data/` — MovieLens (gitignored)
- `models/` — modelo treinado (gitignored)

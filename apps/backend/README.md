# Nextflix — Backend

API REST em **Node.js + Express** com banco **SQLite**, autenticação **JWT** e integração com modelo **LSTM** (Python/PyTorch) para recomendação de filmes.

---

## Como executar

```bash
cd apps/backend
npm install
cp .env.example .env
npm run dev
```

Servidor: **http://localhost:3000**

### Variáveis de ambiente (`.env`)

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta da API (padrão 3000) |
| `JWT_SECRET` | Segredo para tokens JWT |
| `TMDB_API_KEY` | Opcional — enriquece posters/backdrop/sinopse |

Na primeira subida, o servidor:

1. Cria tabelas SQLite (`database/init.js`)
2. Importa filmes do MovieLens se o catálogo estiver vazio (`database/seed.js`)
3. Atualiza até 40 posters via TMDB (`posterService`)

---

## Estrutura

```
backend/
├── package.json
├── .env.example
├── scripts/
│   ├── seed-movies.js      # reimportar catálogo
│   └── fetch-posters.js    # buscar posters TMDB
└── src/
    ├── server.js           # entrada Express
    ├── database/
    │   ├── init.js         # schema
    │   ├── seed.js         # MovieLens → SQLite
    │   └── connection.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── routes/
    ├── controllers/
    ├── services/
    ├── utils/
    │   └── historyUtils.js # sequência para o LSTM
    └── ml/                 # pipeline PyTorch (ver TREINAMENTO.md)
```

---

## Banco de dados (SQLite)

Arquivo gerado em runtime (ex.: `database.sqlite` na pasta do backend).

| Tabela | Campos principais |
|--------|-------------------|
| `users` | id, name, email, password (hash bcrypt) |
| `movies` | id, title, genre, year, poster — IDs alinhados ao MovieLens |
| `interactions` | user_id, movie_id, event_type, duration, created_at |
| `ratings` | user_id, movie_id, rating (+1 curtida, -1 dislike) |

---

## Rotas da API

### Autenticação — `/auth`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/register` | Não | Criar conta |
| POST | `/login` | Não | Login → `{ token, user }` |
| GET | `/me` | Sim | Dados do usuário |
| PATCH | `/profile` | Sim | Atualizar nome, email, senha |

### Filmes — `/movies`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista (`?limit=&offset=`) |
| GET | `/trending` | Em alta por interações |
| GET | `/search?q=` | Busca por título |
| GET | `/genre/:genre` | Por gênero |
| GET | `/:id` | Filme por ID |
| GET | `/:id/details` | Detalhe + similar + TMDB |

### Interações — `/interactions`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/` | Registrar click/hover/like |
| GET | `/me` | Histórico do usuário (até 20 IDs) |

### Avaliações — `/ratings`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/` | Curtir ou dislike |
| GET | `/me/likes` | Filmes curtidos (Minha Lista) |
| GET | `/me/:movieId` | Avaliação em um filme |

### Recomendação — `/recommendation`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Filme recomendado para o usuário logado |

Resposta inclui `source`:

- `lstm` — modelo previu
- `lstm_filtered` — trocado por similar se era dislike
- `fallback` — poucas interações ou erro no Python

---

## Fluxo de recomendação

```
GET /recommendation/me
        │
        ▼
  getUserHistory + getUserLikes/Dislikes
        │
        ▼
  buildSequenceWithRatings() → 3 movie_ids
        │
        ├─ < 3 itens → getTrendingMovies (fallback)
        │
        └─ ≥ 3 itens → exec python predict.py id1 id2 id3
                              │
                              ▼
                        getMovieById + filtro dislike
```

Arquivos chave:

- `controllers/recommendationController.js`
- `services/recommendationService.js` — chama `ml/models/predict.py`
- `utils/historyUtils.js` — monta sequência de 3 filmes

---

## Scripts npm

| Script | Função |
|--------|--------|
| `npm run dev` | API com nodemon |
| `npm start` | API produção |
| `npm run seed` | Reimportar filmes MovieLens |
| `npm run seed:posters` | Atualizar posters TMDB |
| `npm run ml:train` | Treinar LSTM |
| `npm run ml:evaluate` | Métricas + figuras |
| `npm run ml:experiment` | 3 experimentos de hiperparâmetros |
| `npm run ml:pipeline` | train + evaluate |
| `npm run ml:plots` | Só regenerar gráficos |

Detalhes do ML: [TREINAMENTO.md](./TREINAMENTO.md)

---

## Segurança

- Senhas com **bcrypt**
- Rotas protegidas com `authMiddleware` (Bearer JWT)
- Não commitar `.env` (está no `.gitignore`)

---

## Dependências Node

- `express`, `cors`, `dotenv`
- `sqlite3`
- `jsonwebtoken`, `bcryptjs`

Python (ML): ver `src/ml/requirements.txt`

---

## Relacionado

- [README principal](../../README.md)
- [Frontend](../frontend/README.md)
- [Treinamento LSTM](./TREINAMENTO.md)

# Nextflix — Estrutura completa do projeto

> Mapa detalhado de **cada pasta e arquivo** do repositório.  
> Trabalho prático da disciplina **Inteligência Artificial II**.  
> **Autores:** Bruno Rafael Barbosa, João Pedro Magrin, Ryan Augusto Dias

---

## Visão geral

O **Nextflix** é uma plataforma web estilo streaming com recomendação personalizada de filmes usando uma rede neural recorrente (**LSTM**). O catálogo vem do dataset **MovieLens 100k**; a IA é treinada offline e, no app, o histórico real de cada usuário alimenta a inferência.

| Camada | Tecnologia | Porta |
|--------|------------|-------|
| Frontend | HTML5, CSS3, JavaScript (ES modules) | 5500 |
| Backend | Node.js, Express 5, SQLite | 3000 |
| IA | Python, PyTorch, LSTM | subprocess |
| Auth | JWT + bcrypt | — |
| Extras | TMDB API (posters, sinopse) | opcional |

```
┌─────────────────┐      HTTP/JSON       ┌─────────────────┐
│  Frontend       │ ◄──────────────────► │  Backend (API)  │
│  HTML + JS      │                      │  Node + Express │
│  porta 5500     │                      │  porta 3000     │
└─────────────────┘                      └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
             ┌────────────┐              ┌────────────┐              ┌────────────┐
             │  SQLite    │              │  Python    │              │  TMDB API  │
             │  usuários, │              │  LSTM      │              │  (posters) │
             │  filmes,   │              │  predict   │              │  opcional  │
             │  interações│              │  .py       │              └────────────┘
             └────────────┘              └────────────┘
```

---

## Árvore do repositório

```
nextflix/
├── README.md                    # Visão geral, como rodar, métricas do modelo
├── ESTRUTURA.md                 # Este arquivo — mapa completo pasta a pasta
├── package.json                 # Metadados do monorepo (scripts placeholder)
├── .gitignore                   # Ignora node_modules, .env, cache Python, etc.
└── apps/
    ├── frontend/                # Interface web estática
    └── backend/                 # API REST + banco + pipeline ML
```

---

## Raiz (`nextflix/`)

| Arquivo | O que faz |
|---------|-----------|
| `README.md` | Documento principal: objetivo do projeto, arquitetura, pré-requisitos, comandos para subir backend/frontend, treinar o LSTM, links para docs dos módulos e tabela de métricas (Hit@10, NDCG@10). |
| `ESTRUTURA.md` | Inventário completo de pastas e arquivos (este documento). |
| `package.json` | Nome do projeto (`nextflix`), versão, autores, licença ISC. Scripts `start` e `test` são placeholders que apontam para os READMEs das apps. |
| `.gitignore` | Exclui do Git: `node_modules/`, `.env`, `sqlite.db`, `__pycache__/`, `venv/`, pastas de build, logs npm, arquivos de OS/VSCode. |

---

## Frontend (`apps/frontend/`)

Interface web estática servida com **http-server** na porta **5500**. Comunica com a API em `http://localhost:3000` (configurável em `js/config.js`).

### Configuração e documentação

| Arquivo | O que faz |
|---------|-----------|
| `package.json` | Script `dev`: `npx http-server . -p 5500 -c-1` (desabilita cache no desenvolvimento). |
| `README.md` | Documentação do frontend: stack, estrutura, fluxos de páginas, autenticação, recomendações, interações rastreadas, busca e carrosséis. |
| `favicon.svg` | Ícone do site: quadrado escuro com a letra "N" em vermelho. |

### Páginas HTML

| Arquivo | O que faz | Script de entrada |
|---------|-----------|-------------------|
| `index.html` | Landing pública: hero, call-to-action para login/cadastro, barra de busca e prévia de filmes em alta. | `js/main.js` |
| `login.html` | Formulário de login (email + senha). | `js/pages/login.js` |
| `registrer.html` | Formulário de cadastro (nome, email, senha, confirmação). Nome do arquivo com typo intencional ("registrer"). | `js/pages/registrer.js` |
| `home.html` | Página inicial do usuário logado: hero com filme recomendado pelo LSTM, fileiras de populares/em alta/semelhantes, botão para atualizar recomendação. | `js/pages/home.js` |
| `filmes.html` | Catálogo organizado em carrosséis por gênero (Ação, Comédia, Drama, etc.). | `js/pages/filmes.js` |
| `minha-lista.html` | Lista de filmes curtidos pelo usuário (👍). | `js/pages/minha-lista.js` |
| `movie.html` | Detalhe do filme: poster, sinopse, backdrop, botões Gostei/Não gostei, filmes similares. | `js/pages/movie.js` |
| `perfil.html` | Configurações do perfil: editar nome, email e senha. | `js/pages/perfil.js` |

### Estilos

| Arquivo | O que faz |
|---------|-----------|
| `css/style.css` | Folha de estilos global (~946 linhas): tema escuro estilo streaming, navbar, hero banner, carrosséis horizontais, dropdown de busca, formulários de login/cadastro, página de detalhe do filme, layout de perfil, responsividade mobile. |

### JavaScript compartilhado (`js/`)

| Arquivo | O que faz | Exports principais |
|---------|-----------|-------------------|
| `config.js` | Define a URL base da API. | `API_BASE_URL` |
| `auth.js` | Gerencia sessão JWT no `localStorage` (`nextflix_token`, `nextflix_user`). | `saveSession`, `getToken`, `getUser`, `isLoggedIn`, `logout`, `requireAuth`, `redirectIfLoggedIn` |
| `api.js` | Wrapper `fetch` com header Bearer + funções REST para todos os endpoints. | `apiFetch`, `getMovies`, `getTrendingMovies`, `searchMovies`, `getMovieById`, `getMovieDetails`, `getRecommendation`, `getMyInteractions`, `rateMovie`, `getMyRating`, `getMyLikedMovies`, `sendInteraction`, `loginRequest`, `registerRequest`, `getMe`, `updateProfile`, `getMoviesByGenre` |
| `main.js` | Lógica da landing: inicializa busca e renderiza fileira de trending. | — |
| `movies.js` | Renderização de cartões de filme e fileiras/carrosséis horizontais. | `renderMovieCard`, `renderMovieRow`, `renderCarouselRow`, `formatHistoryTitles`, `truncate` |
| `navigation.js` | Navegação para detalhe do filme via hash (`movie.html#123`). | `navigateToMovie`, `normalizeMovieId`, `normalizeMovie`, `getMovieIdFromUrl` |
| `navbar.js` | Destaca link ativo na navbar e scroll para seção `#catalogo`. | `initMainNav`, `scrollToCatalog`, `handleCatalogHash` |
| `search.js` | Busca ao vivo com debounce na navbar. | `initSearchBar` |
| `interactions.js` | Rastreia cliques e hovers nos cartazes (envia para API se logado). | `trackClick`, `trackHoverStart`, `trackHoverEnd`, `attachMovieTracking` |
| `profile-menu.js` | Dropdown do menu de perfil (Configurações / Sair). | `initProfileMenu` |

### JavaScript por página (`js/pages/`)

| Arquivo | O que faz |
|---------|-----------|
| `login.js` | Submete login, salva sessão no `localStorage`, redireciona para `home.html`. |
| `registrer.js` | Submete cadastro com validação de confirmação de senha, redireciona para login ou home. |
| `home.js` | Carrega hero com recomendação LSTM, fileiras populares/em alta/semelhantes, histórico de interações, botão "Atualizar recomendação". Usa `sessionStorage` para refresh após curtida. |
| `filmes.js` | Carrega 8 carrosséis por gênero via `GET /movies/genre/:genre`. Define `GENRES` e `GENRE_LABELS`. |
| `minha-lista.js` | Busca filmes curtidos (`GET /ratings/me/likes`) e renderiza carrossel. |
| `movie.js` | Carrega detalhe do filme, exibe sinopse/backdrop, gerencia like/dislike, renderiza similares. Marca flag de refresh da recomendação após avaliar. |
| `perfil.js` | Carrega dados do usuário (`GET /auth/me`) e permite atualizar perfil (`PATCH /auth/profile`). |

---

## Backend (`apps/backend/`)

API REST em **Node.js + Express 5** com banco **SQLite**, autenticação **JWT** e integração com modelo **LSTM** via subprocess Python.

### Configuração, docs e scripts

| Arquivo | O que faz |
|---------|-----------|
| `package.json` | Dependências (`express`, `cors`, `dotenv`, `sqlite3`, `jsonwebtoken`, `bcryptjs`) e scripts npm (ver tabela abaixo). |
| `package-lock.json` | Lockfile das dependências Node. |
| `.env.example` | Template de variáveis: `PORT`, `JWT_SECRET`, `TMDB_API_KEY`. |
| `.env` | Variáveis locais (gitignored, não commitar). |
| `README.md` | Documentação da API: schema do banco, rotas, fluxo de recomendação, scripts npm, segurança. |
| `TREINAMENTO.md` | Documentação detalhada do pipeline LSTM: dataset, pré-processamento, split, arquitetura, treino, métricas, experimentos, integração com a API. |
| `scripts/seed-movies.js` | CLI para apagar e reimportar todo o catálogo de filmes a partir do arquivo MovieLens `u.item`. |
| `scripts/fetch-posters.js` | CLI para buscar posters no TMDB em lote para filmes sem poster. |

#### Scripts npm do backend

| Script | Comando | Função |
|--------|---------|--------|
| `dev` | `nodemon src/server.js` | API com hot-reload |
| `start` | `node src/server.js` | API produção |
| `seed` | `node scripts/seed-movies.js` | Reimportar catálogo MovieLens |
| `seed:posters` | `node scripts/fetch-posters.js` | Atualizar posters TMDB |
| `ml:train` | `python src/ml/models/train.py` | Treinar LSTM |
| `ml:evaluate` | `python src/ml/models/evaluate.py` | Avaliar no teste + gerar figuras |
| `ml:experiment` | `python src/ml/models/experiment.py` | 3 experimentos de hiperparâmetros |
| `ml:pipeline` | train + evaluate | Pipeline completo |
| `ml:plots` | `python src/ml/models/plot_results.py` | Regenerar gráficos |

### Entrada da aplicação

| Arquivo | O que faz |
|---------|-----------|
| `src/server.js` | Bootstrap do Express: CORS, JSON parser, monta rotas (`/auth`, `/movies`, `/interactions`, `/recommendation`, `/ratings`), health check em `/`. Na subida: cria tabelas → seed de filmes se vazio → busca 40 posters TMDB → escuta na porta configurada. |

### Banco de dados (`src/database/`)

| Arquivo | O que faz |
|---------|-----------|
| `connection.js` | Abre conexão SQLite com `./src/database/nextflix.db`. Exporta instância `db`. |
| `init.js` | Cria tabelas se não existirem: `users`, `movies`, `interactions`, `ratings`. |
| `seed.js` | Se catálogo vazio, importa filmes do MovieLens `u.item` para SQLite. Exporta `seedMoviesIfEmpty`. |

**Arquivo gerado em runtime (gitignored):** `src/database/nextflix.db`

#### Schema SQLite

| Tabela | Campos | Uso |
|--------|--------|-----|
| `users` | id, name, email, password (hash bcrypt) | Contas de usuário |
| `movies` | id, title, genre, year, poster | Catálogo (IDs = MovieLens) |
| `interactions` | id, user_id, movie_id, event_type, duration, created_at | Cliques, hovers, likes |
| `ratings` | id, user_id, movie_id, rating (+1 curtida, -1 dislike) | Avaliações explícitas |

### Middleware (`src/middleware/`)

| Arquivo | O que faz |
|---------|-----------|
| `authMiddleware.js` | Valida header `Authorization: Bearer <token>`, decodifica JWT e define `req.user`. Usado em rotas protegidas. |

### Rotas (`src/routes/`)

| Arquivo | Prefixo | Endpoints |
|---------|---------|-----------|
| `authRoutes.js` | `/auth` | `POST /register`, `POST /login`, `GET /me`, `PATCH /profile` |
| `movieRoutes.js` | `/movies` | `GET /`, `/trending`, `/search`, `/genre/:genre`, `/:id/details`, `/:id` |
| `interactionRoutes.js` | `/interactions` | `POST /` (auth), `GET /me` (auth) |
| `recommendationRoutes.js` | `/recommendation` | `GET /me` (auth) |
| `ratingRoutes.js` | `/ratings` | `POST /`, `GET /me`, `GET /me/likes`, `GET /me/:movieId`, `DELETE /:movieId` (auth) |

### Controllers (`src/controllers/`)

| Arquivo | O que faz | Handlers |
|---------|-----------|----------|
| `authController.js` | HTTP para autenticação e perfil. | `register`, `login`, `me`, `updateProfile` |
| `movieController.js` | HTTP para catálogo e busca. | `listMovies`, `trendingMovies`, `moviesByGenre`, `showMovie`, `showMovieDetails`, `search` |
| `interactionController.js` | HTTP para rastreamento de comportamento. | `createInteraction`, `getInteractionsByUser` |
| `recommendationController.js` | HTTP para recomendação LSTM com fallbacks. | `recommendMovie` |
| `ratingController.js` | HTTP para curtidas/dislikes. | `rateMovie`, `clearRating`, `myRatings`, `myLikedMovies`, `myRatingForMovie` |

### Services (`src/services/`)

| Arquivo | O que faz | Funções principais |
|---------|-----------|-------------------|
| `authService.js` | CRUD de usuários, hash bcrypt, JWT sign/verify. | `createUser`, `findUserByEmail`, `findUserById`, `updateUser`, `validatePassword`, `signToken`, `verifyToken` |
| `movieService.js` | Queries SQLite de filmes, gêneros, trending, similares. | `GENRES`, `getMovies`, `getTrendingMovies`, `getMoviesByGenre`, `getMovieById`, `getSimilarMovies`, `getMovieDetails`, `searchMovies`, `countMovies` |
| `interactionService.js` | Persiste interações e retorna histórico (últimos 20 movie IDs). | `saveInteraction`, `getUserHistory` |
| `ratingService.js` | Gerencia tabela ratings; likes alimentam sequência LSTM; dislikes filtram recomendação. | `getUserRatings`, `getUserLikes`, `getUserLikedMovies`, `getUserDislikes`, `getUserRatingForMovie`, `saveRating`, `removeRating` |
| `recommendationService.js` | Executa `python predict.py id1 id2 id3` com histórico do usuário. | `getRecommendation`, `resolvePythonCommand` |
| `tmdbService.js` | Busca sinopse e backdrop no TMDB para página de detalhe. | `getMovieDetailsFromTmdb` |
| `posterService.js` | Resolve URLs de poster (TMDB ou placeholder) e atualiza em lote. | `resolvePoster`, `fetchPostersBatch`, `fetchAndSavePoster` |

### Utilitários (`src/utils/`)

| Arquivo | O que faz |
|---------|-----------|
| `historyUtils.js` | Monta sequência de 3 movie IDs para o LSTM a partir de interações + curtidas recentes. Evita sequências repetidas. Exporta `getRecentSequenceForLstm`, `buildSequenceWithRatings`. |

---

## Pipeline de Machine Learning (`apps/backend/src/ml/`)

Módulo Python/PyTorch que implementa o modelo LSTM de recomendação sequencial.

### Documentação e dependências

| Arquivo | O que faz |
|---------|-----------|
| `README.md` | Comandos rápidos, split 70/15/15, arquitetura, artefatos gerados, métricas, integração com API. |
| `requirements.txt` | `torch`, `pandas`, `numpy`, `matplotlib`, `scikit-learn`. |

### Modelos (`src/ml/models/`)

| Arquivo | O que faz |
|---------|-----------|
| `model.py` | Classe PyTorch `RecommenderLSTM`: Embedding(64) → LSTM(128) → Linear(1682 classes). |
| `train.py` | Loop de treino/validação, salva melhor checkpoint (`nextflix_lstm.pth`) e JSONs. CLI: `--epochs`, `--lr`, `--batch-size`. |
| `predict.py` | Inferência chamada pelo Node: recebe 3 IDs via argv, imprime `{id}|{title}` no stdout. |
| `evaluate.py` | Avalia no conjunto de teste vs baselines (popular, aleatório), gera relatório e figuras. |
| `experiment.py` | Grid de 3 experimentos com hiperparâmetros diferentes via subprocess. |
| `plot_results.py` | Regenera gráficos a partir do modelo salvo e histórico de treino. |

### Artefatos do modelo (`src/ml/models/`)

| Arquivo | O que faz |
|---------|-----------|
| `nextflix_lstm.pth` | **Gerado no treino** — pesos do melhor modelo (validação). Necessário para recomendações. |
| `model_config.json` | Hiperparâmetros salvos, `num_movies`, melhor Hit@10 na validação. |
| `training_history.json` | Loss e métricas (Hit@10, NDCG@10) por época. |
| `evaluation_report.json` | Métricas finais no teste: LSTM vs baselines. |
| `experiments_results.json` | Resultados comparativos dos 3 experimentos. |
| `figures/confusion_matrix.json` | Dados numéricos da matriz de confusão (top 12 filmes). |
| `figures/*.png` | **Gerados na avaliação** — loss, métricas, confusion matrix, baselines. |

### Utilitários ML (`src/ml/utils/`)

| Arquivo | O que faz |
|---------|-----------|
| `data.py` | Carrega `u.data`, gera sequências de 3 filmes → alvo 4º, split 70/15/15 (seed 42). Exporta `SEQUENCE_LENGTH`, `load_ratings`, `build_sequences`, `split_examples`, `get_num_movies`, `popular_movie_from_targets`. |
| `metrics.py` | Métricas de recomendação: `hit_at_k`, `ndcg_at_k`, `evaluate_logits`. |
| `plots.py` | Gera figuras matplotlib: curvas de loss, Hit@10, matriz de confusão. |

### Dataset MovieLens (`src/ml/data/raw/ml-100k/`)

| Arquivo | O que faz |
|---------|-----------|
| `README` | Licença e documentação do formato dos arquivos MovieLens. |
| `u.data` | **Principal** — ~100k avaliações (user_id, movie_id, rating, timestamp). Usado no treino LSTM. |
| `u.item` | Metadados dos 1682 filmes (título, ano, gêneros). Usado no seed do SQLite e mapeamento de títulos. |
| `u.user` | Demografia dos 943 usuários (idade, sexo, ocupação, zip). |
| `u.genre` | Mapeamento id → nome de gênero. |
| `u.occupation` | Códigos de ocupação. |
| `u.info` | Estatísticas do dataset. |
| `u1.base` … `u5.base` | Splits 5-fold cross-validation (treino) — **não usados** pelo pipeline atual. |
| `u1.test` … `u5.test` | Splits 5-fold (teste) — **não usados**. |
| `ua.base`, `ua.test` | Split alternativo train/test — **não usados**. |
| `ub.base`, `ub.test` | Outro split alternativo — **não usados**. |
| `allbut.pl` | Utilitário Perl da distribuição MovieLens. |
| `mku.sh` | Script shell da distribuição MovieLens. |

---

## Fluxos principais

### 1. Autenticação

```
Frontend (login.html) → POST /auth/login → authController → authService
  → bcrypt valida senha → JWT assinado → localStorage (token + user)
Requisições seguintes: Authorization: Bearer <token>
```

### 2. Recomendação LSTM

```
Frontend (home.js) → GET /recommendation/me
  → recommendationController
  → getUserHistory + getUserLikes/Dislikes
  → historyUtils.buildSequenceWithRatings() → [id1, id2, id3]
  ├─ < 3 itens → fallback: getTrendingMovies()
  └─ ≥ 3 itens → exec python predict.py id1 id2 id3
       → getMovieById + filtro de dislikes
       → resposta { movie, source: "lstm" | "lstm_filtered" | "fallback" }
```

### 3. Rastreamento de interações

```
Frontend (interactions.js) → POST /interactions { movie_id, event_type, duration }
  → interactionService.saveInteraction()
  → Alimenta histórico usado na sequência LSTM
```

### 4. Treinamento offline

```
u.data → data.py (sequências) → train.py (LSTM) → nextflix_lstm.pth
  → evaluate.py (métricas + figuras) → evaluation_report.json
```

---

## API REST — referência rápida

| Prefixo | Auth | Descrição |
|---------|------|-----------|
| `GET /` | Não | Health check |
| `POST /auth/register` | Não | Criar conta |
| `POST /auth/login` | Não | Login → `{ token, user }` |
| `GET /auth/me` | Sim | Dados do usuário |
| `PATCH /auth/profile` | Sim | Atualizar perfil |
| `GET /movies/` | Não | Listar catálogo |
| `GET /movies/trending` | Não | Em alta |
| `GET /movies/search?q=` | Não | Busca por título |
| `GET /movies/genre/:genre` | Não | Por gênero |
| `GET /movies/:id` | Não | Filme por ID |
| `GET /movies/:id/details` | Não | Detalhe + similares + TMDB |
| `POST /interactions/` | Sim | Registrar click/hover/like |
| `GET /interactions/me` | Sim | Histórico (até 20 IDs) |
| `POST /ratings/` | Sim | Curtir (+1) ou dislike (-1) |
| `GET /ratings/me/likes` | Sim | Filmes curtidos |
| `GET /recommendation/me` | Sim | Filme recomendado (LSTM) |

---

## Resultados do modelo (referência)

Melhor configuração na experimentação (5 épocas, lr 0.001, batch 64):

| Métrica (teste) | LSTM | Baseline popular |
|-----------------|------|------------------|
| Hit@10 | 0,1191 | 0,0064 |
| NDCG@10 | 0,0583 | 0,0064 |

Detalhes: `apps/backend/src/ml/models/evaluation_report.json` e pasta `figures/`.

---

## Arquivos gerados localmente (não versionados)

| Arquivo | Quando é criado |
|---------|-----------------|
| `apps/backend/.env` | Configuração local (copiar de `.env.example`) |
| `apps/backend/src/database/nextflix.db` | Primeira subida do servidor |
| `apps/backend/src/ml/models/nextflix_lstm.pth` | Após `npm run ml:train` |
| `apps/backend/src/ml/models/figures/*.png` | Após `npm run ml:evaluate` ou `ml:plots` |
| `apps/backend/src/ml/models/training_history.json` | Durante o treino |
| `apps/backend/src/ml/models/evaluation_report.json` | Após `npm run ml:evaluate` |
| `apps/backend/src/ml/models/experiments_results.json` | Após `npm run ml:experiment` |
| `node_modules/` | Após `npm install` em cada app |

---

## Como rodar (resumo)

```bash
# 1. Backend
cd apps/backend
npm install
cp .env.example .env
npm run dev                    # http://localhost:3000

# 2. Frontend (outro terminal)
cd apps/frontend
npm install
npm run dev                    # http://localhost:5500

# 3. Treinar modelo (primeira vez)
cd apps/backend
pip install -r src/ml/requirements.txt
npm run ml:pipeline            # treino + avaliação + figuras
```

---

## Documentação relacionada

| Documento | Conteúdo |
|-----------|----------|
| [README.md](./README.md) | Visão geral e quick start |
| [apps/frontend/README.md](./apps/frontend/README.md) | Frontend em detalhe |
| [apps/backend/README.md](./apps/backend/README.md) | Backend e API |
| [apps/backend/TREINAMENTO.md](./apps/backend/TREINAMENTO.md) | Pipeline LSTM completo |
| [apps/backend/src/ml/README.md](./apps/backend/src/ml/README.md) | Comandos ML rápidos |

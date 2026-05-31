# Nextflix

Plataforma web estilo streaming com **recomendação personalizada de filmes** usando uma rede neural recorrente (**LSTM**). Desenvolvido como trabalho prático da disciplina **Inteligência Artificial II**.

**Autores:** Bruno Rafael Barbosa, João Pedro Magrin, Ryan Augusto Dias

---

## O que é o projeto?

O Nextflix simula uma experiência parecida com serviços de streaming:

- Catálogo de filmes (base **MovieLens 100k**)
- Cadastro, login e perfil do usuário
- Rastreamento de interações (cliques, tempo no cartaz, curtidas)
- **Recomendação por IA:** um modelo LSTM prevê o próximo filme com base nas últimas ações do usuário
- Interface web para navegar, buscar, curtir e ver detalhes dos filmes

A IA é treinada offline no dataset MovieLens; no app, o histórico **real** de cada usuário alimenta a inferência em tempo quase real.

---

## Arquitetura geral

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

## Estrutura do repositório

```
nextflix/
├── README.md                 ← você está aqui
├── apps/
│   ├── frontend/             ← interface (ver README do frontend)
│   └── backend/              ← API + ML (ver README do backend)
│       └── TREINAMENTO.md    ← pipeline LSTM em detalhes
└── package.json
```

---

## Como rodar o projeto

### Pré-requisitos

- **Node.js** 18+
- **Python** 3.10+ (para treino e recomendações)
- Modelo treinado: `apps/backend/src/ml/models/nextflix_lstm.pth` (gerado com `npm run ml:train`)

### 1. Backend (API)

```bash
cd apps/backend
npm install
cp .env.example .env   # configure JWT_SECRET e TMDB_API_KEY (opcional)
npm run dev
```

API em `http://localhost:3000`

### 2. Frontend

Em outro terminal:

```bash
cd apps/frontend
npm install
npm run dev
```

Abra `http://localhost:5500` → faça login ou cadastro → use a home com recomendações.

### 3. Treinar o modelo (primeira vez ou após mudanças no ML)

```bash
cd apps/backend
pip install -r src/ml/requirements.txt
npm run ml:pipeline    # treino + avaliação + figuras
```

Documentação completa: [apps/backend/TREINAMENTO.md](apps/backend/TREINAMENTO.md)

---

## Documentação por módulo

| Documento | Conteúdo |
|-----------|----------|
| [apps/frontend/README.md](apps/frontend/README.md) | Páginas, fluxos, JavaScript, autenticação |
| [apps/backend/README.md](apps/backend/README.md) | API REST, banco, rotas, integração com o LSTM |
| [apps/backend/TREINAMENTO.md](apps/backend/TREINAMENTO.md) | Dados, split, treino, métricas, experimentos, figuras |
| [apps/backend/src/ml/README.md](apps/backend/src/ml/README.md) | Comandos rápidos do pipeline ML |

---

## Resultados do modelo (referência)

Melhor configuração encontrada na experimentação (**5 épocas**, lr `0.001`, batch `64`):

| Métrica (teste) | LSTM | Baseline popular |
|-----------------|------|------------------|
| Hit@10 | 0,1191 | 0,0064 |
| NDCG@10 | 0,0583 | 0,0064 |

Detalhes e gráficos: `apps/backend/src/ml/models/evaluation_report.json` e pasta `figures/`.

---

## Tecnologias principais

| Camada | Stack |
|--------|--------|
| Frontend | HTML5, CSS3, JavaScript (ES modules) |
| Backend | Node.js, Express 5, SQLite |
| IA | PyTorch, LSTM, MovieLens 100k |
| Auth | JWT |

---

## Licença

ISC (ver `package.json`).

# Nextflix — Frontend

Interface web do Nextflix: navegação no catálogo, autenticação, busca, lista de curtidas e exibição das recomendações da API.

---

## Stack

- **HTML** estático por página (sem React/Vue)
- **CSS** único: `css/style.css` (tema escuro estilo streaming)
- **JavaScript ES modules** (`type="module"`)
- Servidor de desenvolvimento: **http-server** na porta **5500**

A API deve estar rodando em `http://localhost:3000` (configurável em `js/config.js`).

---

## Como executar

```bash
cd apps/frontend
npm install
npm run dev
```

Abra no navegador: **http://localhost:5500**

Para a landing pública: `index.html`  
Para o app logado: após login → `home.html`

---

## Estrutura de arquivos

```
frontend/
├── index.html          # Landing (visitante)
├── login.html
├── registrer.html
├── home.html           # Início + hero com recomendação
├── filmes.html         # Catálogo por gênero (carrosséis)
├── minha-lista.html    # Filmes curtidos
├── perfil.html         # Nome, email, senha
├── movie.html          # Detalhe do filme
├── css/
│   └── style.css
└── js/
    ├── config.js       # URL da API
    ├── auth.js         # token e usuário no localStorage
    ├── api.js          # chamadas HTTP
    ├── movies.js       # cartões e carrosséis
    ├── navigation.js   # ir para movie.html#id
    ├── search.js       # busca na navbar
    ├── interactions.js # click/hover → API
    ├── profile-menu.js # menu Perfil / Sair
    ├── navbar.js       # link ativo, scroll #catalogo
    ├── main.js         # landing (prévia trending)
    └── pages/
        ├── home.js
        ├── filmes.js
        ├── movie.js
        ├── minha-lista.js
        ├── perfil.js
        ├── login.js
        └── registrer.js
```

---

## Páginas e fluxos

### Visitante

| Página | Função |
|--------|--------|
| `index.html` | Apresentação + busca + link para login |
| `login.html` / `registrer.html` | Autenticação |

### Usuário logado (navbar comum)

| Página | `data-nav` | Função |
|--------|------------|--------|
| `home.html` | inicio | Hero com filme recomendado + fileiras (semelhantes, populares, em alta) |
| `filmes.html` | filmes | Carrosséis por gênero (Ação, Comédia, etc.) |
| `minha-lista.html` | lista | Filmes com 👍 |
| `perfil.html` | — | Editar perfil (via menu) |

### Detalhe do filme

`movie.html?id` na prática usa hash: `movie.html#123`

- Sinopse, poster, backdrop (TMDB via backend)
- Botões **Gostei** / **Não gostei**
- Filmes similares
- Ao curtir, marca refresh da recomendação na próxima visita à home

---

## Autenticação

- Token JWT em `localStorage` (`nextflix_token`)
- Dados do usuário em `nextflix_user`
- `auth.js`: `requireAuth()`, `logout()`, `saveSession()`
- Requisições autenticadas: header `Authorization: Bearer <token>` em `api.js`
- Sem token → redireciona para `login.html`

### Menu de perfil

Botão com o **primeiro nome** do usuário abre dropdown:

- **Configurações do perfil** → `perfil.html`
- **Sair** → limpa sessão e vai para login

Implementação: `profile-menu.js`

---

## Recomendações na home

`pages/home.js`:

1. Carrega catálogo (populares + em alta)
2. Chama `GET /recommendation/me`
3. Define o **hero** com o filme recomendado
4. Fileira **“Semelhantes à sua recomendação”** via `GET /movies/:id/details` (campo `similar`)
5. Botão **Atualizar recomendação** força nova consulta

**Cold start:** com menos de 3 interações/curtidas, a API retorna `source: "fallback"` (filme em alta).

Após curtir um filme em `movie.js`, `sessionStorage` sinaliza refresh na próxima abertura da home.

---

## Interações rastreadas

`interactions.js` envia para `POST /interactions` (se logado):

| Evento | Quando |
|--------|--------|
| `click` | Clique no cartaz |
| `hover` | Sai do cartaz (com duração em segundos) |
| `like` | Curtida (também gravada em `ratings`) |

Esses dados montam o histórico usado pelo LSTM no backend.

---

## Busca

`search.js` — input na navbar em todas as páginas logadas:

- Debounce → `GET /movies/search?q=...`
- Clique no resultado → `movie.html#id`

---

## Carrosséis

`movies.js`:

- `renderMovieRow` — fileira horizontal simples
- `renderCarouselRow` — fileira com setas ‹ › (`filmes.html`, `minha-lista.html`)

---

## Configuração

`js/config.js`:

```javascript
export const API_BASE_URL = "http://localhost:3000";
```

Altere se a API rodar em outra porta ou host.

---

## Boas práticas para desenvolvimento

- Use **dois terminais**: backend `npm run dev` + frontend `npm run dev`
- Após treinar novo modelo no backend, recarregue a home para testar recomendações
- `http-server` usa `-c-1` para desabilitar cache durante o dev

---

## Relacionado

- [README principal](../../README.md)
- [Backend](../backend/README.md)
- [Treinamento do modelo](../backend/TREINAMENTO.md)

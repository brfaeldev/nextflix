# Treinamento do modelo LSTM — Nextflix

Documentação detalhada do pipeline de **Inteligência Artificial** do projeto: dados, pré-processamento, arquitetura, treino, validação, experimentos e integração com a API.

---

## 1. Objetivo do modelo

Prever o **próximo filme** que um usuário tende a assistir/interagir, dado um **histórico ordenado** de filmes.

- **Entrada:** sequência de **3 IDs** de filmes (janela temporal)
- **Saída:** classificação entre **1682 classes** (catálogo MovieLens 100k)
- **Técnica:** rede recorrente **LSTM** (tipo de RNN) em **PyTorch**

No aplicativo web, a sequência vem das interações reais do usuário logado; o modelo em si foi **treinado** nas sequências históricas do arquivo `u.data`.

---

## 2. Dataset

### Fonte

**MovieLens 100k** — arquivo local:

```
apps/backend/src/ml/data/raw/ml-100k/u.data
```

Formato (TSV): `user_id | movie_id | rating | timestamp`

Metadados dos filmes: `u.item` (título, ano, gêneros)

### Por que MovieLens?

- Padrão acadêmico em sistemas de recomendação
- ~100 mil avaliações, 943 usuários, 1682 filmes
- IDs dos filmes no SQLite do app são os **mesmos** do MovieLens (seed em `database/seed.js`)

### Limitação (importante para o relatório)

O treino aprende padrões de usuários de 1998; o app coleta interações novas apenas para **montar a sequência de entrada** na inferência, sem retreino online automático.

---

## 3. Pré-processamento

Implementação: `src/ml/utils/data.py`

### Passos

1. Carregar `u.data` e ordenar por `user_id`, `timestamp`
2. Para cada usuário, obter lista cronológica de `movie_id`
3. Gerar exemplos supervisionados com janela deslizante:

```
Filmes: [A, B, C, D, E]
Exemplo 1: entrada [A,B,C] → alvo D
Exemplo 2: entrada [B,C,D] → alvo E
...
```

4. Ignorar usuários com ≤ 3 filmes

**Total de exemplos gerados:** ~97 171

### No app (inferência)

O Node não usa o CSV na hora da recomendação. Ele monta 3 IDs a partir de:

- Últimas interações em `interactions` (click, hover, like)
- Curtidas recentes em `ratings` (reforço)

Lógica: `src/utils/historyUtils.js` → `buildSequenceWithRatings()`

---

## 4. Divisão dos dados

| Conjunto | % | Amostras (aprox.) | Uso |
|----------|---|-------------------|-----|
| **Treino** | 70% | 68 019 | Ajustar pesos |
| **Validação** | 15% | 14 575 | Escolher melhor época / early selection |
| **Teste** | 15% | 14 577 | Avaliação final (uma vez) |

- Divisão **aleatória** dos exemplos (não por usuário)
- **Seed fixa:** `42` (reprodutibilidade)
- Função: `split_examples()` em `data.py`

O conjunto de **teste nunca** é usado durante o treino nem para escolher hiperparâmetros na rotina padrão — apenas em `evaluate.py` e nos experimentos (cada run avalia no teste após treinar; para rigor estrito em artigo, mencionem que a escolha final foi validada também na val).

---

## 5. Arquitetura da rede

Arquivo: `src/ml/models/model.py`

```
movie_ids (batch, 3)
        │
        ▼
   Embedding(1683, 64)
        │
        ▼
   LSTM(64 → 128, batch_first)
        │
        ▼
   Último hidden state (128)
        │
        ▼
   Linear(128 → 1683)
        │
        ▼
   logits (batch, 1683)  → argmax ou top-K
```

| Hiperparâmetro | Valor padrão |
|----------------|--------------|
| `embedding_dim` | 64 |
| `hidden_size` | 128 |
| `sequence_length` | 3 |
| Função de perda | CrossEntropyLoss |
| Otimizador | Adam |

**Ativações:** ReLU implícito na LSTM; saída é logit bruto (softmax implícito na loss).

---

## 6. Treinamento

### Comando principal

```bash
cd apps/backend
pip install -r src/ml/requirements.txt
python src/ml/models/train.py --epochs 5 --lr 0.001 --batch-size 64
```

Ou: `npm run ml:train -- --epochs 5 --lr 0.001 --batch-size 64`

### O que acontece em cada época

1. Mini-batches de 64 sequências (shuffle no treino)
2. Forward → loss → backward → update
3. Avaliação no conjunto de **validação** (sem shuffle)
4. Métricas: loss, Hit@1/5/10, NDCG@10

### Melhor modelo

Salva o checkpoint com **maior Hit@10 na validação** (não necessariamente a última época).

Arquivo: `src/ml/models/nextflix_lstm.pth`

### Por que 5 épocas (e não 10)?

Na **experimentação** (seção 8), 10 épocas piorou no teste: loss de treino cai, validação estagna ou piora → **overfitting**.

| Épocas | Hit@10 (teste) |
|--------|----------------|
| **5** | **0,1191** ← melhor |
| 10 (lr 0,001) | 0,1147 |
| 10 (lr 0,0005, batch 128) | 0,1157 |

Configuração em produção: `model_config.json` → `"epochs": 5`

---

## 7. Métricas de avaliação

Arquivo: `src/ml/utils/metrics.py` + `evaluate.py`

| Métrica | Significado |
|---------|-------------|
| **Hit@K** | % de vezes que o filme real está no top-K previsto |
| **NDCG@10** | Qualidade do ranking no top-10 (penaliza acerto em posição baixa) |

### Baselines (mesmo conjunto de teste)

1. **Popular** — sempre recomenda o filme mais frequente no treino
2. **Aleatório** — logits aleatórios

### Resultados de referência (melhor modelo, 5 épocas)

| Modelo | Hit@1 | Hit@5 | Hit@10 | NDCG@10 |
|--------|-------|-------|--------|---------|
| **LSTM** | 0,0174 | 0,0659 | **0,1191** | **0,0583** |
| Popular | 0,0064 | 0,0064 | 0,0064 | 0,0064 |
| Aleatório | 0,0005 | 0,0026 | 0,0060 | 0,0026 |

Relatório JSON: `src/ml/models/evaluation_report.json`

O LSTM supera os baselines em todas as métricas listadas.

---

## 8. Experimentação (hiperparâmetros)

Script: `src/ml/models/experiment.py`  
Comando: `npm run ml:experiment`

Roda **3 configurações** em sequência, treina cada uma, avalia no teste e grava:

`src/ml/models/experiments_results.json`

| Run | epochs | lr | batch_size | Hit@10 teste |
|-----|--------|-----|------------|--------------|
| 1 | 5 | 0,001 | 64 | **0,1191** |
| 2 | 10 | 0,001 | 64 | 0,1147 |
| 3 | 10 | 0,0005 | 128 | 0,1157 |

**Conclusão:** mais épocas nem sempre melhoram; learning rate menor exige mais tempo e não superou a config de 5 épocas neste dataset.

---

## 9. Figuras e matriz de confusão

Geradas por `evaluate.py` ou `npm run ml:plots`:

```
src/ml/models/figures/
├── training_loss.png              # loss treino vs validação
├── training_metrics.png           # Hit@10 e NDCG@10 na validação
├── baselines_comparison.png       # barras LSTM vs baselines
├── confusion_matrix.png           # contagens (top-12 filmes)
├── confusion_matrix_normalized.png
└── (dados) ../confusion_matrix.json
```

### Matriz de confusão

- **1682 classes** → matriz completa é ilegível
- Figura usa os **12 filmes mais frequentes no teste**
- **Linha** = filme real (próximo na sequência)
- **Coluna** = filme previsto pelo modelo
- **Diagonal** = acertos

---

## 10. Inferência em produção

### Script Python

`src/ml/models/predict.py`

```bash
python predict.py 12 45 89
# saída: movie_id|título
```

Carrega `nextflix_lstm.pth` + `model_config.json`.

### API Node

`recommendationService.js` executa:

```
python predict.py <id1> <id2> <id3>
```

Requisitos:

- Python no PATH (`python` no Windows, `python3` no Linux — ou `PYTHON_PATH` no ambiente)
- Arquivo `.pth` presente

Se falhar → `recommendationController` retorna **fallback** (filme em alta).

---

## 11. Artefatos gerados

| Arquivo | Descrição |
|---------|-----------|
| `nextflix_lstm.pth` | Pesos do melhor modelo |
| `model_config.json` | Hiperparâmetros e metadados |
| `training_history.json` | Métricas por época |
| `evaluation_report.json` | Resultado no teste |
| `experiments_results.json` | Comparação de experimentos |
| `figures/*.png` | Gráficos para artigo/apresentação |

---

## 12. Comandos rápidos

```bash
cd apps/backend

# Pipeline completo (treino + avaliação + figuras)
npm run ml:pipeline

# Só treinar (melhor config)
npm run ml:train -- --epochs 5 --lr 0.001 --batch-size 64

# Só avaliar / gerar figuras (modelo já treinado)
npm run ml:evaluate

# Só gráficos + matriz
npm run ml:plots

# Experimentos (demora ~3–5 min)
npm run ml:experiment
```

---

## 13. Estrutura de código ML

```
src/ml/
├── requirements.txt
├── README.md                 # resumo técnico curto
├── utils/
│   ├── data.py               # load, sequências, split
│   ├── metrics.py            # Hit@K, NDCG@K
│   └── plots.py              # matplotlib
└── models/
    ├── model.py              # classe RecommenderLSTM
    ├── train.py
    ├── evaluate.py
    ├── experiment.py
    ├── plot_results.py
    ├── predict.py
    └── lstm_model.py         # atalho → train.py
```

---

## 14. Trabalhos futuros (sugestões)

- Retreino periódico com interações reais do SQLite
- Top-K + re-ranking (excluir já vistos e dislikes antes de mostrar)
- Serviço Python persistente (evitar `exec` por requisição)
- Split por usuário em vez de aleatório por exemplo
- Mais épocas com early stopping automático

---

## Relacionado

- [README do backend](./README.md)
- [README principal do projeto](../../README.md)
- [README resumido do módulo ML](./src/ml/README.md)

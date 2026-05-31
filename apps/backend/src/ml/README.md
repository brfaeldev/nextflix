# Pipeline de recomendação (LSTM / RNN)

Este módulo atende à metodologia do trabalho prático: **aquisição de dados**, **pré-processamento**, **divisão treino/validação/teste**, **treinamento**, **experimentação** e **métricas de avaliação**.

## Dataset

- **MovieLens 100k** (`data/raw/ml-100k/u.data`)
- Sequências de 3 filmes → previsão do 4º (mesma lógica do app)

## Divisão dos dados

| Conjunto | Proporção | Uso |
|----------|-----------|-----|
| Treino | 70% | Ajuste dos pesos |
| Validação | 15% | Escolha do melhor modelo (Hit@10) |
| Teste | 15% | Avaliação final (uma vez) |

Seed fixa `42` para reprodutibilidade (`utils/data.py`).

## Arquitetura

- **Embedding** (64) → **LSTM** (128) → **Linear** (multiclasse)
- Implementação: `models/model.py`

## Comandos

Na pasta `apps/backend` (com venv Python e dependências instaladas):

```bash
pip install -r src/ml/requirements.txt

# Treinar e salvar nextflix_lstm.pth + JSONs
npm run ml:train

# Avaliar no teste + baselines (popular, aleatório)
npm run ml:evaluate

# Rodar 3 experimentos com hiperparâmetros diferentes
npm run ml:experiment
```

Ou diretamente:

```bash
cd src/ml/models
python train.py --epochs 10 --lr 0.001
python evaluate.py
```

## Artefatos gerados

| Arquivo | Conteúdo |
|---------|----------|
| `models/nextflix_lstm.pth` | Pesos do melhor modelo (val) |
| `models/model_config.json` | Hiperparâmetros e vocabulário |
| `models/training_history.json` | Loss e métricas por época |
| `models/evaluation_report.json` | Hit@K, NDCG@10 no **teste** |
| `models/experiments_results.json` | Comparação de experimentos |

### Figuras (`models/figures/`)

Geradas por `npm run ml:evaluate` ou `npm run ml:plots`:

| Imagem | Descrição |
|--------|-----------|
| `training_loss.png` | Loss treino vs validação por época |
| `training_metrics.png` | Hit@10 e NDCG@10 na validação |
| `confusion_matrix.png` | Matriz de confusão (contagens) |
| `confusion_matrix_normalized.png` | Matriz normalizada por linha (%) |
| `baselines_comparison.png` | LSTM vs baselines no teste |
| `confusion_matrix.json` | Dados numéricos da matriz |

**Matriz de confusão:** são 1682 classes (filmes); a figura usa os **12 filmes mais frequentes no teste** (senão a matriz fica ilegível). Linha = filme real; coluna = filme que o modelo previu.

## Métricas

- **Hit@1, Hit@5, Hit@10** — acerto no top-K
- **NDCG@10** — qualidade do ranking
- **Baselines:** filme mais popular no treino; recomendador aleatório

## Integração com a API

`predict.py` é chamado pelo Node (`recommendationService.js`) com os 3 IDs do histórico do usuário logado.

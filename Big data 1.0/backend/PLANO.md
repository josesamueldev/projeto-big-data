# Plano do Back-end — Sistema de Registro e Consulta de Veículos

> Projeto de extensão (FACI Wyden / CIOp — Belém/PA). Documento de referência:
> "SISTEMA DE REGISTRO E CONSULTA DE VEÍCULOS — Trabalho escrito".
> Este arquivo registra as decisões de arquitetura do back-end em Python.

## 1. Requisitos extraídos da documentação

| Requisito (doc) | Seção | Como o back-end atende |
|---|---|---|
| Substituir planilhas manuais por SGBD | 1.2 / 1.5 | Banco relacional SQLite + API centralizada |
| **Registro** e consulta de veículos | Título / 1.4 | Registro + consulta + detalhe (edição/exclusão ficam para quando houver tela) |
| Validar e padronizar entradas (ex.: placa) | 2.4 | Módulo `validators.py` (placa antiga + Mercosul, chassi, CPF/CNPJ, ano) |
| Bloquear cadastros duplicados | 2.4 | UNIQUE em `placa` e `chassi` → HTTP 409 |
| Consultas indexadas em frações de segundo | 2.4 / 1.5 | Índices B-tree + busca exata indexada |
| Testes de estresse com dados simulados | Fase 4 | `scripts/gerar_dados.py` + `scripts/stress_test.py` (p50/p95/p99) |
| Arquitetura modular (front-end × back-end) | 1.5 / 2.6 | API REST em camadas: routers → services → database |
| Python como núcleo | 1.5 / 2.5 | FastAPI (Python 3.14) |
| Escalável ("futuro CRM de veículos") | 1.5 | Camada de dados isolada: troca SQLite → PostgreSQL sem tocar nos endpoints |

## 2. Decisões adotadas

| Decisão | Escolha |
|---|---|
| Marca e modelo | Colunas separadas (`marca`, `modelo`); filtro `marca_modelo` pesquisa a concatenação |
| Campos extras | `renavam` e `observacoes` opcionais |
| Permissões | Qualquer servidor autenticado pode registrar e consultar (protótipo) |
| Volume do stress test | 100.000 registros (configurável) |
| Banco | SQLite (zero instalação; evolução futura para PostgreSQL) |
| Dados iniciais | 6 veículos + 2 usuários de demonstração |
| Autenticação | JWT (HS256) + senha com PBKDF2 + salt |

## 3. Arquitetura

```
front-end (HTML/CSS/JS)  ──HTTP/JSON──▶  API FastAPI
                                          ├─ routers/   (validação de entrada, status HTTP)
                                          ├─ services/  (regras de negócio, unicidade, busca)
                                          └─ database.py (SQLite, schema, índices)
```

## 4. Modelo de dados

**usuario**: id, matricula (UNIQUE), nome, senha_hash, criado_em
**veiculo**: id, placa (UNIQUE), chassi (UNIQUE), renavam, marca, modelo, cor, ano,
proprietario, cpf_cnpj, observacoes, criado_em, atualizado_em

Índices: placa/chassi (únicos), proprietario, marca, cor, ano.
`journal_mode=WAL` para leitura concorrente.

## 5. API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status (público) |
| POST | `/api/auth/login` | matrícula + senha → JWT |
| GET | `/api/auth/me` | Usuário logado |
| POST | `/api/veiculos` | Registrar (201 / 409 / 422) |
| GET | `/api/veiculos` | Pesquisar com filtros + paginação |
| GET | `/api/veiculos/estatisticas` | Totais para o relatório |
| GET | `/api/veiculos/{id}` | Detalhe |

A API expõe apenas o que o front-end usa hoje. `PATCH` e `DELETE` foram
deixados de fora de propósito e voltam junto com as telas de edição/exclusão.

Filtros da pesquisa: `placa`, `chassi`, `marca_modelo`, `cor`, `proprietario`,
`cpf_cnpj`, `ano`, `partial_inicio`, `partial_meio`, `partial_fim`,
`partial_campo` (`placa`|`chassi`), `page`, `limit`.

## 6. Validações

- **Placa**: `ABC-1234` ou `ABC1D23` (Mercosul); normalizada para maiúsculas.
- **Chassi**: 17 caracteres alfanuméricos (sem I, O, Q — padrão VIN).
- **Ano**: 1886 até ano atual + 1.
- **CPF/CNPJ**: dígitos verificadores conferidos; armazenado formatado.
- **Renavam**: 9 a 11 dígitos (opcional).
- **Duplicidade**: placa/chassi repetido → 409 Conflict.

## 7. Desempenho (Fase 4 do documento)

1. Busca exata por placa/chassi usa índice único.
2. `LIKE '%trecho%'` faz varredura — limitação documentada do SQLite.
3. Evolução: PostgreSQL (pg_trgm) ou mecanismo de busca dedicado.

## 8. Testes

- Unitários: validadores (placa, chassi, CPF/CNPJ, ano).
- Integração: login, token ausente/inválido, registro, duplicidade, detalhe,
  filtros, pesquisa parcial, paginação e ausência de `PATCH`/`DELETE` (405).
- Script de estresse separado (não roda no CI).

## 9. Fases de execução

1. Base (config, banco, segurança, auth) — ✅
2. Registro com validações — ✅
3. Consulta avançada com paginação — ✅
4. Gerador de massa + stress test — ✅
5. Documentação e OpenAPI — ✅

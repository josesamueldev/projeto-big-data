# Backend — Sistema de Registro e Consulta de Veículos

API REST em Python (FastAPI + SQLite) para o projeto de extensão do CIOp
(Centro Integrado de Operações). Substitui a consulta manual em planilhas por
**registro validado** e **pesquisa indexada** de veículos.

> Front-end (HTML/CSS/JS) fica na pasta raiz do projeto. Este backend pode
> ser consumido por qualquer cliente HTTP; o front atual já está integrado
> a ele (login, pesquisa, paginação e cadastro).

## Requisitos

- Python 3.10+ (testado no 3.14)
- pip

## Instalação

```powershell
cd "backend"
py -m pip install -r requirements.txt
```

## Executar

```powershell
py run.py
```

- API: http://127.0.0.1:8000
- Documentação interativa (Swagger): http://127.0.0.1:8000/docs

Na primeira subida o banco (`backend/data/app.db`) é criado e semeado com
6 veículos e 2 usuários de demonstração.

### Usuários de demonstração

| Matrícula | Senha |
|---|---|
| `123456` | `123456` |
| `789012` | `senha789` |

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status (público) |
| POST | `/api/auth/login` | Login → token JWT |
| GET | `/api/auth/me` | Usuário logado |
| POST | `/api/veiculos` | Registrar veículo |
| GET | `/api/veiculos` | Pesquisar (filtros + paginação) |
| GET | `/api/veiculos/estatisticas` | Totais gerais |
| GET | `/api/veiculos/{id}` | Detalhe |

Todos os endpoints de veículos exigem `Authorization: Bearer <token>`.

> A API expõe apenas o que o front-end usa hoje. Edição (`PATCH`) e exclusão
> (`DELETE`) de veículos serão adicionados junto com as telas correspondentes.

### Filtros da pesquisa

`placa`, `chassi`, `marca_modelo`, `cor`, `proprietario`, `cpf_cnpj`, `ano`,
`partial_inicio`, `partial_meio`, `partial_fim`,
`partial_campo` (`placa` ou `chassi`), `page`, `limit`.

### Exemplos (PowerShell)

```powershell
# 1) Login
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/auth/login `
  -ContentType "application/json" -Body '{"matricula":"123456","senha":"123456"}'

$headers = @{ Authorization = "Bearer $($login.access_token)" }

# 2) Pesquisa por placa exata
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/veiculos?placa=ABC-1234" -Headers $headers

# 3) Pesquisa parcial por início da placa
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/veiculos?partial_inicio=AB&partial_campo=placa" -Headers $headers

# 4) Registrar veículo
$corpo = @{
  placa = "XYZ-9876"; chassi = "9BWZZZ377VT009999"; marca = "Fiat"; modelo = "Mobi Like";
  cor = "Azul"; ano = 2022; proprietario = "Teste da Silva"; cpf_cnpj = "111.444.777-35"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/veiculos `
  -Headers $headers -ContentType "application/json" -Body $corpo
```

## Testes

```powershell
cd "backend"
py -m pytest -v
```

Cobrem: login e proteção por token, validação de placa/chassi/ano/CPF-CNPJ,
registro, duplicidade (409), detalhe, filtros combinados, pesquisa
parcial (início/meio/fim), ausência de resultado e paginação. Também
confirmam que `PATCH` e `DELETE` continuam fora da API (HTTP 405).

## Teste de estresse (Fase 4)

Com o servidor rodando:

```powershell
# Gera 100 mil veículos simulados (placas/chassis/CPFs válidos)
py scripts/gerar_dados.py --qtd 100000

# Mede tempo de resposta de 3 cenários (n repetições)
py scripts/stress_test.py --n 50
```

Saída típica: média, p50, p95, p99 e máximo por cenário. A busca exata por
placa usa índice único; filtros e pesquisa parcial fazem varredura (limitação
documentada do SQLite — evolução futura: PostgreSQL + pg_trgm).

## Estrutura

```
backend/
├── app/            # código da API (o "produto")
│   ├── routers/    # portas de entrada HTTP
│   └── services/   # regras de negócio
├── scripts/        # ferramentas de apoio (massa de dados e benchmark)
├── tests/          # testes automatizados
├── data/           # banco SQLite gerado em tempo de execução
├── PLANO.md
├── README.md
├── run.py
└── requirements.txt
```

### O que cada pasta separa

| Pasta | Papel | Regra de ouro |
|---|---|---|
| `app/` | Todo o código que roda no servidor | Nada fora dela é executado pela API |
| `app/routers/` | "Portas de entrada": recebem HTTP, validam o corpo e devolvem status | Não falam com o banco; apenas chamam `services` |
| `app/services/` | Regras de negócio: registrar, pesquisar, autenticar | Não conhecem HTTP (não montam resposta nem status) |
| `scripts/` | Ferramentas manuais (não sobem com o servidor) | Só rodam quando alguém executa `py scripts/...` |
| `tests/` | Testes automatizados (pytest) | Não tocam o banco real: usam `tests/test_app.db` |
| `data/` | Banco SQLite (`app.db`) criado na primeira subida | Não versionar; apagar para "resetar" a demonstração |

O fluxo de uma requisição é sempre o mesmo:

```
navegador → routers (HTTP) → schemas (validação) → services (regra) → database (SQL)
```

### Arquivos da raiz de `backend/`

| Arquivo | O que faz |
|---|---|
| `run.py` | Atalho de desenvolvimento: sobe o servidor em `127.0.0.1:8000` com recarga automática. É o que se executa com `py run.py`. |
| `requirements.txt` | Lista das dependências (FastAPI, Uvicorn, PyJWT, pytest, httpx) com o motivo de cada uma em comentário. |
| `README.md` | Este documento: instalação, endpoints, testes e mapa dos arquivos. |
| `PLANO.md` | Registro das decisões de arquitetura e de como cada requisito do PDF é atendido. Útil para justificar escolhas na apresentação. |

### Pasta `app/` (código da API)

| Arquivo | O que faz |
|---|---|
| `__init__.py` | Arquivo vazio que marca `app` como um pacote Python (permite `from app import ...`). |
| `main.py` | Fábrica da aplicação: cria o FastAPI, registra os routers, configura CORS e roda o `init_db` na subida. Também define `/` e `/api/health`. |
| `config.py` | Centraliza as configurações lidas de variáveis de ambiente (caminho do banco, chave do JWT, validade do token, custo do hash, CORS). |
| `database.py` | Camada de acesso a dados: esquema das tabelas, os índices e a abertura de conexão (`row_factory`, WAL). Nenhum SQL de negócio fica espalhado fora daqui e dos `services`. |
| `security.py` | Segurança pura: gera e confere o hash da senha (PBKDF2 + salt) e cria/valida os tokens JWT. |
| `validators.py` | Validação e padronização dos dados: placa (antiga e Mercosul), chassi VIN, ano, CPF/CNPJ com dígitos verificadores e RENAVAM. |
| `schemas.py` | Contratos Pydantic de entrada e saída (login, token, usuário, criação de veículo, resposta e listagem). É aqui que a validação vira HTTP 422. |
| `dependencies.py` | "Guarda de portão" do FastAPI: exige `Authorization: Bearer <token>`, devolve 401 em português e entrega a matrícula ao endpoint. |
| `seed.py` | Dados de demonstração: 2 usuários e 6 veículos. As senhas entram já com hash. Só é usado quando o banco está vazio. |

### Pasta `app/routers/` (entrada HTTP)

| Arquivo | O que faz |
|---|---|
| `__init__.py` | Marca `routers` como pacote. |
| `auth.py` | Endpoints de autenticação: `POST /api/auth/login` (devolve o JWT) e `GET /api/auth/me` (dados do usuário logado). |
| `veiculos.py` | Endpoints de veículos: registrar (`POST`), pesquisar com filtros e paginação (`GET`), estatísticas (`GET`) e detalhe por id (`GET`). |

### Pasta `app/services/` (regras de negócio)

| Arquivo | O que faz |
|---|---|
| `__init__.py` | Marca `services` como pacote. |
| `usuario_service.py` | Confere matrícula e senha contra o banco e busca os dados públicos do usuário. |
| `veiculo_service.py` | Coração do sistema: monta o `INSERT` do registro, traduz violação de `UNIQUE` em erro de duplicidade (HTTP 409), monta o `WHERE` da pesquisa (exata por índice, parcial por `LIKE`) e calcula as estatísticas. |

### Pasta `scripts/` (ferramentas de apoio)

| Arquivo | O que faz |
|---|---|
| `gerar_dados.py` | Gera a massa simulada (placas, chassis, CPFs e nomes válidos) e insere em lote no banco. Atende à Fase 4 do documento. |
| `stress_test.py` | Mede o tempo de resposta real da API em três cenários (placa exata, filtro por cor, pesquisa parcial) e imprime média, p50, p95, p99 e máximo. |

### Pasta `tests/` (testes automatizados)

| Arquivo | O que faz |
|---|---|
| `conftest.py` | Configuração compartilhada: aponta o banco para `test_app.db`, acelera o hash e oferece as fixtures `client`, `token`, `auth_client` e `payload_veiculo`. |
| `test_auth.py` | Login válido/inválido e proteção por token (sem token, token inválido, `/auth/me`). |
| `test_validacao.py` | Testes unitários dos validadores: placa, chassi, ano, CPF/CNPJ e RENAVAM. |
| `test_veiculos_crud.py` | Registro, normalização, duplicidade (409), detalhe, estatísticas e confirmação de que `PATCH`/`DELETE` não existem (405). |
| `test_veiculos_busca.py` | Filtros combinados, pesquisa parcial (início/meio/fim), ausência de resultado e paginação. |
| `test_app.db` | Banco temporário criado e apagado automaticamente a cada execução; nunca deve ser confundido com o banco real em `data/`. |

## Decisões de projeto

- **Registro + consulta** (documento: "Sistema de Registro e Consulta").
- Marca e modelo em colunas separadas; filtro `marca_modelo` pesquisa a
  concatenação.
- Unicidade garantida pelo banco (`UNIQUE` em placa e chassi) → HTTP 409,
  segura mesmo sob concorrência.
- Senhas com PBKDF2 + salt; autenticação por JWT.
- SQLite no protótipo; camada de dados isolada para futura migração a
  PostgreSQL/CRM.

## Variáveis de ambiente (opcionais)

| Variável | Padrão | Uso |
|---|---|---|
| `APP_DB_PATH` | `backend/data/app.db` | Caminho do banco |
| `APP_SECRET_KEY` | valor de demo | Chave do JWT (troque em produção) |
| `APP_TOKEN_EXPIRE_MINUTES` | `60` | Validade do token |
| `APP_PBKDF2_ITERACOES` | `200000` | Custo do hash de senha |
| `APP_CORS_ALLOW_ALL` | `1` | Libera CORS (protótipo) |

## Front-end

O front-end (na raiz do projeto) já consome esta API:

```powershell
# em outro terminal, na raiz do projeto
py -m http.server 5500 --bind 127.0.0.1
# abra http://127.0.0.1:5500/
```

`api.js` é a camada de comunicação (URL, token JWT, tradução dos erros
HTTP); `script.js` cuida apenas das telas. Detalhes no
[`README.md`](../README.md) da raiz.

## Próximos passos

1. Telas de edição e exclusão de veículos; com elas, reativar `PATCH` e
   `DELETE` na API (hoje fora, para expor só o que o front usa).
2. Migrar para PostgreSQL quando o volume crescer.
3. Perfis de usuário (admin/operador) e auditoria de consultas.

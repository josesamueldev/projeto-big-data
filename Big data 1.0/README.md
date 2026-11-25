# Sistema de Registro e Consulta de Veículos

Projeto de extensão (FACI Wyden / **CIOp — Centro Integrado de Operações**,
Belém/PA) para substituir a consulta manual em planilhas por um sistema com
**registro validado** e **pesquisa indexada** de veículos.

```
┌──────────────────────────────┐        HTTP/JSON        ┌───────────────────────────┐
│  front-end (HTML/CSS/JS)     │  ────────────────────▶  │  back-end (FastAPI)       │
│  index.html · styles.css     │  ◀────────────────────  │  backend/app/...          │
│  api.js · script.js          │        JWT + JSON       │  SQLite + índices         │
└──────────────────────────────┘                         └───────────────────────────┘
```

## Rodar o projeto

São **dois processos**: o backend (API) e o front-end (arquivos estáticos).

**1. Backend** (porta 8000):

```powershell
cd backend
py -m pip install -r requirements.txt
py run.py
```

**2. Front-end** (porta 5500), em outro terminal, na raiz do projeto:

```powershell
py -m http.server 5500 --bind 127.0.0.1
```

Abra **http://127.0.0.1:5500/** e entre com:

| Matrícula | Senha |
|---|---|
| `123456` | `123456` |
| `789012` | `senha789` |

> Também é possível abrir o `index.html` direto (duplo clique): o backend
> libera CORS no protótipo. O servidor local em 5500 é apenas mais estável
> para o navegador.

## O que o sistema faz

- **Login** com matrícula e senha → token JWT guardado na sessão da aba.
- **Pesquisa** por placa, chassi, marca/modelo, cor, proprietário, CPF/CNPJ e
  ano, com resultados paginados.
- **Pesquisa parcial** por trecho na **placa** ou no **chassi**
  (início / meio / fim).
- **Cadastro de veículo** com validação no servidor: placa (antiga e
  Mercosul), chassi VIN, ano, CPF/CNPJ com dígitos verificadores.
- **Bloqueio de duplicidade**: placa ou chassi repetido → HTTP 409.
- **Edição de veículo** (modal pré-preenchido, atualização parcial PATCH).
- **Exclusão de veículo** com **modal de confirmação tematizado** (centrado,
  backdrop blur) substituindo o `confirm()` nativo do navegador.

## Estrutura do front-end

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura das telas (login, painel de pesquisa, modal de cadastro, **modal de edição**, **modal de confirmação de exclusão**) |
| `styles.css` | Design system e responsividade (inclui `.modal-backdrop.blur-backdrop` com `backdrop-filter: blur(4px)`) |
| `api.js` | Camada de comunicação: o único arquivo que conhece a URL da API, o token e os erros HTTP (agora com `atualizarVeiculo` e `removerVeiculo`) |
| `script.js` | Comportamento das telas (login, pesquisa, paginação, cadastro, **edição**, **exclusão com modal customizado**) |

## Backend

Documentação completa da API (endpoints, validações, testes e teste de
estresse): [`backend/README.md`](backend/README.md).
Decisões de arquitetura: [`backend/PLANO.md`](backend/PLANO.md).
Swagger interativo: http://127.0.0.1:8000/docs

## Testes

```powershell
cd backend
py -m pytest -q          # 68 testes automatizados
```

Teste de estresse (com o backend no ar):

```powershell
py scripts/gerar_dados.py --qtd 100000
py scripts/stress_test.py --n 50
```

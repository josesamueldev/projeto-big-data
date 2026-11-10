"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/main.py

Ponto de entrada da API (FastAPI).

Responsabilidades:
  - Criar a aplicação e habilitar CORS (o front-end roda em outra origem).
  - No startup (lifespan): criar tabelas, índices e carga inicial.
  - Registrar os routers de autenticação e veículos.

Para rodar (na pasta backend/):
    py -m uvicorn app.main:app --reload
Documentação interativa automática: http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ALLOW_ALL, CORS_ORIGINS
from .database import init_db
from .routers import auth, veiculos
from .seed import dados_iniciais


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Executa na subida do servidor: prepara o banco (schema + seed)."""
    init_db(dados_iniciais())
    yield
    # (shutdown) Nada a liberar: o SQLite abre/fecha conexão por requisição.


def create_app() -> FastAPI:
    """Fábrica da aplicação (facilita testes e múltiplas configurações)."""
    app = FastAPI(
        title="Sistema de Registro e Consulta de Veículos",
        description=(
            "API do projeto de extensão desenvolvido para o CIOp (Centro "
            "Integrado de Operações). Substitui a consulta manual em planilhas "
            "por registro validado e pesquisa indexada de veículos."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS: liberar tudo no protótipo (front pode vir de file:// ou localhost).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if CORS_ALLOW_ALL else CORS_ORIGINS,
        allow_credentials=False,  # obrigatório ser False quando origins = "*"
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(veiculos.router)

    @app.get("/", tags=["Sistema"])
    def raiz() -> dict:
        """Atalho informativo para quem abre a raiz no navegador."""
        return {
            "sistema": "Sistema de Registro e Consulta de Veículos",
            "status": "ok",
            "documentacao": "/docs",
        }

    @app.get("/api/health", tags=["Sistema"])
    def health() -> dict:
        """Verificação simples de disponibilidade (não exige token)."""
        return {"status": "ok"}

    return app


app = create_app()

"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/config.py

Centraliza as CONFIGURAÇÕES do backend.

Cada configuração lê uma variável de ambiente (os.getenv) e, se ela não
existir, cai num valor padrão seguro para demonstração. Em produção basta
definir as variáveis (APP_SECRET_KEY, APP_DB_PATH, etc.).
"""

import os
from pathlib import Path

# BASE_DIR aponta para a pasta "backend/".
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# BANCO DE DADOS
# ---------------------------------------------------------------------------
# SQLite no protótipo: arquivo único, sem instalar servidor de banco.
# A troca por PostgreSQL fica isolada na camada database/services.
DB_PATH = Path(os.getenv("APP_DB_PATH", str(BASE_DIR / "data" / "app.db")))

# ---------------------------------------------------------------------------
# SEGURANÇA (JWT + hash de senha)
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv(
    "APP_SECRET_KEY", "chave-de-demonstracao-troque-em-producao-32bytes-min"
)
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("APP_TOKEN_EXPIRE_MINUTES", "60"))

# Iterações do PBKDF2. O padrão é o recomendado para produção;
# os testes diminuem esse valor para ficarem rápidos.
PBKDF2_ITERACOES = int(os.getenv("APP_PBKDF2_ITERACOES", "200000"))

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# Controla quais origens podem chamar a API pelo navegador. O front-end
# pode ser aberto direto (origin "null") ou via localhost, então liberamos
# tudo no protótipo. Em produção, restrinja a lista.
CORS_ALLOW_ALL = os.getenv("APP_CORS_ALLOW_ALL", "1") == "1"
CORS_ORIGINS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
]

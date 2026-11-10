"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/security.py

SEGURANÇA da API:
  1. Hashing de senha (PBKDF2 com salt, biblioteca padrão do Python)
  2. Geração e validação de tokens JWT (login)
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import ALGORITHM, PBKDF2_ITERACOES, SECRET_KEY, TOKEN_EXPIRE_MINUTES


# ===========================================================================
# 1. HASHING DE SENHA
# ===========================================================================

def hash_password(senha: str) -> str:
    """Gera 'salt$digest' para guardar no banco.

    O salt é aleatório por usuário e evita que duas pessoas com a mesma
    senha tenham o mesmo hash (bloqueia ataques com tabelas prontas).
    """
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", senha.encode("utf-8"), salt.encode("utf-8"), PBKDF2_ITERACOES
    ).hex()
    return f"{salt}${digest}"


def verify_password(senha_digitada: str, armazenado: str) -> bool:
    """Confere a senha digitada contra o hash salvo no banco."""
    try:
        salt, digest_salvo = armazenado.split("$", 1)
    except (AttributeError, ValueError):
        return False  # formato inesperado no banco → recusa

    digest_tentativa = hashlib.pbkdf2_hmac(
        "sha256", senha_digitada.encode("utf-8"), salt.encode("utf-8"),
        PBKDF2_ITERACOES,
    ).hex()
    # compare_digest compara em tempo constante.
    return secrets.compare_digest(digest_tentativa, digest_salvo)


# ===========================================================================
# 2. TOKENS JWT
# ===========================================================================

def create_access_token(matricula: str) -> str:
    """Cria o token que o front-end guarda e envia em cada requisição."""
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": matricula, "exp": expira_em}, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Devolve a matrícula (sub) do token, ou None se inválido/expirado."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None

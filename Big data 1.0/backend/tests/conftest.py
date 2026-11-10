"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: tests/conftest.py

Configuração compartilhada dos testes:
  - aponta o banco para um arquivo temporário (tests/test_app.db)
  - reduz as iterações do PBKDF2 (testes rápidos)
  - oferece fixtures: client, token, auth_client e payload_veiculo

Cada teste roda com um banco NOVO e recém-semeado (6 veículos), garantindo
resultados determinísticos e independentes entre si.
"""

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = Path(__file__).resolve().parent / "test_app.db"

# IMPORTANTE: definir antes de importar app.config (que lê no import).
os.environ["APP_DB_PATH"] = str(TEST_DB)
os.environ["APP_PBKDF2_ITERACOES"] = "1000"
os.environ["APP_SECRET_KEY"] = "chave-secreta-de-testes-com-32-bytes-ou-mais"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


def _apagar_banco_de_teste() -> None:
    """Remove o banco de teste e os arquivos auxiliares do modo WAL."""
    for sufixo in ("", "-wal", "-shm"):
        arquivo = Path(str(TEST_DB) + sufixo)
        if arquivo.exists():
            arquivo.unlink()


@pytest.fixture()
def client():
    """Cliente HTTP com banco limpo e semeado a cada teste."""
    _apagar_banco_de_teste()

    from app.main import app  # import tardio: env já configurada

    with TestClient(app) as cliente:
        yield cliente


@pytest.fixture()
def token(client) -> str:
    """Token JWT de um usuário de demonstração."""
    resposta = client.post(
        "/api/auth/login", json={"matricula": "123456", "senha": "123456"}
    )
    assert resposta.status_code == 200, resposta.text
    return resposta.json()["access_token"]


@pytest.fixture()
def auth_client(client, token):
    """Cliente já autenticado (envia o Bearer token em todas as chamadas)."""
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


@pytest.fixture()
def payload_veiculo():
    """Fábrica de payload válido para POST /api/veiculos."""

    def _payload(**alteracoes):
        base = {
            "placa": "XYZ-9876",
            "chassi": "9BWZZZ377VT009999",
            "renavam": "12345678901",
            "marca": "Fiat",
            "modelo": "Mobi Like",
            "cor": "Azul",
            "ano": 2022,
            "proprietario": "Teste da Silva",
            "cpf_cnpj": "111.444.777-35",
        }
        base.update(alteracoes)
        return base

    return _payload

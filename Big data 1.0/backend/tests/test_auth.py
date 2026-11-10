"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: tests/test_auth.py

Testes de autenticação (login e proteção dos endpoints).
"""


def test_login_sucesso(client):
    resposta = client.post(
        "/api/auth/login", json={"matricula": "123456", "senha": "123456"}
    )

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["token_type"] == "bearer"
    assert dados["access_token"]
    assert dados["matricula"] == "123456"
    assert dados["nome"] == "Servidor Demonstração"


def test_login_senha_errada(client):
    resposta = client.post(
        "/api/auth/login", json={"matricula": "123456", "senha": "senha-errada"}
    )

    assert resposta.status_code == 401
    assert "inválidos" in resposta.json()["detail"]


def test_login_matricula_inexistente(client):
    resposta = client.post(
        "/api/auth/login", json={"matricula": "000000", "senha": "123456"}
    )

    assert resposta.status_code == 401


def test_login_campos_vazios_retorna_422(client):
    resposta = client.post("/api/auth/login", json={"matricula": "", "senha": ""})
    assert resposta.status_code == 422


def test_me_com_token(auth_client):
    resposta = auth_client.get("/api/auth/me")

    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "Servidor Demonstração"


def test_me_sem_token(client):
    resposta = client.get("/api/auth/me")
    assert resposta.status_code == 401


def test_me_token_invalido(client):
    resposta = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer token-invalido"}
    )
    assert resposta.status_code == 401

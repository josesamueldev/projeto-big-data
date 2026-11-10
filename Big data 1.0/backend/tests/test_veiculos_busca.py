"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: tests/test_veiculos_busca.py

Testes da PESQUISA: filtros combinados, pesquisa parcial (Início/Meio/Fim),
normalização da placa digitada, ausência de resultados e paginação.
"""


def test_pesquisa_sem_token_retorna_401(client):
    resposta = client.get("/api/veiculos")
    assert resposta.status_code == 401


def test_pesquisa_sem_filtros_retorna_todos(auth_client):
    resposta = auth_client.get("/api/veiculos")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["total"] == 6  # dados do seed
    assert dados["page"] == 1
    assert dados["limit"] == 20
    assert len(dados["items"]) == 6


def test_pesquisa_placa_exata(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"placa": "ABC-1234"})

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["modelo"] == "Uno Mille 1.0"


def test_pesquisa_placa_sem_mascara_e_normalizada(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"placa": "abc1234"})

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["placa"] == "ABC-1234"


def test_pesquisa_placa_por_trecho(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"placa": "ABC"})

    assert resposta.json()["total"] == 1


def test_pesquisa_marca_modelo_parcial(auth_client):
    assert auth_client.get("/api/veiculos", params={"marca_modelo": "Fiat"}).json()["total"] == 2
    assert auth_client.get("/api/veiculos", params={"marca_modelo": "Fiat Uno"}).json()["total"] == 1
    assert auth_client.get("/api/veiculos", params={"marca_modelo": "honda"}).json()["total"] == 2


def test_pesquisa_cor(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"cor": "prata"})

    assert resposta.json()["total"] == 1


def test_pesquisa_proprietario(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"proprietario": "Maria"})

    assert resposta.json()["total"] == 1


def test_pesquisa_cpf_sem_mascara(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"cpf_cnpj": "111444"})

    # Dois veículos do seed compartilham o CPF 111.444.777-35.
    assert resposta.json()["total"] == 2


def test_pesquisa_ano(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"ano": 2020})

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["placa"] == "JKL-3456"


# ===========================================================================
# PESQUISA PARCIAL (Início / Meio / Fim)
# ===========================================================================

def test_parcial_inicio_placa(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_inicio": "AB", "partial_campo": "placa"}
    )

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["placa"] == "ABC-1234"


def test_parcial_meio_placa(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_meio": "C-1", "partial_campo": "placa"}
    )

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["placa"] == "ABC-1234"


def test_parcial_fim_placa(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_fim": "3456", "partial_campo": "placa"}
    )

    dados = resposta.json()
    assert dados["total"] == 1
    assert dados["items"][0]["placa"] == "JKL-3456"


def test_parcial_inicio_chassi(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_inicio": "9BW", "partial_campo": "chassi"}
    )

    # No seed, três veículos têm chassi começando por 9BW.
    assert resposta.json()["total"] == 3


def test_parcial_ignora_maiusculas_e_separadores(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_inicio": "ab c", "partial_campo": "placa"}
    )

    # "ab c" -> "ABC" (sem espaços) e maiúsculo
    assert resposta.json()["total"] == 1


def test_parcial_campo_invalido_retorna_422(auth_client):
    resposta = auth_client.get(
        "/api/veiculos", params={"partial_inicio": "AB", "partial_campo": "cor"}
    )
    assert resposta.status_code == 422


# ===========================================================================
# SEM RESULTADO E PAGINAÇÃO
# ===========================================================================

def test_pesquisa_sem_resultado(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"placa": "ZZZ-9999"})

    dados = resposta.json()
    assert dados["total"] == 0
    assert dados["items"] == []


def test_paginacao(auth_client):
    primeira = auth_client.get("/api/veiculos", params={"limit": 2, "page": 1}).json()
    ultima = auth_client.get("/api/veiculos", params={"limit": 2, "page": 3}).json()

    assert primeira["total"] == 6
    assert len(primeira["items"]) == 2
    assert len(ultima["items"]) == 2
    # Sem sobreposição entre páginas (ordenação determinística por placa).
    placas_p1 = {item["placa"] for item in primeira["items"]}
    placas_p3 = {item["placa"] for item in ultima["items"]}
    assert placas_p1.isdisjoint(placas_p3)


def test_paginacao_limite_invalido_retorna_422(auth_client):
    resposta = auth_client.get("/api/veiculos", params={"limit": 500})
    assert resposta.status_code == 422

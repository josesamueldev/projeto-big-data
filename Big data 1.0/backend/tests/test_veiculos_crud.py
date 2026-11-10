"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: tests/test_veiculos_crud.py

Testes de REGISTRO e detalhe de veículos
(incluindo o bloqueio de duplicidade exigido pela documentação).

A API hoje expõe apenas o que o front-end usa: registrar, pesquisar e
consultar. Os testes abaixo também confirmam que PATCH e DELETE NÃO estão
disponíveis (HTTP 405) — quando as telas de edição/exclusão existirem, eles
serão reativados junto com novos testes.
"""


def _criar(auth_client, payload_veiculo, **alteracoes) -> dict:
    resposta = auth_client.post("/api/veiculos", json=payload_veiculo(**alteracoes))
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_registrar_veiculo_valido(auth_client, payload_veiculo):
    veiculo = _criar(auth_client, payload_veiculo)

    assert isinstance(veiculo["id"], int)
    assert veiculo["placa"] == "XYZ-9876"
    assert veiculo["chassi"] == "9BWZZZ377VT009999"
    assert veiculo["cpf_cnpj"] == "111.444.777-35"
    assert veiculo["criado_em"]


def test_registrar_normaliza_placa_e_chassi(auth_client, payload_veiculo):
    veiculo = _criar(
        auth_client,
        payload_veiculo,
        placa="xyz9876",
        chassi="9bwzzz377vt009998",
        cpf_cnpj="11144477735",
    )

    assert veiculo["placa"] == "XYZ-9876"
    assert veiculo["chassi"] == "9BWZZZ377VT009998"
    assert veiculo["cpf_cnpj"] == "111.444.777-35"


def test_registrar_placa_duplicada_retorna_409(auth_client, payload_veiculo):
    _criar(auth_client, payload_veiculo)

    resposta = auth_client.post(
        "/api/veiculos",
        json=payload_veiculo(chassi="9BWZZZ377VT009998"),
    )

    assert resposta.status_code == 409
    assert "placa" in resposta.json()["detail"]


def test_registrar_chassi_duplicado_retorna_409(auth_client, payload_veiculo):
    _criar(auth_client, payload_veiculo)

    resposta = auth_client.post(
        "/api/veiculos",
        json=payload_veiculo(placa="XYZ-0001"),
    )

    assert resposta.status_code == 409
    assert "chassi" in resposta.json()["detail"]


def test_registrar_sem_token_retorna_401(client, payload_veiculo):
    resposta = client.post("/api/veiculos", json=payload_veiculo())
    assert resposta.status_code == 401


def test_detalhar_veiculo(auth_client, payload_veiculo):
    criado = _criar(auth_client, payload_veiculo)

    resposta = auth_client.get(f"/api/veiculos/{criado['id']}")
    assert resposta.status_code == 200
    assert resposta.json()["placa"] == criado["placa"]


def test_detalhar_inexistente_retorna_404(auth_client):
    resposta = auth_client.get("/api/veiculos/99999")
    assert resposta.status_code == 404


def test_atualizar_nao_esta_disponivel(auth_client, payload_veiculo):
    """Edição só será exposta quando o front-end tiver a tela correspondente."""
    criado = _criar(auth_client, payload_veiculo)

    resposta = auth_client.patch(
        f"/api/veiculos/{criado['id']}", json={"cor": "Vermelho"}
    )

    assert resposta.status_code == 405


def test_remover_nao_esta_disponivel(auth_client, payload_veiculo):
    """Exclusão só será exposta quando o front-end tiver a tela correspondente."""
    criado = _criar(auth_client, payload_veiculo)

    resposta = auth_client.delete(f"/api/veiculos/{criado['id']}")

    assert resposta.status_code == 405
    # O veículo continua na base.
    assert auth_client.get(f"/api/veiculos/{criado['id']}").status_code == 200


def test_estatisticas(auth_client):
    resposta = auth_client.get("/api/veiculos/estatisticas")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["total_veiculos"] == 6  # apenas os dados do seed
    assert dados["total_proprietarios"] == 6
    assert dados["por_cor"]["Branco"] == 2

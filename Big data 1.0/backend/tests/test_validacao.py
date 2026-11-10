"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: tests/test_validacao.py

Testes da padronização/validação (requisito 2.4 da documentação):
placas, chassis, anos e CPF/CNPJ — tanto nas funções puras quanto na API.
"""

import pytest

from app.validators import (
    ValidacaoError,
    normalizar_chassi,
    normalizar_cpf_cnpj,
    normalizar_placa,
    normalizar_renavam,
    validar_ano,
)


# ===========================================================================
# PLACA
# ===========================================================================

@pytest.mark.parametrize(
    ("entrada", "esperado"),
    [
        ("ABC-1234", "ABC-1234"),
        ("abc1234", "ABC-1234"),
        ("abc 1234", "ABC-1234"),
        ("abc1d23", "ABC1D23"),       # Mercosul
        ("ABC1D23", "ABC1D23"),
    ],
)
def test_normalizar_placa_aceita_formatos_validos(entrada, esperado):
    assert normalizar_placa(entrada) == esperado


@pytest.mark.parametrize("invalida", ["AB-1234", "ABCD-1234", "1234ABC", "", "ABC-12"])
def test_normalizar_placa_rejeita_formatos_invalidos(invalida):
    with pytest.raises(ValidacaoError):
        normalizar_placa(invalida)


# ===========================================================================
# CHASSI
# ===========================================================================

def test_normalizar_chassi_valido():
    assert normalizar_chassi("9bwzzz377vt004251") == "9BWZZZ377VT004251"


@pytest.mark.parametrize("invalido", ["9BWZZZ377VT00425", "9BWZZZ377VT0042511", "9BWZZZ377VT00425I"])
def test_normalizar_chassi_invalido(invalido):
    with pytest.raises(ValidacaoError):
        normalizar_chassi(invalido)


# ===========================================================================
# ANO
# ===========================================================================

def test_validar_ano_ok():
    assert validar_ano("2015") == 2015
    assert validar_ano(2024) == 2024


@pytest.mark.parametrize("invalido", ["1885", "abc", "3000", None])
def test_validar_ano_invalido(invalido):
    with pytest.raises(ValidacaoError):
        validar_ano(invalido)


# ===========================================================================
# CPF / CNPJ
# ===========================================================================

@pytest.mark.parametrize(
    ("entrada", "esperado"),
    [
        ("11144477735", "111.444.777-35"),
        ("123.456.789-09", "123.456.789-09"),
        ("11222333000181", "11.222.333/0001-81"),
    ],
)
def test_normalizar_cpf_cnpj_valido(entrada, esperado):
    assert normalizar_cpf_cnpj(entrada) == esperado


@pytest.mark.parametrize("invalido", ["111.444.777-34", "11111111111", "11.222.333/0001-80", ""])
def test_normalizar_cpf_cnpj_invalido(invalido):
    with pytest.raises(ValidacaoError):
        normalizar_cpf_cnpj(invalido)


# ===========================================================================
# RENAVAM
# ===========================================================================

def test_renavam_opcional():
    assert normalizar_renavam(None) is None
    assert normalizar_renavam("") is None
    assert normalizar_renavam("00123456789") == "00123456789"


def test_renavam_invalido():
    with pytest.raises(ValidacaoError):
        normalizar_renavam("123")


# ===========================================================================
# VALIDAÇÃO ATRAVÉS DA API (HTTP 422)
# ===========================================================================

def test_api_rejeita_placa_invalida(auth_client, payload_veiculo):
    resposta = auth_client.post("/api/veiculos", json=payload_veiculo(placa="123-ABCD"))
    assert resposta.status_code == 422


def test_api_rejeita_cpf_invalido(auth_client, payload_veiculo):
    resposta = auth_client.post(
        "/api/veiculos", json=payload_veiculo(cpf_cnpj="111.111.111-11")
    )
    assert resposta.status_code == 422


def test_api_rejeita_ano_fora_do_intervalo(auth_client, payload_veiculo):
    resposta = auth_client.post("/api/veiculos", json=payload_veiculo(ano=1800))
    assert resposta.status_code == 422


def test_api_rejeita_campo_obrigatorio_ausente(auth_client, payload_veiculo):
    corpo = payload_veiculo()
    corpo.pop("proprietario")
    resposta = auth_client.post("/api/veiculos", json=corpo)
    assert resposta.status_code == 422

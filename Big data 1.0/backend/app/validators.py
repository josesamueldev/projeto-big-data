"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/validators.py

VALIDAÇÃO E PADRONIZAÇÃO das entradas (requisito 2.4 da documentação:
"o sistema deve validar e padronizar as entradas (como o formato correto
das placas), bloqueando cadastros ... inconsistentes").

Todas as funções levantam ValidacaoError (que herda de ValueError) quando o
dado é inválido. O Pydantic converte isso automaticamente em resposta
HTTP 422 com a mensagem em português para o front-end.
"""

import re
from datetime import date


class ValidacaoError(ValueError):
    """Erro de validação de dado de entrada (vira HTTP 422 no FastAPI)."""


# ---------------------------------------------------------------------------
# TEXTO GENÉRICO
# ---------------------------------------------------------------------------

def texto_obrigatorio(valor, campo: str) -> str:
    """Remove espaços das pontas e exige pelo menos 2 caracteres."""
    if not isinstance(valor, str):
        raise ValidacaoError(f"O campo '{campo}' deve ser um texto.")
    limpo = valor.strip()
    if len(limpo) < 2:
        raise ValidacaoError(f"O campo '{campo}' é obrigatório (mínimo 2 caracteres).")
    return limpo


# ---------------------------------------------------------------------------
# PLACA (formatos antigo e Mercosul)
# ---------------------------------------------------------------------------
# Padrão antigo  : ABC-1234  (3 letras + 4 números)
# Padrão Mercosul: ABC1D23   (3 letras + 1 número + 1 letra + 2 números)

_PLACA_ANTIGA = re.compile(r"^[A-Z]{3}[0-9]{4}$")
_PLACA_MERCOSUL = re.compile(r"^[A-Z]{3}[0-9][A-Z][0-9]{2}$")


def normalizar_placa(valor) -> str:
    """Padroniza a placa; levanta ValidacaoError se o formato for inválido.

    Exemplos:
        "abc1234"  -> "ABC-1234"
        "abc 1d23" -> "ABC1D23"
    """
    if not isinstance(valor, str):
        raise ValidacaoError("Placa inválida: deve ser um texto.")

    limpo = re.sub(r"[^A-Za-z0-9]", "", valor).upper()

    if _PLACA_ANTIGA.match(limpo):
        return f"{limpo[:3]}-{limpo[3:]}"
    if _PLACA_MERCOSUL.match(limpo):
        return limpo

    raise ValidacaoError("Placa inválida. Use o formato ABC-1234 ou ABC1D23 (Mercosul).")


# ---------------------------------------------------------------------------
# CHASSI / VIN
# ---------------------------------------------------------------------------
# O padrão VIN tem 17 posições alfanuméricas e não usa as letras I, O e Q
# (para não confundir com 1 e 0).

_CHASSI = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")


def normalizar_chassi(valor) -> str:
    """Padroniza o chassi para maiúsculas sem separadores; valida 17 posições."""
    if not isinstance(valor, str):
        raise ValidacaoError("Chassi inválido: deve ser um texto.")

    limpo = re.sub(r"[^A-Za-z0-9]", "", valor).upper()
    if not _CHASSI.match(limpo):
        raise ValidacaoError("Chassi/VIN inválido: são necessários 17 caracteres alfanuméricos (sem I, O, Q).")
    return limpo


# ---------------------------------------------------------------------------
# ANO
# ---------------------------------------------------------------------------

def validar_ano(valor) -> int:
    """Converte para inteiro e exige um ano plausível (1886 até o próximo ano)."""
    try:
        ano = int(valor)
    except (TypeError, ValueError):
        raise ValidacaoError("Ano inválido: informe um número de 4 dígitos.") from None

    limite = date.today().year + 1
    if ano < 1886 or ano > limite:
        raise ValidacaoError(f"Ano inválido: deve estar entre 1886 e {limite}.")
    return ano


# ---------------------------------------------------------------------------
# CPF / CNPJ
# ---------------------------------------------------------------------------

def _digitos_verificadores_cpf(digitos: str) -> tuple[int, int]:
    soma1 = sum(int(d) * peso for d, peso in zip(digitos[:9], range(10, 1, -1)))
    resto1 = (soma1 * 10) % 11
    d1 = 0 if resto1 == 10 else resto1

    soma2 = sum(int(d) * peso for d, peso in zip(digitos[:10], range(11, 1, -1)))
    resto2 = (soma2 * 10) % 11
    d2 = 0 if resto2 == 10 else resto2
    return d1, d2


def _cpf_valido(digitos: str) -> bool:
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False
    d1, d2 = _digitos_verificadores_cpf(digitos)
    return digitos[9] == str(d1) and digitos[10] == str(d2)


def _cnpj_valido(digitos: str) -> bool:
    if len(digitos) != 14 or len(set(digitos)) == 1:
        return False

    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    def dv(base: str, pesos: list[int]) -> int:
        soma = sum(int(d) * p for d, p in zip(base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    d1 = dv(digitos[:12], pesos1)
    d2 = dv(digitos[:13], pesos2)
    return digitos[12] == str(d1) and digitos[13] == str(d2)


def normalizar_cpf_cnpj(valor) -> str:
    """Remove máscara, confere os dígitos verificadores e devolve formatado.

    Exemplos:
        "11144477735"      -> "111.444.777-35"
        "11222333000181"   -> "11.222.333/0001-81"
    """
    if not isinstance(valor, str):
        raise ValidacaoError("CPF/CNPJ inválido: deve ser um texto.")

    digitos = re.sub(r"\D", "", valor)

    if len(digitos) == 11 and _cpf_valido(digitos):
        return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"
    if len(digitos) == 14 and _cnpj_valido(digitos):
        return f"{digitos[:2]}.{digitos[2:5]}.{digitos[5:8]}/{digitos[8:12]}-{digitos[12:]}"

    raise ValidacaoError("CPF/CNPJ inválido: confira os números digitados.")


# ---------------------------------------------------------------------------
# RENAVAM (opcional)
# ---------------------------------------------------------------------------

def normalizar_renavam(valor) -> str | None:
    """Renavam é opcional; quando informado deve ter de 9 a 11 dígitos."""
    if valor is None:
        return None
    if not isinstance(valor, str):
        raise ValidacaoError("Renavam inválido: deve ser um texto.")

    digitos = re.sub(r"\D", "", valor)
    if digitos == "":
        return None
    if not 9 <= len(digitos) <= 11:
        raise ValidacaoError("Renavam inválido: informe de 9 a 11 dígitos.")
    return digitos

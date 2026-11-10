"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/services/veiculo_service.py

Coração do sistema: REGISTRO e PESQUISA de veículos.

Pontos importantes:
  - Unicidade de placa/chassi é garantida pelo banco (UNIQUE), não por
    "checagem prévia" — isso funciona mesmo com acessos simultâneos.
  - Toda consulta usa parâmetros (?) — nunca concatenamos texto do usuário
    no SQL (proteção contra SQL injection).
  - Busca EXATA por placa/chassi usa índice único (rápida, requisito do doc);
    busca por trecho (LIKE) faz varredura, limitação documentada.
"""

import re
import sqlite3
from contextlib import closing

from ..database import get_connection
from ..validators import ValidacaoError, normalizar_placa

# Campos editáveis de um veículo (ordem usada nos INSERT).
CAMPOS_VEICULO = (
    "placa", "chassi", "renavam", "marca", "modelo",
    "cor", "ano", "proprietario", "cpf_cnpj", "observacoes",
)

CAMPOS_PARCIAIS = ("placa", "chassi")


class VeiculoDuplicadoError(Exception):
    """Placa ou chassi já cadastrado em outro veículo (vira HTTP 409)."""

    def __init__(self, campo: str) -> None:
        self.campo = campo
        super().__init__(f"Veículo duplicado: {campo}")


# ===========================================================================
# HELPERS
# ===========================================================================

def _somente_alfanumerico(valor: str) -> str:
    """Remove hífen/espaços e passa para maiúsculas (usado em trechos de placa/chassi)."""
    return re.sub(r"[^A-Za-z0-9]", "", valor or "").upper()


def _capturar_duplicidade(exc: sqlite3.IntegrityError) -> None:
    """Converte o erro de UNIQUE do SQLite no nosso erro de negócio."""
    mensagem = str(exc)
    if "veiculo.placa" in mensagem:
        raise VeiculoDuplicadoError("placa") from exc
    if "veiculo.chassi" in mensagem:
        raise VeiculoDuplicadoError("chassi") from exc
    raise exc


# ===========================================================================
# REGISTRO
# ===========================================================================

def registrar(dados: dict) -> dict:
    """Insere um veículo e devolve o registro criado.

    Espera um dicionário já validado/normalizado pelo schema Pydantic.
    """
    valores = [dados.get(campo) for campo in CAMPOS_VEICULO]
    colunas = ", ".join(CAMPOS_VEICULO)
    marcadores = ", ".join("?" for _ in CAMPOS_VEICULO)

    with closing(get_connection()) as conn:
        try:
            cursor = conn.execute(
                f"INSERT INTO veiculo ({colunas}) VALUES ({marcadores})", valores
            )
            conn.commit()
        except sqlite3.IntegrityError as exc:
            conn.rollback()
            _capturar_duplicidade(exc)

    return obter(cursor.lastrowid)


def obter(veiculo_id: int) -> dict | None:
    """Busca um veículo pelo id (ou None se não existir)."""
    with closing(get_connection()) as conn:
        linha = conn.execute(
            "SELECT * FROM veiculo WHERE id = ?", (veiculo_id,)
        ).fetchone()
    return dict(linha) if linha else None


# ===========================================================================
# PESQUISA
# ===========================================================================

def _montar_filtros(filtros: dict) -> tuple[list[str], list]:
    """Traduz o dicionário de filtros em cláusulas WHERE parametrizadas."""

    condicoes: list[str] = []
    params: list = []

    # --- Placa -------------------------------------------------------------
    # Se der para normalizar, busca EXATA (usa o índice único — rápida).
    # Caso contrário (ex.: "ABC"), cai para busca por trecho.
    placa = (filtros.get("placa") or "").strip()
    if placa:
        try:
            placa_canonica = normalizar_placa(placa)
        except ValidacaoError:
            # Não é placa completa: busca por trecho (ex.: "ABC").
            condicoes.append("placa LIKE ?")
            params.append(f"%{_somente_alfanumerico(placa)}%")
        else:
            # Placa completa normalizada: igualdade usa o índice único.
            condicoes.append("placa = ?")
            params.append(placa_canonica)

    # --- Chassi ------------------------------------------------------------
    chassi = _somente_alfanumerico(filtros.get("chassi") or "")
    if chassi:
        if len(chassi) == 17:
            condicoes.append("chassi = ?")
            params.append(chassi)
        else:
            condicoes.append("chassi LIKE ?")
            params.append(f"%{chassi}%")

    # --- Marca / Modelo (campo único do front) ------------------------------
    marca_modelo = (filtros.get("marca_modelo") or "").strip()
    if marca_modelo:
        condicoes.append("UPPER(marca || ' ' || modelo) LIKE UPPER(?)")
        params.append(f"%{marca_modelo}%")

    # --- Cor / Proprietário ------------------------------------------------
    cor = (filtros.get("cor") or "").strip()
    if cor:
        condicoes.append("UPPER(cor) LIKE UPPER(?)")
        params.append(f"%{cor}%")

    proprietario = (filtros.get("proprietario") or "").strip()
    if proprietario:
        condicoes.append("UPPER(proprietario) LIKE UPPER(?)")
        params.append(f"%{proprietario}%")

    # --- CPF/CNPJ: aceita tanto com máscara quanto só números --------------
    cpf_cnpj = (filtros.get("cpf_cnpj") or "").strip()
    if cpf_cnpj:
        digitos = re.sub(r"\D", "", cpf_cnpj)
        if digitos:
            condicoes.append(
                "REPLACE(REPLACE(REPLACE(REPLACE(cpf_cnpj,'.',''),'-',''),'/',''),' ','') "
                "LIKE ?"
            )
            params.append(f"%{digitos}%")

    # --- Ano exato ---------------------------------------------------------
    ano = filtros.get("ano")
    if ano not in (None, ""):
        condicoes.append("ano = ?")
        params.append(int(ano))

    # --- PESQUISA PARCIAL (Início / Meio / Fim em placa ou chassi) --------
    campo_parcial = filtros.get("partial_campo") or "placa"
    if campo_parcial not in CAMPOS_PARCIAIS:
        raise ValidacaoError("Campo da pesquisa parcial inválido: use 'placa' ou 'chassi'.")

    # Placas são armazenadas com hífen ("ABC-1234"); comparamos sem ele
    # para que "ABC1" também encontre o início da placa.
    expressao = (
        "REPLACE(UPPER(placa), '-', '')"
        if campo_parcial == "placa"
        else "UPPER(chassi)"
    )

    trechos = (
        ("partial_inicio", "{}%"),   # começa com
        ("partial_meio", "%{}%"),    # contém
        ("partial_fim", "%{}"),      # termina com
    )
    for chave, molde in trechos:
        valor = (filtros.get(chave) or "").strip()
        if valor:
            fragmento = _somente_alfanumerico(valor)
            if fragmento:
                condicoes.append(f"{expressao} LIKE ?")
                params.append(molde.format(fragmento))

    return condicoes, params


def buscar(filtros: dict, page: int = 1, limit: int = 20) -> tuple[int, list[dict]]:
    """Executa a pesquisa combinando todos os filtros preenchidos.

    Retorna (total_encontrado, lista_da_pagina). A ordenação por placa é
    determinística — sem ela, a paginação poderia repetir/perder registros.
    """
    condicoes, params = _montar_filtros(filtros)
    where_sql = " AND ".join(condicoes) if condicoes else "1=1"
    deslocamento = (page - 1) * limit

    with closing(get_connection()) as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM veiculo WHERE {where_sql}", params
        ).fetchone()[0]
        linhas = conn.execute(
            f"SELECT * FROM veiculo WHERE {where_sql} "
            "ORDER BY placa ASC LIMIT ? OFFSET ?",
            [*params, limit, deslocamento],
        ).fetchall()

    return total, [dict(linha) for linha in linhas]


# ===========================================================================
# ESTATÍSTICAS
# ===========================================================================

def estatisticas() -> dict:
    """Totais gerais para o relatório (total de veículos, donos e cores)."""
    with closing(get_connection()) as conn:
        total_veiculos = conn.execute("SELECT COUNT(*) FROM veiculo").fetchone()[0]
        total_proprietarios = conn.execute(
            "SELECT COUNT(DISTINCT proprietario) FROM veiculo"
        ).fetchone()[0]
        linhas_cor = conn.execute(
            "SELECT cor, COUNT(*) AS qtd FROM veiculo "
            "GROUP BY cor ORDER BY qtd DESC, cor ASC LIMIT 10"
        ).fetchall()

    return {
        "total_veiculos": total_veiculos,
        "total_proprietarios": total_proprietarios,
        "por_cor": {linha["cor"]: linha["qtd"] for linha in linhas_cor},
    }

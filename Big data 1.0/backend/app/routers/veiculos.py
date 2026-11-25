"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/routers/veiculos.py

Endpoints de VEÍCULOS (todos exigem token JWT):

    POST   /api/veiculos              → registrar (201 / 409 / 422)
    GET    /api/veiculos              → pesquisar (filtros + paginação)
    GET    /api/veiculos/estatisticas → totais gerais
    GET    /api/veiculos/{id}         → detalhe
    PATCH  /api/veiculos/{id}         → atualizar (200 / 404 / 409 / 422)
    DELETE /api/veiculos/{id}         → remover (204 / 404)
"""

from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from ..dependencies import UsuarioLogadoDep
from ..schemas import (
    EstatisticasResponse,
    VeiculoCreate,
    VeiculoListaResponse,
    VeiculoResponse,
    VeiculoUpdate,
)
from ..services import veiculo_service
from ..services.veiculo_service import VeiculoDuplicadoError

router = APIRouter(prefix="/api/veiculos", tags=["Veículos"])


def _erro_duplicidade(exc: VeiculoDuplicadoError) -> HTTPException:
    """Converte a violação de unicidade no HTTP 409 (Conflict)."""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Já existe um veículo cadastrado com esta {exc.campo}.",
    )


# ---------------------------------------------------------------------------
# REGISTRO
# ---------------------------------------------------------------------------

@router.post("", response_model=VeiculoResponse, status_code=status.HTTP_201_CREATED)
def registrar(payload: VeiculoCreate, _usuario: UsuarioLogadoDep) -> dict:
    """Registra um novo veículo. A validação/normalização ocorre no schema."""
    try:
        return veiculo_service.registrar(payload.model_dump())
    except VeiculoDuplicadoError as exc:
        raise _erro_duplicidade(exc) from exc


# ---------------------------------------------------------------------------
# PESQUISA
# ---------------------------------------------------------------------------

@router.get("", response_model=VeiculoListaResponse)
def pesquisar(
    _usuario: UsuarioLogadoDep,
    placa: str | None = Query(None, description="Placa exata (ABC-1234) ou trecho"),
    chassi: str | None = Query(None, description="Chassi completo (17) ou trecho"),
    marca_modelo: str | None = Query(None, description="Marca, modelo ou ambos"),
    cor: str | None = Query(None, description="Ex.: Prata"),
    proprietario: str | None = Query(None, description="Nome ou parte do nome"),
    cpf_cnpj: str | None = Query(None, description="CPF/CNPJ com ou sem máscara"),
    ano: int | None = Query(None, description="Ano exato"),
    partial_inicio: str | None = Query(None, description="Placa/chassi que COMEÇA com o trecho"),
    partial_meio: str | None = Query(None, description="Placa/chassi que CONTÉM o trecho"),
    partial_fim: str | None = Query(None, description="Placa/chassi que TERMINA com o trecho"),
    partial_campo: Literal["placa", "chassi"] = Query("placa", description="Campo da pesquisa parcial"),
    page: int = Query(1, ge=1, description="Página (começa em 1)"),
    limit: int = Query(20, ge=1, le=200, description="Itens por página"),
) -> dict:
    """Pesquisa veículos combinando os filtros informados."""
    filtros = {
        "placa": placa,
        "chassi": chassi,
        "marca_modelo": marca_modelo,
        "cor": cor,
        "proprietario": proprietario,
        "cpf_cnpj": cpf_cnpj,
        "ano": ano,
        "partial_inicio": partial_inicio,
        "partial_meio": partial_meio,
        "partial_fim": partial_fim,
        "partial_campo": partial_campo,
    }

    total, itens = veiculo_service.buscar(filtros, page=page, limit=limit)
    return {"total": total, "page": page, "limit": limit, "items": itens}


@router.get("/estatisticas", response_model=EstatisticasResponse)
def estatisticas(_usuario: UsuarioLogadoDep) -> dict:
    """Totais gerais da base (apoio ao relatório de desempenho)."""
    return veiculo_service.estatisticas()


# ---------------------------------------------------------------------------
# DETALHE
# ---------------------------------------------------------------------------

@router.get("/{veiculo_id}", response_model=VeiculoResponse)
def detalhar(veiculo_id: int, _usuario: UsuarioLogadoDep) -> dict:
    veiculo = veiculo_service.obter(veiculo_id)
    if veiculo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado.")
    return veiculo


# ---------------------------------------------------------------------------
# ATUALIZAÇÃO
# ---------------------------------------------------------------------------

@router.patch("/{veiculo_id}", response_model=VeiculoResponse)
def atualizar(
    veiculo_id: int,
    payload: VeiculoUpdate,
    _usuario: UsuarioLogadoDep,
) -> dict:
    """Atualiza parcialmente um veículo (apenas campos enviados)."""
    # remove campos None para permitir atualização parcial
    dados = {k: v for k, v in payload.model_dump().items() if v is not None}

    if not dados:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nenhum campo para atualizar.",
        )

    try:
        veiculo = veiculo_service.atualizar(veiculo_id, dados)
    except VeiculoDuplicadoError as exc:
        raise _erro_duplicidade(exc) from exc

    if veiculo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado.")
    return veiculo


# ---------------------------------------------------------------------------
# EXCLUSÃO
# ---------------------------------------------------------------------------

@router.delete("/{veiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover(veiculo_id: int, _usuario: UsuarioLogadoDep) -> None:
    """Remove um veículo."""
    removido = veiculo_service.remover(veiculo_id)
    if not removido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado.")

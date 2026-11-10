"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/schemas.py

SCHEMAS (contratos) de entrada e saída da API, com Pydantic.

A validação/padronização acontece aqui: cada campo passa por um
"field_validator" que usa app/validators.py. Se algo estiver errado, o
FastAPI responde 422 automaticamente — o router nem chega a executar.
"""

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from .validators import (
    normalizar_chassi,
    normalizar_cpf_cnpj,
    normalizar_placa,
    normalizar_renavam,
    texto_obrigatorio,
    validar_ano,
)


# ===========================================================================
# AUTENTICAÇÃO
# ===========================================================================

class LoginRequest(BaseModel):
    """Corpo do POST /api/auth/login (espelha o formulário do front-end)."""

    matricula: str = Field(min_length=1, description="Matrícula ou CPF do servidor")
    senha: str = Field(min_length=1, description="Senha do servidor")


class TokenResponse(BaseModel):
    """Resposta do login: token JWT usado nas chamadas seguintes."""

    access_token: str
    token_type: str = "bearer"
    matricula: str
    nome: str


class UsuarioResponse(BaseModel):
    """Dados do usuário logado (nunca expõe senha)."""

    matricula: str
    nome: str


# ===========================================================================
# VEÍCULOS — ENTRADA
# ===========================================================================

class VeiculoCreate(BaseModel):
    """Corpo do POST /api/veiculos (registro de um novo veículo)."""

    placa: str = Field(description="ABC-1234 ou ABC1D23 (Mercosul)")
    chassi: str = Field(description="17 caracteres alfanuméricos (VIN)")
    renavam: str | None = Field(default=None, description="Opcional, 9 a 11 dígitos")
    marca: str = Field(description="Ex.: Fiat")
    modelo: str = Field(description="Ex.: Uno Mille 1.0")
    cor: str = Field(description="Ex.: Prata")
    ano: int = Field(description="Ano de fabricação/modelo")
    proprietario: str = Field(description="Nome completo ou razão social")
    cpf_cnpj: str = Field(description="CPF ou CNPJ do proprietário")
    observacoes: str | None = Field(default=None, description="Anotações livres")

    # -- normalização/validação de cada campo --------------------------------

    @field_validator("placa", mode="before")
    @classmethod
    def _placa(cls, valor):
        return normalizar_placa(valor)

    @field_validator("chassi", mode="before")
    @classmethod
    def _chassi(cls, valor):
        return normalizar_chassi(valor)

    @field_validator("renavam", mode="before")
    @classmethod
    def _renavam(cls, valor):
        return normalizar_renavam(valor)

    @field_validator("marca", "modelo", "cor", "proprietario", mode="before")
    @classmethod
    def _texto(cls, valor, info: ValidationInfo):
        return texto_obrigatorio(valor, info.field_name)

    @field_validator("ano", mode="before")
    @classmethod
    def _ano(cls, valor):
        return validar_ano(valor)

    @field_validator("cpf_cnpj", mode="before")
    @classmethod
    def _cpf_cnpj(cls, valor):
        return normalizar_cpf_cnpj(valor)

    @field_validator("observacoes", mode="before")
    @classmethod
    def _observacoes(cls, valor):
        if valor is None:
            return None
        limpo = str(valor).strip()
        return limpo[:500] or None


# ===========================================================================
# VEÍCULOS — SAÍDA
# ===========================================================================

class VeiculoResponse(BaseModel):
    """Um veículo como devolvido pela API."""

    id: int
    placa: str
    chassi: str
    renavam: str | None
    marca: str
    modelo: str
    cor: str
    ano: int
    proprietario: str
    cpf_cnpj: str
    observacoes: str | None
    criado_em: str
    atualizado_em: str


class VeiculoListaResponse(BaseModel):
    """Resultado paginado da pesquisa."""

    total: int
    page: int
    limit: int
    items: list[VeiculoResponse]


class EstatisticasResponse(BaseModel):
    """Totais úteis para o relatório de desempenho do projeto."""

    total_veiculos: int
    total_proprietarios: int
    por_cor: dict[str, int]

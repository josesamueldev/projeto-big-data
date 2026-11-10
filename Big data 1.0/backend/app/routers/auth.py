"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/routers/auth.py

Endpoints de AUTENTICAÇÃO:
    POST /api/auth/login  → valida matrícula/senha e devolve o token JWT
    GET  /api/auth/me     → dados do usuário logado
"""

from fastapi import APIRouter, HTTPException, status

from ..dependencies import UsuarioLogadoDep
from ..schemas import LoginRequest, TokenResponse, UsuarioResponse
from ..security import create_access_token
from ..services import usuario_service

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    """Autentica o servidor e devolve o token de acesso."""
    usuario = usuario_service.autenticar(payload.matricula, payload.senha)

    if usuario is None:
        # Mensagem genérica de propósito: não revelamos se a matrícula
        # existe ou se só a senha está errada.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matrícula/CPF ou senha inválidos.",
        )

    return TokenResponse(
        access_token=create_access_token(usuario.matricula),
        matricula=usuario.matricula,
        nome=usuario.nome,
    )


@router.get("/me", response_model=UsuarioResponse)
def me(matricula: UsuarioLogadoDep) -> UsuarioResponse:
    """Devolve os dados do usuário dono do token."""
    usuario = usuario_service.obter_por_matricula(matricula)
    if usuario is None:
        # Usuário foi removido depois que o token foi emitido.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida. Faça login novamente.",
        )
    return UsuarioResponse(matricula=usuario.matricula, nome=usuario.nome)

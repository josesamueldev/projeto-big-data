"""
PROJETO: Sistema de Identificação e Busca de Veículos (Projeto de Big Data)
ARQUIVO: app/dependencies.py

DEPENDENCIAS do FastAPI — blocos reutilizáveis injetados automaticamente
nos endpoints que exigem login.

Como funciona: nos routers, um endpoint recebe `usuario: UsuarioLogadoDep`
e o FastAPI executa `get_usuario_logado()` antes de responder. Se o token
estiver ausente/inválido/expirado, a requisição MORRE ali com 401 — o corpo
do endpoint nem é executado. Isso garante que NENHUM endpoint de dados
acabe exposto sem autenticação.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .security import decode_access_token

# HTTPBearer lê o cabeçalho "Authorization: Bearer <token>" da requisição.
# auto_error=False → devolvemos um 401 com mensagem em português, em vez
# da mensagem genérica (em inglês) do FastAPI.
bearer_scheme = HTTPBearer(auto_error=False)


def get_usuario_logado(
    credencial: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    """Valida o token e devolve a matrícula contida nele (o "sub" do JWT)."""

    if credencial is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação obrigatória: informe o token de acesso.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    matricula = decode_access_token(credencial.credentials)
    if matricula is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada. Faça login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return matricula


# Alias de tipagem que os routers usam nas assinaturas dos endpoints.
UsuarioLogadoDep = Annotated[str, Depends(get_usuario_logado)]

"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/services/usuario_service.py

Regras de negócio de AUTENTICAÇÃO: validar matrícula + senha contra o banco.
Os routers nunca falam com o banco direto — sempre passam por aqui.
"""

from contextlib import closing
from dataclasses import dataclass

from ..database import get_connection
from ..security import verify_password


@dataclass
class UsuarioAutenticado:
    """Dados "seguros" de um usuário autenticado (sem nada de senha)."""

    matricula: str
    nome: str


def autenticar(matricula: str, senha: str) -> UsuarioAutenticado | None:
    """Verifica as credenciais.

    Devolve UsuarioAutenticado quando (matrícula, senha) combinam com um
    registro do banco, ou None em qualquer falha. O None vira 401 no router.
    """
    with closing(get_connection()) as conn:
        linha = conn.execute(
            "SELECT matricula, nome, senha_hash FROM usuario WHERE matricula = ?",
            (matricula.strip(),),
        ).fetchone()

    if linha is None:
        return None
    if not verify_password(senha, linha["senha_hash"]):
        return None

    return UsuarioAutenticado(matricula=linha["matricula"], nome=linha["nome"])


def obter_por_matricula(matricula: str) -> UsuarioAutenticado | None:
    """Busca os dados públicos do usuário (usado no GET /api/auth/me)."""
    with closing(get_connection()) as conn:
        linha = conn.execute(
            "SELECT matricula, nome FROM usuario WHERE matricula = ?",
            (matricula,),
        ).fetchone()

    if linha is None:
        return None
    return UsuarioAutenticado(matricula=linha["matricula"], nome=linha["nome"])

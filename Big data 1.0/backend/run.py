"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: run.py

Atalho para subir o servidor em desenvolvimento:

    py run.py

Equivale a:
    py -m uvicorn app.main:app --reload --port 8000

IMPORTANTE (Windows): com o modo "--reload", o uvicorn cria DOIS processos
(o "reloader" e o "server"). Para parar corretamente, use CTRL+C no terminal
onde ele está rodando. Se você apenas FECHAR a janela do terminal, o processo
filho pode continuar vivo segurando a porta 8000 — e a próxima execução
falha com "[Errno 10048] address already in use".

Por isso, antes de subir, este arquivo confere se a porta está livre e, se
não estiver, explica como resolver em vez de mostrar o erro técnico.
"""

import socket
import sys

import uvicorn

HOST = "127.0.0.1"
PORT = 8000


def porta_ocupada(host: str, porta: int) -> bool:
    """Tenta abrir uma conexão na porta: se alguém responder, ela está em uso."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as conexao:
        conexao.settimeout(0.5)
        return conexao.connect_ex((host, porta)) == 0


def avisar_porta_em_uso(porta: int) -> None:
    print(
        f"\nA porta {porta} já está em uso (provavelmente outra instância da API).\n\n"
        "Como resolver:\n"
        "  1. Se o servidor anterior está aberto em outro terminal, volte nele\n"
        "     e pressione CTRL+C (fechar a janela pode deixar o processo vivo).\n"
        "  2. Para descobrir qual processo está usando a porta:\n"
        f"       netstat -ano | findstr :{porta}\n"
        "     O último número da linha é o PID. Encerre com:\n"
        "       taskkill /PID <numero> /F\n"
        "  3. Depois rode \"py run.py\" de novo.\n"
    )


if __name__ == "__main__":
    if porta_ocupada(HOST, PORT):
        avisar_porta_em_uso(PORT)
        sys.exit(1)

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)

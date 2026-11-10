"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: run.py

Atalho para subir o servidor em desenvolvimento:

    py run.py

Equivale a:
    py -m uvicorn app.main:app --reload --port 8000
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

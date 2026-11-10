"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: scripts/stress_test.py

TESTE DE ESTRESSE — mede o tempo de resposta real da API (HTTP) nos três
cenários críticos do sistema:

    1. Busca EXATA por placa  (usa índice único — deve ser a mais rápida)
    2. Busca por FILTRO       (ex.: cor)
    3. PESQUISA PARCIAL       (início da placa — varredura)

Uso (com o servidor rodando e a massa já gerada):
    py scripts/stress_test.py --n 50

Saída: tabela com média, p50, p95, p99 e máximo por cenário.
"""

import argparse
import random
import statistics
import time

import httpx


def percentil(valores: list[float], p: float) -> float:
    """Percentil simples (interpolação por posição)."""
    ordenados = sorted(valores)
    if not ordenados:
        return 0.0
    posicao = (len(ordenados) - 1) * (p / 100)
    base = int(posicao)
    resto = posicao - base
    if base + 1 < len(ordenados):
        return ordenados[base] + resto * (ordenados[base + 1] - ordenados[base])
    return ordenados[base]


def medir(cliente: httpx.Client, url: str) -> float:
    """Executa uma chamada e devolve o tempo em milissegundos."""
    inicio = time.perf_counter()
    resposta = cliente.get(url)
    duracao_ms = (time.perf_counter() - inicio) * 1000

    if resposta.status_code != 200:
        raise RuntimeError(f"HTTP {resposta.status_code} em {url}: {resposta.text[:200]}")

    return duracao_ms


def relatorio(nome: str, tempos: list[float]) -> None:
    print(
        f"{nome:<28} "
        f"média={statistics.mean(tempos):7.2f}ms  "
        f"p50={percentil(tempos, 50):7.2f}ms  "
        f"p95={percentil(tempos, 95):7.2f}ms  "
        f"p99={percentil(tempos, 99):7.2f}ms  "
        f"max={max(tempos):7.2f}ms"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Teste de estresse da API.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="URL da API")
    parser.add_argument("--n", type=int, default=50, help="Repetições por cenário")
    parser.add_argument("--matricula", default="123456")
    parser.add_argument("--senha", default="123456")
    args = parser.parse_args()

    cliente = httpx.Client(base_url=args.base_url, timeout=30.0)

    # --- Login -------------------------------------------------------------
    login = cliente.post(
        "/api/auth/login",
        json={"matricula": args.matricula, "senha": args.senha},
    )
    if login.status_code != 200:
        raise SystemExit(f"Falha no login: HTTP {login.status_code} — {login.text}")

    token = login.json()["access_token"]
    cliente.headers["Authorization"] = f"Bearer {token}"

    # --- Amostras de placas para a busca exata -----------------------------
    amostra = cliente.get("/api/veiculos", params={"limit": 200})
    amostra.raise_for_status()
    placas = [item["placa"] for item in amostra.json()["items"]]
    if not placas:
        raise SystemExit("Banco vazio: rode antes scripts/gerar_dados.py")

    print(f"\nBase consultada: {args.base_url}")
    total = amostra.json()["total"]
    print(f"Total de veículos: {total:,}   |   Repetições por cenário: {args.n}\n")

    tempos_exata: list[float] = []
    tempos_filtro: list[float] = []
    tempos_parcial: list[float] = []

    for _ in range(args.n):
        placa = random.choice(placas)
        tempos_exata.append(medir(cliente, f"/api/veiculos?placa={placa}"))

        tempos_filtro.append(medir(cliente, "/api/veiculos?cor=Prata&limit=20"))

        prefixo = placa.split("-")[0][:2]
        tempos_parcial.append(
            medir(cliente, f"/api/veiculos?partial_inicio={prefixo}&partial_campo=placa&limit=20")
        )

    relatorio("Busca exata por placa", tempos_exata)
    relatorio("Filtro por cor", tempos_filtro)
    relatorio("Pesquisa parcial (início)", tempos_parcial)
    print()

    cliente.close()


if __name__ == "__main__":
    main()

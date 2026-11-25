"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: scripts/reduzir_dados.py

REDUZ O TAMANHO do banco de demonstração.

Por que isso existe: o gerador de massa (gerar_dados.py) cria ~100 mil
veículos, o que deixa o arquivo com quase 28 MB. Para versionar o projeto
no GitHub é melhor manter o arquivo pequeno: este script apaga parte dos
registros SIMULADOS, preserva os veículos do seed (os 6 primeiros) e roda
VACUUM, que é o passo que realmente devolve o espaço ao disco (só DELETE
não encolhe o arquivo).

Uso (na pasta backend/, com o servidor parado de preferência):
    py scripts/reduzir_dados.py --manter 80000

Opções:
    --manter N   total de veículos que devem sobrar (padrão: 80000)
    --db CAMINHO banco alternativo (padrão: data/app.db)
"""

import argparse
import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_PADRAO = BACKEND_DIR / "data" / "app.db"

# Quantidade de registros do seed que nunca devem ser apagados (ids 1..6).
QTD_SEED = 6


def tamanho_mb(caminho: Path) -> float:
    return caminho.stat().st_size / (1024 * 1024)


def reduzir(db_path: Path, manter: int) -> None:
    if not db_path.exists():
        raise SystemExit(f"Banco não encontrado: {db_path}")

    if manter <= QTD_SEED:
        raise SystemExit(
            f"--manter precisa ser maior que {QTD_SEED} (os veículos do seed)."
        )

    antes = tamanho_mb(db_path)

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA journal_mode = WAL")

        total = conn.execute("SELECT COUNT(*) FROM veiculo").fetchone()[0]
        print(f"Antes: {total:,} veículos, {antes:.2f} MB".replace(",", "."))

        if total <= manter:
            print("Nada a apagar: a base já tem esse tamanho ou menos.")
        else:
            remover = total - manter
            # Apaga registros SIMULADOS aleatórios; os ids 1..6 (seed) ficam.
            conn.execute(
                "DELETE FROM veiculo WHERE id IN ("
                "  SELECT id FROM veiculo WHERE id > ? "
                "  ORDER BY RANDOM() LIMIT ?"
                ")",
                (QTD_SEED, remover),
            )
            conn.commit()

            restantes = conn.execute("SELECT COUNT(*) FROM veiculo").fetchone()[0]
            print(f"Apagados: {remover:,} registros simulados".replace(",", "."))
            print(f"Restaram: {restantes:,} veículos".replace(",", "."))

        # VACUUM reescreve o arquivo sem páginas vazias: é o que reduz o
        # tamanho em disco. Precisa rodar fora de transação (autocommit).
        print("Compactando o arquivo (VACUUM)...")
        conn.execute("VACUUM")
    finally:
        conn.close()

    depois = tamanho_mb(db_path)
    print(f"Depois: {depois:.2f} MB")

    for sufixo in ("-wal", "-shm"):
        auxiliar = Path(str(db_path) + sufixo)
        if auxiliar.exists():
            print(f"Atenção: existe o arquivo auxiliar {auxiliar.name} "
                  "(feche o servidor para que ele seja incorporado).")


def main() -> None:
    parser = argparse.ArgumentParser(description="Reduz o banco de demonstração.")
    parser.add_argument(
        "--manter", type=int, default=80000,
        help="total de veículos a manter (padrão: 80000)",
    )
    parser.add_argument(
        "--db", type=Path, default=DB_PADRAO,
        help="caminho do banco (padrão: data/app.db)",
    )
    args = parser.parse_args()
    reduzir(args.db, args.manter)


if __name__ == "__main__":
    main()

"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: scripts/gerar_dados.py

GERADOR DE MASSA SIMULADA — atende à Fase 4 do documento
("testes de estresse com os dados simulados").

Gera placas/chassis válidos, proprietários e CPFs com dígitos verificadores
corretos, e insere em lote (rápido) no mesmo banco que a API usa.

Uso (na pasta backend/):
    py scripts/gerar_dados.py --qtd 100000

Opções:
    --qtd N    quantidade a gerar (padrão 100000)
    --db CAMINHO
               banco alternativo (padrão: data/app.db)
"""

import argparse
import os
import random
import string
import sys
import time
from pathlib import Path

# Garante que "import app..." funcione mesmo rodando de dentro de scripts/.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Alfabetos
LETRAS_PLACA = string.ascii_uppercase
ALNUM_CHASSI = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"  # VIN: sem I, O, Q
MARCAS_MODELOS = [
    ("Fiat", "Uno Mille 1.0"), ("Fiat", "Palio ELX 1.4"), ("Fiat", "Toro Freedom"),
    ("Volkswagen", "Gol 1.6"), ("Volkswagen", "Polo Highline"), ("Volkswagen", "Saveiro Cross"),
    ("Chevrolet", "Onix LT"), ("Chevrolet", "Tracker Premier"), ("Chevrolet", "S10 LTZ"),
    ("Honda", "Civic EXL"), ("Honda", "HR-V EX"), ("Honda", "City Touring"),
    ("Toyota", "Corolla XEi"), ("Toyota", "Yaris XL"), ("Toyota", "Hilux SRX"),
    ("Hyundai", "HB20 Comfort"), ("Hyundai", "Creta Action"), ("Renault", "Kwid Zen"),
    ("Nissan", "Versa SV"), ("Jeep", "Renegade Longitude"),
]
CORES = ["Prata", "Branco", "Preto", "Cinza", "Vermelho", "Azul", "Verde", "Amarelo"]
NOMES = ["Carlos", "Maria", "João", "Ana", "Pedro", "Lucia", "Rafael", "Fernanda",
         "Bruno", "Camila", "Diego", "Patrícia", "Eduardo", "Juliana", "Marcos"]
SOBRENOMES = ["Souza", "Lima", "Ferreira", "Rodrigues", "Alves", "Dias", "Costa",
              "Pereira", "Oliveira", "Santos", "Ribeiro", "Nascimento", "Menezes"]


def gerar_placa() -> str:
    """Placa no padrão antigo (ABC-1234), que é o formato usado no front."""
    letras = "".join(random.choices(LETRAS_PLACA, k=3))
    numeros = "".join(random.choices(string.digits, k=4))
    return f"{letras}-{numeros}"


def gerar_chassi() -> str:
    return "".join(random.choices(ALNUM_CHASSI, k=17))


def gerar_cpf_formatado() -> str:
    """Gera um CPF aleatório com dígitos verificadores VÁLIDOS."""
    base = [random.randint(0, 9) for _ in range(9)]

    soma1 = sum(d * p for d, p in zip(base, range(10, 1, -1)))
    resto1 = (soma1 * 10) % 11
    d1 = 0 if resto1 == 10 else resto1

    base10 = base + [d1]
    soma2 = sum(d * p for d, p in zip(base10, range(11, 1, -1)))
    resto2 = (soma2 * 10) % 11
    d2 = 0 if resto2 == 10 else resto2

    digitos = "".join(map(str, base + [d1, d2]))
    return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"


def gerar_registro() -> tuple:
    """Monta uma linha compatível com as colunas da tabela veiculo."""
    marca, modelo = random.choice(MARCAS_MODELOS)
    return (
        gerar_placa(),
        gerar_chassi(),
        str(random.randint(10_000_000_000, 99_999_999_999)),
        marca,
        modelo,
        random.choice(CORES),
        random.randint(1990, 2026),
        f"{random.choice(NOMES)} {random.choice(SOBRENOMES)}",
        gerar_cpf_formatado(),
        None,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera veículos simulados no banco.")
    parser.add_argument("--qtd", type=int, default=100_000, help="Quantidade a gerar")
    parser.add_argument("--db", type=str, default=None, help="Caminho alternativo do banco")
    args = parser.parse_args()

    # Precisa ser definido ANTES de importar app.config (que lê a variável).
    if args.db:
        os.environ["APP_DB_PATH"] = args.db

    from app.database import get_connection, init_db  # noqa: E402
    from app.seed import dados_iniciais  # noqa: E402

    init_db(dados_iniciais())  # garante schema/índices/seed

    inicio = time.perf_counter()
    gerados = 0

    conn = get_connection()
    try:
        # Inserção em lotes dentro de uma única transação: muito mais rápido
        # do que um commit por linha. "OR IGNORE" descarta colisões raras
        # de placa/chassi (que já são UNIQUE no banco).
        lote: list[tuple] = []
        for _ in range(args.qtd):
            lote.append(gerar_registro())
            if len(lote) >= 5000:
                conn.executemany(
                    "INSERT OR IGNORE INTO veiculo (placa, chassi, renavam, marca, "
                    "modelo, cor, ano, proprietario, cpf_cnpj, observacoes) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    lote,
                )
                gerados += len(lote)
                lote.clear()
                print(f"  ... {gerados:,} registros processados", flush=True)

        if lote:
            conn.executemany(
                "INSERT OR IGNORE INTO veiculo (placa, chassi, renavam, marca, "
                "modelo, cor, ano, proprietario, cpf_cnpj, observacoes) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                lote,
            )
            gerados += len(lote)

        conn.commit()
        total = conn.execute("SELECT COUNT(*) FROM veiculo").fetchone()[0]
    finally:
        conn.close()

    duracao = time.perf_counter() - inicio
    print(f"\nGerados (tentados): {args.qtd:,}")
    print(f"Total de veículos no banco: {total:,}")
    print(f"Tempo de inserção: {duracao:.2f}s")


if __name__ == "__main__":
    main()

"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/database.py

Camada de ACESSO A DADOS (SQLite).

- Um único arquivo SQLite ("data/app.db"), 100% offline.
- Todo o SQL do sistema vive aqui / nos services (consulta), nunca espalhado
  pelos routers. Quando migrarmos para PostgreSQL (futuro "CRM de veículos"),
  só esta camada muda.
- O startup da aplicação cria tabelas, índices e carga inicial (init_db).
"""

import sqlite3
from contextlib import closing

from .config import DB_PATH

# ---------------------------------------------------------------------------
# ESQUEMA
# ---------------------------------------------------------------------------
# UNIQUE em placa e chassi é o que BLOQUEIA cadastros duplicados no banco
# (requisito 2.4 da documentação) — mesmo com acessos simultâneos.
# Os índices extras aceleram buscas por proprietário, marca, cor e ano.

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS usuario (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula  TEXT NOT NULL UNIQUE,
    nome       TEXT NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS veiculo (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    placa        TEXT NOT NULL UNIQUE,
    chassi       TEXT NOT NULL UNIQUE,
    renavam      TEXT,
    marca        TEXT NOT NULL,
    modelo       TEXT NOT NULL,
    cor          TEXT NOT NULL,
    ano          INTEGER NOT NULL,
    proprietario TEXT NOT NULL,
    cpf_cnpj     TEXT NOT NULL,
    observacoes  TEXT,
    criado_em    TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_veiculo_proprietario ON veiculo (proprietario);
CREATE INDEX IF NOT EXISTS idx_veiculo_marca        ON veiculo (marca);
CREATE INDEX IF NOT EXISTS idx_veiculo_modelo       ON veiculo (modelo);
CREATE INDEX IF NOT EXISTS idx_veiculo_cor          ON veiculo (cor);
CREATE INDEX IF NOT EXISTS idx_veiculo_ano          ON veiculo (ano);
"""


def get_connection() -> sqlite3.Connection:
    """Abre uma conexão com o banco.

    row_factory = sqlite3.Row permite ler colunas por nome (linha["placa"]),
    bem mais legível do que índices numéricos. dict(linha) vira um dicionário
    pronto para virar JSON na resposta da API.

    journal_mode = WAL melhora a concorrência (leituras não bloqueiam escritas),
    importante no teste de estresse com o servidor no ar.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db(seeded_data: dict) -> None:
    """Cria o esquema e carrega os dados iniciais (apenas se o banco estiver vazio).

    Recebe os dados de app/seed.py. Roda no startup da API e também nos testes.
    Só semeia tabelas vazias — assim dados cadastrados sobrevivem a reinícios.
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with closing(get_connection()) as conn:
        conn.executescript(SCHEMA_SQL)

        qtd_usuarios = conn.execute("SELECT COUNT(*) FROM usuario").fetchone()[0]
        if qtd_usuarios == 0:
            conn.executemany(
                "INSERT INTO usuario (matricula, nome, senha_hash) VALUES (?, ?, ?)",
                seeded_data["usuarios"],
            )

        qtd_veiculos = conn.execute("SELECT COUNT(*) FROM veiculo").fetchone()[0]
        if qtd_veiculos == 0:
            conn.executemany(
                "INSERT INTO veiculo (placa, chassi, renavam, marca, modelo, cor, "
                "ano, proprietario, cpf_cnpj, observacoes) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                seeded_data["veiculos"],
            )

        conn.commit()

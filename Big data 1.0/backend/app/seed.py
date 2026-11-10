"""
PROJETO: Sistema de Registro e Consulta de Veículos (Projeto de Big Data)
ARQUIVO: app/seed.py

Dados iniciais de DEMONSTRAÇÃO, carregados na primeira execução do sistema.

Os 4 primeiros veículos batem com o exemplo que o front-end exibia antes da
integração (quando a pesquisa usava um array fixo no script.js), e ajudam a
demonstrar a busca. Os 2 últimos enriquecem as consultas de demonstração.

SENHAS: nunca ficam em texto puro — passam por hash_password() antes de ir
para o banco. Usuários de demonstração:
    123456 / 123456
    789012 / senha789
"""

from .security import hash_password

USUARIOS = [
    # (matricula, nome, senha)
    ("123456", "Servidor Demonstração", "123456"),
    ("789012", "Maria C. Andrade", "senha789"),
]

VEICULOS = [
    # (placa, chassi, renavam, marca, modelo, cor, ano, proprietario, cpf_cnpj, observacoes)
    ("ABC-1234", "9BWZZZ377VT004251", "00123456789", "Fiat", "Uno Mille 1.0",
     "Prata", 2015, "Carlos A. Souza", "111.444.777-35", None),
    ("DEF-5678", "9BWZZZ377VT004252", "00234567890", "Volkswagen", "Gol 1.6",
     "Branco", 2019, "Maria F. Lima", "123.456.789-09", None),
    ("GHI-9012", "9BGRE1760WC001521", "00345678901", "Chevrolet", "Onix LT",
     "Preto", 2021, "João P. Ferreira", "390.533.447-05", None),
    ("JKL-3456", "19XFC2F59CE000123", "00456789012", "Honda", "Civic EXL",
     "Cinza", 2020, "Ana C. Rodrigues", "529.982.247-25", None),
    ("MNO-7890", "9BWZZZ377VT004258", "00567890123", "Fiat", "Palio ELX 1.4",
     "Vermelho", 2012, "Pedro H. Alves", "111.444.777-35", "Veículo com alerta de revisão"),
    ("QNF-1537", "93HCK20100N700456", "00678901234", "Honda", "Civic Turbo Touring",
     "Branco", 2024, "Comercial Dias Ltda", "11.222.333/0001-81", None),
]


def dados_iniciais() -> dict:
    """Monta o dicionário que database.init_db espera, com as senhas já em hash."""
    usuarios_com_hash = [
        (matricula, nome, hash_password(senha))
        for matricula, nome, senha in USUARIOS
    ]
    return {"usuarios": usuarios_com_hash, "veiculos": list(VEICULOS)}

/* ============================================================================
   PROJETO: Sistema de Identificação e Busca de Veículos (Projeto de Big Data)
   ARQUIVO: api.js
   ============================================================================
   CAMADA DE COMUNICAÇÃO (front-end  ->  back-end).

   Este é o ÚNICO arquivo do front-end que conhece:
     - o endereço da API (http://127.0.0.1:8000)
     - o formato das requisições (JSON, cabeçalho Authorization)
     - o formato das respostas e dos erros (HTTP 401, 409, 422...)

   O script.js só chama funções com nomes de negócio:
     login(), pesquisar(), criarVeiculo()

   Assim, se a API mudar de endereço ou de formato, alteramos SÓ este
   arquivo — as telas continuam funcionando.

   COMO O NAVEGADOR FALA COM A API: usamos a função nativa fetch(), que faz
   requisições HTTP sem recarregar a página (é o "A" de AJAX). O backend
   libera CORS no protótipo (veja app/main.py), por isso funciona tanto
   abrindo o index.html direto quanto por um servidor local.
   ========================================================================= */

// Endereço onde o backend (py run.py) está rodando.
const API_BASE_URL = 'http://127.0.0.1:8000';

// Chaves usadas para guardar a sessão no navegador. Usamos sessionStorage
// (e não localStorage) porque ele é apagado quando a aba é fechada — mais
// seguro para um computador compartilhado no balcão do CIOp.
const CHAVE_TOKEN = 'veiculos.token';
const CHAVE_USUARIO = 'veiculos.usuario';


/* ----------------------------------------------------------------------
   ERRO PADRONIZADO DA API
   ------------------------------------------------------------------------
   Toda falha (rede, 401, 409, 422...) chega ao script.js como um objeto
   ErroApi, sempre com:
     - message        -> texto pronto para mostrar ao usuário
     - status         -> código HTTP (0 = falha de conexão)
     - errosPorCampo  -> { placa: "Placa inválida...", ... } quando a
                         validação do backend aponta campos específicos
---------------------------------------------------------------------- */
class ErroApi extends Error {
    constructor(mensagem, status = 0, errosPorCampo = {}) {
        super(mensagem);
        this.name = 'ErroApi';
        this.status = status;
        this.errosPorCampo = errosPorCampo;
    }
}


/* ----------------------------------------------------------------------
   ARMAZENAMENTO DA SESSÃO
   ------------------------------------------------------------------------
   sessionStorage pode estar bloqueado em alguns navegadores/abas anônimas.
   Por isso todo acesso vai dentro de try/catch: se falhar, o sistema
   continua funcionando, apenas sem "lembrar" o login ao recarregar.
---------------------------------------------------------------------- */
function guardarSessao(token, usuario) {
    try {
        sessionStorage.setItem(CHAVE_TOKEN, token);
        sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    } catch (erro) {
        // sem armazenamento disponível: segue só em memória
    }
}

function obterToken() {
    try {
        return sessionStorage.getItem(CHAVE_TOKEN) || '';
    } catch (erro) {
        return '';
    }
}

function obterUsuarioSalvo() {
    try {
        const texto = sessionStorage.getItem(CHAVE_USUARIO);
        return texto ? JSON.parse(texto) : null;
    } catch (erro) {
        return null;
    }
}

function limparSessao() {
    try {
        sessionStorage.removeItem(CHAVE_TOKEN);
        sessionStorage.removeItem(CHAVE_USUARIO);
    } catch (erro) {
        // nada a fazer
    }
}

function temSessao() {
    return obterToken() !== '';
}


/* ----------------------------------------------------------------------
   CALLBACK DE SESSÃO EXPIRADA
   ------------------------------------------------------------------------
   Quando o token vence (ou é inválido), o backend responde 401. Em vez de
   cada tela tratar isso, a camada avisa o script.js por este callback, e
   ele volta para a tela de login.
---------------------------------------------------------------------- */
let aoPerderSessao = null;

function definirPerdaDeSessao(callback) {
    aoPerderSessao = callback;
}


/* ----------------------------------------------------------------------
   TRADUÇÃO DE ERROS DO BACKEND
---------------------------------------------------------------------- */

// O Pydantic (validação do FastAPI) devolve mensagens no formato
// "Value error, Placa inválida...". Removemos esse prefixo técnico.
function limparMensagemValidacao(mensagem) {
    if (typeof mensagem !== 'string') return 'Valor inválido.';
    return mensagem.replace(/^Value error,\s*/i, '');
}

// Transforma a lista de erros do HTTP 422 em um mapa por campo:
//   [{loc: ["body","placa"], msg: "..."}] -> { placa: "..." }
function extrairErrosPorCampo(detalhe) {
    const mapa = {};
    if (!Array.isArray(detalhe)) return mapa;

    detalhe.forEach(function (item) {
        const local = Array.isArray(item.loc) ? item.loc : [];
        const campo = local.length ? String(local[local.length - 1]) : '';
        const mensagem = limparMensagemValidacao(item.msg);
        if (!campo) return;
        mapa[campo] = mapa[campo] ? mapa[campo] + ' ' + mensagem : mensagem;
    });

    return mapa;
}

// Mensagem amigável a partir do "detail" devolvido pelo FastAPI.
function mensagemDoDetalhe(detalhe) {
    if (!detalhe) return '';
    if (typeof detalhe === 'string') return detalhe;

    if (Array.isArray(detalhe)) {
        const partes = detalhe.map(function (item) {
            const local = Array.isArray(item.loc) ? item.loc : [];
            const campo = local.length ? String(local[local.length - 1]) : '';
            const texto = limparMensagemValidacao(item.msg);
            return { campo: campo, texto: texto };
        });

        // Com um único erro, o campo já fica destacado na tela: mostramos
        // só a mensagem ("CPF/CNPJ inválido...") em vez de "cpf_cnpj: ...".
        if (partes.length === 1) {
            return partes[0].texto;
        }

        // Com vários erros, identificamos cada campo para o usuário saber
        // onde olhar. Set remove repetições.
        const textos = partes.map(function (parte) {
            return parte.campo ? parte.campo + ': ' + parte.texto : parte.texto;
        });
        return Array.from(new Set(textos)).join(' ');
    }

    return '';
}

// Mensagem padrão quando o backend não manda um texto próprio.
function mensagemPadrao(status) {
    switch (status) {
        case 0:
            return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando (py run.py).';
        case 400:
            return 'Requisição inválida.';
        case 401:
            return 'Sessão expirada. Faça login novamente.';
        case 403:
            return 'Você não tem permissão para esta ação.';
        case 404:
            return 'Registro não encontrado.';
        case 409:
            return 'Já existe um veículo cadastrado com estes dados.';
        case 422:
            return 'Dados inválidos. Confira os campos destacados.';
        case 500:
            return 'Erro interno no servidor. Tente novamente.';
        default:
            return 'Falha na comunicação com o servidor (HTTP ' + status + ').';
    }
}


/* ----------------------------------------------------------------------
   FUNÇÃO CENTRAL: requisitar()
   ------------------------------------------------------------------------
   Todas as chamadas passam por aqui. Responsabilidades:
     1. Montar a URL completa e o cabeçalho Authorization.
     2. Converter o corpo JavaScript em JSON.
     3. Tratar falha de rede (servidor desligado).
     4. Converter respostas de erro em ErroApi.
     5. Avisar a tela quando o token expirar (401).
---------------------------------------------------------------------- */
async function requisitar(caminho, opcoes) {
    const config = opcoes || {};
    const metodo = config.metodo || 'GET';
    const corpo = config.corpo === undefined ? null : config.corpo;
    const semToken = config.semToken === true;

    const cabecalhos = {};

    // Só envia Content-Type quando há corpo: evita "preflight" desnecessário.
    if (corpo !== null) {
        cabecalhos['Content-Type'] = 'application/json';
    }

    const token = obterToken();
    if (token && !semToken) {
        cabecalhos.Authorization = 'Bearer ' + token;
    }

    let resposta;
    try {
        resposta = await fetch(API_BASE_URL + caminho, {
            method: metodo,
            headers: cabecalhos,
            body: corpo === null ? undefined : JSON.stringify(corpo),
        });
    } catch (falhaDeRede) {
        // fetch só rejeita quando o servidor está inacessível/sem rede.
        throw new ErroApi(mensagemPadrao(0), 0, {});
    }

    // Hoje a API só responde GET/POST com corpo JSON. Se algum dia voltar a
    // existir exclusão (204 No Content), o bloco abaixo evita erro de leitura.
    if (resposta.status === 204) {
        return null;
    }

    let dados = null;
    try {
        dados = await resposta.json();
    } catch (erroDeLeitura) {
        dados = null;
    }

    if (!resposta.ok) {
        // Token vencido/inválido: encerra a sessão e avisa a tela.
        if (resposta.status === 401 && !semToken) {
            limparSessao();
            if (typeof aoPerderSessao === 'function') {
                aoPerderSessao();
            }
        }

        const detalhe = dados ? dados.detail : null;
        const mensagem = mensagemDoDetalhe(detalhe) || mensagemPadrao(resposta.status);

        throw new ErroApi(
            mensagem,
            resposta.status,
            extrairErrosPorCampo(detalhe)
        );
    }

    return dados;
}


/* ===========================================================================
   FUNÇÕES DE NEGÓCIO (o que as telas realmente usam)
   =========================================================================== */

/*
   LOGIN
   POST /api/auth/login  { matricula, senha }
   -> { access_token, token_type, matricula, nome }

   Guardamos o token e o usuário na sessão do navegador e devolvemos os
   dados do usuário para a tela preencher o cabeçalho.
*/
async function login(matricula, senha) {
    const dados = await requisitar('/api/auth/login', {
        metodo: 'POST',
        corpo: { matricula: matricula, senha: senha },
        semToken: true, // o login ainda não tem token
    });

    const usuario = { matricula: dados.matricula, nome: dados.nome };
    guardarSessao(dados.access_token, usuario);
    return usuario;
}

/*
   USUÁRIO LOGADO
   GET /api/auth/me
   Usado ao recarregar a página para saber se o token salvo ainda vale.
*/
async function obterUsuarioAtual() {
    return requisitar('/api/auth/me');
}

/*
   PESQUISA DE VEÍCULOS
   GET /api/veiculos?placa=...&cor=...&page=1&limit=20
   -> { total, page, limit, items: [...] }

   "filtros" é um objeto simples; campos vazios são omitidos da URL para
   não mandar "?cor=" (o que filtraria por string vazia no backend).
*/
async function pesquisar(filtros, pagina, limite) {
    const params = new URLSearchParams();

    Object.keys(filtros || {}).forEach(function (chave) {
        const valor = filtros[chave];
        if (valor === null || valor === undefined) return;
        const texto = String(valor).trim();
        if (texto === '') return;
        params.set(chave, texto);
    });

    params.set('page', String(pagina || 1));
    params.set('limit', String(limite || 20));

    return requisitar('/api/veiculos?' + params.toString());
}

/*
   REGISTRO DE VEÍCULO
   POST /api/veiculos
   -> 201 com o veículo criado
   -> 409 se placa/chassi já existir
   -> 422 se algum campo for inválido (errosPorCampo preenchido)
*/
async function criarVeiculo(dados) {
    return requisitar('/api/veiculos', { metodo: 'POST', corpo: dados });
}

/*
   ESTATÍSTICAS (opcional — usada como atalho de diagnóstico)
   GET /api/veiculos/estatisticas
*/
async function estatisticas() {
    return requisitar('/api/veiculos/estatisticas');
}


/* ----------------------------------------------------------------------
   EXPORTAÇÃO
   ------------------------------------------------------------------------
   Como o projeto não usa módulos ES (import/export), deixamos as funções
   num único objeto global "ApiVeiculos". O script.js acessa
   window.ApiVeiculos.login(...), etc.
---------------------------------------------------------------------- */
window.ApiVeiculos = {
    URL_BASE: API_BASE_URL,
    login: login,
    obterUsuarioAtual: obterUsuarioAtual,
    pesquisar: pesquisar,
    criarVeiculo: criarVeiculo,
    estatisticas: estatisticas,
    obterUsuarioSalvo: obterUsuarioSalvo,
    temSessao: temSessao,
    limparSessao: limparSessao,
    definirPerdaDeSessao: definirPerdaDeSessao,
};

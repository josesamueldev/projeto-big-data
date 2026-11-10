/* ============================================================================
   PROJETO: Sistema de Identificação e Busca de Veículos (Projeto de Big Data)
   ARQUIVO: script.js
   ============================================================================
   Este arquivo contém toda a INTERATIVIDADE do site, agora INTEGRADA ao
   back-end (API FastAPI). Antes o login era uma senha fixa e a pesquisa
   usava um array de exemplo; agora os dados vêm do banco de verdade.

   Organização do arquivo:
     1. Captura de elementos do DOM e estado da tela
     2. Sessão: login, restauração ao recarregar e logout
     3. Mostrar/ocultar a senha digitada
     4. Switch "PESQUISA PARCIAL"
     5. Pesquisa de veículos + paginação
     6. Registro de veículo (janela modal)
     7. Botão "Limpar"
     8. Botão flutuante de ajuda

   Toda a comunicação HTTP fica no api.js. Aqui só cuidamos da TELA.

   IMPORTANTE: como a tag <script> está no final do <body> (veja o
   index.html), todo o HTML já foi carregado quando este código roda.
   ========================================================================= */


/* ----------------------------------------------------------------------
   1. CAPTURA DE ELEMENTOS DO DOM E ESTADO DA TELA
---------------------------------------------------------------------- */

// A camada de comunicação criada em api.js.
const API = window.ApiVeiculos;

// --- Telas principais ---
const loginScreen = document.getElementById('loginScreen');
const panelScreen = document.getElementById('panelScreen');
const headerRight = document.getElementById('headerRight'); // badge + botão "Sair"

// --- Formulário e campos de LOGIN ---
const loginForm = document.getElementById('loginForm');
const matriculaInput = document.getElementById('matricula');
const senhaInput = document.getElementById('senha');
const loginError = document.getElementById('loginError');
const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');

// --- Botão de mostrar/ocultar senha ---
const togglePasswordBtn = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');

// --- Formulário e campos de PESQUISA (painel) ---
const searchForm = document.getElementById('searchForm');
const searchButton = document.querySelector('.btn-search');
const clearBtn = document.getElementById('clearBtn');

const campoPlaca = document.getElementById('placa');
const campoChassi = document.getElementById('chassi');
const campoMarcaModelo = document.getElementById('marcaModelo');
const campoCor = document.getElementById('cor');
const campoProprietario = document.getElementById('proprietario');
const campoCpfCnpj = document.getElementById('cpfCnpj');

// --- Switch e campos de "pesquisa parcial" ---
const partialSwitch = document.getElementById('partialSwitch');
const partialExtra = document.getElementById('partialExtra');
const partialCampo = document.getElementById('partialCampo');
const campoPartialInicio = document.getElementById('partialInicio');
const campoPartialMeio = document.getElementById('partialMeio');
const campoPartialFim = document.getElementById('partialFim');

// --- Área de resultados ---
const emptyState = document.getElementById('emptyState');
const resultsWrapper = document.getElementById('resultsWrapper');
const resultsTableBody = document.getElementById('resultsTableBody');
const resultsSummary = document.getElementById('resultsSummary');
const resultsFeedback = document.getElementById('resultsFeedback');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// --- Janela modal de registro de veículo ---
const newVehicleBtn = document.getElementById('newVehicleBtn');
const vehicleModal = document.getElementById('vehicleModal');
const vehicleForm = document.getElementById('vehicleForm');
const vehicleError = document.getElementById('vehicleError');
const saveVehicleBtn = document.getElementById('saveVehicleBtn');
const closeVehicleModalBtn = document.getElementById('closeVehicleModal');
const cancelVehicleBtn = document.getElementById('cancelVehicleBtn');

const veiPlaca = document.getElementById('veiPlaca');
const veiChassi = document.getElementById('veiChassi');
const veiRenavam = document.getElementById('veiRenavam');
const veiMarca = document.getElementById('veiMarca');
const veiModelo = document.getElementById('veiModelo');
const veiCor = document.getElementById('veiCor');
const veiAno = document.getElementById('veiAno');
const veiProprietario = document.getElementById('veiProprietario');
const veiCpfCnpj = document.getElementById('veiCpfCnpj');
const veiObservacoes = document.getElementById('veiObservacoes');

// --- Botão flutuante de ajuda ---
const helpBtn = document.getElementById('helpBtn');

// Quantidade de registros por página (a API aceita de 1 a 200).
const LIMITE_POR_PAGINA = 20;

// Estado da pesquisa (o que está na tela agora).
let paginaAtual = 1;
let totalRegistros = 0;
let totalPaginas = 1;
let filtrosAtuais = {};

// "Trava" para não disparar duas pesquisas/dois cadastros ao mesmo tempo.
let pesquisaEmAndamento = false;
let loginEmAndamento = false;
let salvandoVeiculo = false;

// Durante a restauração automática da sessão (ao recarregar a página) não
// vale a pena avisar "sessão expirada" — o usuário nem chegou a entrar.
let restaurandoSessao = false;

// Mapa campo-da-api -> input do formulário de registro. Usado para
// destacar em vermelho exatamente o campo que o backend recusou.
const CAMPOS_DO_VEICULO = {
    placa: veiPlaca,
    chassi: veiChassi,
    renavam: veiRenavam,
    marca: veiMarca,
    modelo: veiModelo,
    cor: veiCor,
    ano: veiAno,
    proprietario: veiProprietario,
    cpf_cnpj: veiCpfCnpj,
    observacoes: veiObservacoes,
};


/* ----------------------------------------------------------------------
   2. SESSÃO: LOGIN, RESTAURAÇÃO E LOGOUT
---------------------------------------------------------------------- */

// Se a API detectar token vencido/inválido (HTTP 401), voltamos ao login.
API.definirPerdaDeSessao(function () {
    sairDoPainel(restaurandoSessao ? '' : 'Sua sessão expirou. Faça login novamente.');
});


/* Mostra a tela de login e limpa tudo que é do usuário anterior. */
function sairDoPainel(mensagem) {
    API.limparSessao();

    panelScreen.classList.add('hidden');
    headerRight.classList.add('hidden');
    loginScreen.classList.remove('hidden');

    userBadge.textContent = '';
    userBadge.removeAttribute('title');

    searchForm.reset();
    partialExtra.classList.add('hidden');
    limparResultados();

    if (mensagem) {
        mostrarErroLogin(mensagem);
    } else {
        esconderErroLogin();
    }
}


/* Mostra o painel de pesquisa para o usuário autenticado. */
function entrarNoPainel(usuario) {
    loginScreen.classList.add('hidden');
    panelScreen.classList.remove('hidden');
    headerRight.classList.remove('hidden');

    // O badge do cabeçalho passa a mostrar o nome de quem entrou.
    userBadge.textContent = usuario.nome || usuario.matricula;
    userBadge.title = 'Matrícula: ' + usuario.matricula;

    esconderErroLogin();
}


/* Mensagens de erro da tela de login. */
function mostrarErroLogin(mensagem) {
    loginError.textContent = mensagem;
    loginError.classList.remove('hidden');
}

function esconderErroLogin() {
    loginError.classList.add('hidden');
}


/* Botão ENTRAR: valida os campos e autentica na API. */
loginForm.addEventListener('submit', async function (event) {
    // Impede o recarregamento padrão da página ao enviar o formulário.
    event.preventDefault();

    if (loginEmAndamento) return;

    const matricula = matriculaInput.value.trim();
    const senha = senhaInput.value;

    if (!matricula || !senha) {
        mostrarErroLogin('Informe a matrícula/CPF e a senha.');
        return;
    }

    loginEmAndamento = true;
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'ENTRANDO...';
    esconderErroLogin();

    try {
        const usuario = await API.login(matricula, senha);

        loginForm.reset();
        entrarNoPainel(usuario);

        // Já carrega a primeira página, para o painel não abrir vazio.
        await pesquisarVeiculos(1);
    } catch (erro) {
        mostrarErroLogin(erro.message);
    } finally {
        loginEmAndamento = false;
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'ENTRAR';
    }
});


/* Botão SAIR: encerra a sessão local e volta ao login. */
logoutBtn.addEventListener('click', function () {
    sairDoPainel('');
    matriculaInput.focus();
});


/*
   Ao carregar/recarregar a página: se existe um token salvo, conferimos
   com a API se ele ainda vale (GET /api/auth/me). Se valer, o usuário
   volta direto ao painel; se não, permanece no login.
*/
async function restaurarSessao() {
    if (!API.temSessao()) return;

    restaurandoSessao = true;
    try {
        const usuario = await API.obterUsuarioAtual();
        entrarNoPainel(usuario);
        await pesquisarVeiculos(1);
    } catch (erro) {
        // Token antigo/inválido: segue no login, sem mensagem de erro.
        API.limparSessao();
    } finally {
        restaurandoSessao = false;
    }
}

restaurarSessao();


/* ----------------------------------------------------------------------
   3. MOSTRAR / OCULTAR SENHA
   ------------------------------------------------------------------------
   O botão do olho troca o atributo type do input entre "password"
   (bolinhas) e "text" (texto normal), e troca o desenho do ícone.
---------------------------------------------------------------------- */
togglePasswordBtn.addEventListener('click', function () {
    const senhaEstaVisivel = senhaInput.getAttribute('type') === 'text';

    senhaInput.setAttribute('type', senhaEstaVisivel ? 'password' : 'text');

    if (senhaEstaVisivel) {
        // Voltando para "oculto": desenha o olho aberto normal.
        eyeIcon.innerHTML = `
            <path d="M1 12 C4 6 8.5 3 12 3 C15.5 3 20 6 23 12 C20 18 15.5 21 12 21 C8.5 21 4 18 1 12 Z"
                  fill="none" stroke="#5b7290" stroke-width="1.7"/>
            <circle cx="12" cy="12" r="3.2" fill="none" stroke="#5b7290" stroke-width="1.7"/>
        `;
    } else {
        // Ficando "visível": desenha o olho riscado, em azul.
        eyeIcon.innerHTML = `
            <path d="M1 12 C4 6 8.5 3 12 3 C15.5 3 20 6 23 12 C20 18 15.5 21 12 21 C8.5 21 4 18 1 12 Z"
                  fill="none" stroke="#1565c0" stroke-width="1.7"/>
            <circle cx="12" cy="12" r="3.2" fill="none" stroke="#1565c0" stroke-width="1.7"/>
            <line x1="2" y1="22" x2="22" y2="2" stroke="#1565c0" stroke-width="1.7" stroke-linecap="round"/>
        `;
    }
});


/* ----------------------------------------------------------------------
   4. SWITCH "PESQUISA PARCIAL"
   ------------------------------------------------------------------------
   O evento "change" dispara quando o checkbox muda de estado. Ligado,
   mostramos o bloco com Início/Meio/Fim + o campo onde buscar o trecho.
---------------------------------------------------------------------- */
partialSwitch.addEventListener('change', function () {
    partialExtra.classList.toggle('hidden', !partialSwitch.checked);
});


/* ----------------------------------------------------------------------
   5. PESQUISA DE VEÍCULOS
---------------------------------------------------------------------- */

// Lê um input e devolve o texto já sem espaços nas pontas.
function valorDoCampo(campo) {
    return campo.value.trim();
}

// Monta o objeto de filtros no formato esperado pela API.
function montarFiltros() {
    const filtros = {
        placa: valorDoCampo(campoPlaca),
        chassi: valorDoCampo(campoChassi),
        marca_modelo: valorDoCampo(campoMarcaModelo),
        cor: valorDoCampo(campoCor),
        proprietario: valorDoCampo(campoProprietario),
        cpf_cnpj: valorDoCampo(campoCpfCnpj),
    };

    // Os trechos só entram na busca se o switch estiver ligado.
    if (partialSwitch.checked) {
        filtros.partial_campo = partialCampo.value || 'placa';
        filtros.partial_inicio = valorDoCampo(campoPartialInicio);
        filtros.partial_meio = valorDoCampo(campoPartialMeio);
        filtros.partial_fim = valorDoCampo(campoPartialFim);
    }

    return filtros;
}


/* Executa a pesquisa na API e desenha o resultado na tela. */
async function pesquisarVeiculos(pagina) {
    if (pesquisaEmAndamento) return;

    pesquisaEmAndamento = true;
    filtrosAtuais = montarFiltros();

    searchButton.disabled = true;
    searchButton.classList.add('is-loading');
    mostrarFeedback('Pesquisando...', 'info');

    try {
        const dados = await API.pesquisar(filtrosAtuais, pagina || 1, LIMITE_POR_PAGINA);

        paginaAtual = dados.page;
        totalRegistros = dados.total;
        totalPaginas = Math.max(1, Math.ceil(dados.total / dados.limit));

        emptyState.classList.add('hidden');
        renderizarTabela(dados.items);
        renderizarResumo(dados);
        renderizarPaginacao();
    } catch (erro) {
        // Erro de rede, sessão expirada, filtro inválido etc.
        resultsTableBody.innerHTML = '';
        resultsWrapper.classList.add('hidden');
        resultsSummary.classList.add('hidden');
        pagination.classList.add('hidden');
        emptyState.classList.add('hidden');
        mostrarFeedback(erro.message, 'erro');
    } finally {
        pesquisaEmAndamento = false;
        searchButton.disabled = false;
        searchButton.classList.remove('is-loading');
    }
}


/* Cria as linhas <tr> da tabela a partir dos veículos devolvidos. */
function renderizarTabela(itens) {
    resultsTableBody.innerHTML = '';

    itens.forEach(function (veiculo) {
        const linha = document.createElement('tr');

        // Usamos textContent (e não innerHTML) para inserir os valores:
        // assim, um nome ou observação com "<script>" aparece como texto,
        // nunca é executado pelo navegador (proteção contra XSS).
        linha.appendChild(criarCelula(veiculo.placa));
        linha.appendChild(criarCelula(veiculo.chassi));
        linha.appendChild(criarCelula(veiculo.marca + ' ' + veiculo.modelo));
        linha.appendChild(criarCelula(veiculo.cor));
        linha.appendChild(criarCelula(String(veiculo.ano)));
        linha.appendChild(criarCelula(veiculo.proprietario));

        resultsTableBody.appendChild(linha);
    });
}

function criarCelula(texto) {
    const celula = document.createElement('td');
    celula.textContent = texto === null || texto === undefined || texto === '' ? '—' : texto;
    return celula;
}


/* Escreve o resumo ("X veículos encontrados") e decide o estado vazio. */
function renderizarResumo(dados) {
    resultsSummary.classList.remove('hidden');

    const plural = dados.total === 1 ? 'veículo encontrado' : 'veículos encontrados';
    resultsSummary.textContent = dados.total.toLocaleString('pt-BR') + ' ' + plural;

    if (dados.items.length === 0) {
        resultsWrapper.classList.add('hidden');
        pagination.classList.add('hidden');
        mostrarFeedback('Nenhum veículo encontrado com os filtros informados.', 'info');
        return;
    }

    esconderFeedback();
    resultsWrapper.classList.remove('hidden');
}


/* Mostra/esconde os controles de paginação e o texto "Página X de Y". */
function renderizarPaginacao() {
    if (totalPaginas <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    pagination.classList.remove('hidden');
    pageInfo.textContent =
        'Página ' + paginaAtual.toLocaleString('pt-BR') +
        ' de ' + totalPaginas.toLocaleString('pt-BR');

    prevPageBtn.disabled = paginaAtual <= 1;
    nextPageBtn.disabled = paginaAtual >= totalPaginas;
}


/* Limpa a área de resultados (usado no logout e no botão "Limpar"). */
function limparResultados() {
    resultsTableBody.innerHTML = '';
    resultsWrapper.classList.add('hidden');
    resultsSummary.classList.add('hidden');
    pagination.classList.add('hidden');
    resultsFeedback.classList.add('hidden');
    emptyState.classList.remove('hidden');

    paginaAtual = 1;
    totalRegistros = 0;
    totalPaginas = 1;
}


/* Caixa de aviso acima da tabela: carregando / erro / sucesso. */
function mostrarFeedback(texto, tipo) {
    resultsFeedback.textContent = texto;
    resultsFeedback.classList.remove(
        'hidden', 'results-feedback--erro', 'results-feedback--sucesso'
    );

    if (tipo === 'erro') {
        resultsFeedback.classList.add('results-feedback--erro');
    } else if (tipo === 'sucesso') {
        resultsFeedback.classList.add('results-feedback--sucesso');
    }
}

function esconderFeedback() {
    resultsFeedback.classList.add('hidden');
}


/* Envio do formulário de pesquisa (botão PESQUISAR ou tecla Enter). */
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    pesquisarVeiculos(1); // toda nova pesquisa começa na página 1
});


/* Navegação entre páginas, mantendo os filtros atuais. */
prevPageBtn.addEventListener('click', function () {
    if (paginaAtual > 1) pesquisarVeiculos(paginaAtual - 1);
});

nextPageBtn.addEventListener('click', function () {
    if (paginaAtual < totalPaginas) pesquisarVeiculos(paginaAtual + 1);
});


/* ----------------------------------------------------------------------
   6. REGISTRO DE VEÍCULO (JANELA MODAL)
   ------------------------------------------------------------------------
   POST /api/veiculos. O backend valida e padroniza os dados (placa,
   chassi, CPF/CNPJ, ano...) e recusa duplicidade (HTTP 409). O front
   apenas exibe o que ele responder.
---------------------------------------------------------------------- */

function abrirModalVeiculo() {
    vehicleForm.reset();
    limparErrosDoModal();
    vehicleModal.classList.remove('hidden');
    veiPlaca.focus();
}

function fecharModalVeiculo() {
    vehicleModal.classList.add('hidden');
}

function limparErrosDoModal() {
    vehicleError.textContent = '';
    vehicleError.classList.add('hidden');

    Object.keys(CAMPOS_DO_VEICULO).forEach(function (campo) {
        const input = CAMPOS_DO_VEICULO[campo];
        input.classList.remove('input-invalido');
        input.removeAttribute('title');
    });
}

function mostrarErroDoModal(mensagem, errosPorCampo) {
    vehicleError.textContent = mensagem;
    vehicleError.classList.remove('hidden');

    if (!errosPorCampo) return;

    Object.keys(errosPorCampo).forEach(function (campo) {
        const input = CAMPOS_DO_VEICULO[campo];
        if (!input) return;
        input.classList.add('input-invalido');
        input.title = errosPorCampo[campo];
    });
}

newVehicleBtn.addEventListener('click', abrirModalVeiculo);
closeVehicleModalBtn.addEventListener('click', fecharModalVeiculo);
cancelVehicleBtn.addEventListener('click', fecharModalVeiculo);

// Fecha ao clicar no fundo escuro (fora do card) ou pressionar ESC.
vehicleModal.addEventListener('click', function (event) {
    if (event.target === vehicleModal) fecharModalVeiculo();
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !vehicleModal.classList.contains('hidden')) {
        fecharModalVeiculo();
    }
});


vehicleForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (salvandoVeiculo) return;

    limparErrosDoModal();

    // Monta o corpo exatamente como o schema VeiculoCreate espera.
    const dados = {
        placa: veiPlaca.value.trim(),
        chassi: veiChassi.value.trim(),
        renavam: veiRenavam.value.trim() || null,
        marca: veiMarca.value.trim(),
        modelo: veiModelo.value.trim(),
        cor: veiCor.value.trim(),
        ano: veiAno.value.trim() === '' ? null : Number(veiAno.value),
        proprietario: veiProprietario.value.trim(),
        cpf_cnpj: veiCpfCnpj.value.trim(),
        observacoes: veiObservacoes.value.trim() || null,
    };

    // Verificação rápida no navegador; a validação "de verdade" é a do
    // backend (formato de placa, dígitos de CPF, ano, etc.).
    const obrigatorios = ['placa', 'chassi', 'marca', 'modelo', 'cor', 'ano', 'proprietario', 'cpf_cnpj'];
    const faltando = obrigatorios.filter(function (campo) {
        return dados[campo] === null || dados[campo] === '';
    });

    if (faltando.length > 0) {
        const erros = {};
        faltando.forEach(function (campo) {
            erros[campo] = 'Campo obrigatório.';
        });
        mostrarErroDoModal('Preencha todos os campos obrigatórios (*).', erros);
        return;
    }

    salvandoVeiculo = true;
    saveVehicleBtn.disabled = true;
    saveVehicleBtn.textContent = 'SALVANDO...';

    try {
        const criado = await API.criarVeiculo(dados);

        fecharModalVeiculo();

        // Deixa o registro recém-criado visível: limpa os filtros e
        // pesquisa pela placa que acabou de ser cadastrada.
        searchForm.reset();
        partialExtra.classList.add('hidden');
        campoPlaca.value = criado.placa;

        await pesquisarVeiculos(1);
        mostrarFeedback('Veículo ' + criado.placa + ' registrado com sucesso.', 'sucesso');
    } catch (erro) {
        // 409 (duplicidade), 422 (campo inválido) ou falha de rede.
        mostrarErroDoModal(erro.message, erro.errosPorCampo);
    } finally {
        salvandoVeiculo = false;
        saveVehicleBtn.disabled = false;
        saveVehicleBtn.textContent = 'SALVAR';
    }
});


/* ----------------------------------------------------------------------
   7. BOTÃO "LIMPAR" DO FORMULÁRIO DE PESQUISA
---------------------------------------------------------------------- */
clearBtn.addEventListener('click', function () {
    // .reset() devolve todos os campos ao valor inicial (vazios, switch
    // desligado e select de volta para "Placa").
    searchForm.reset();
    partialExtra.classList.add('hidden');
    limparResultados();
    filtrosAtuais = {};
});


/* ----------------------------------------------------------------------
   8. BOTÃO FLUTUANTE DE AJUDA
---------------------------------------------------------------------- */
helpBtn.addEventListener('click', function () {
    alert(
        'Ajuda rápida:\n\n' +
        '1. Faça login com a matrícula 123456 e a senha 123456 (usuário de demonstração).\n' +
        '2. No Painel de Pesquisa Avançada, preencha um ou mais filtros (Placa, Chassi, Marca/Modelo, etc.).\n' +
        '3. Ative "PESQUISA PARCIAL" para buscar por trechos de Início, Meio ou Fim, escolhendo se o trecho pertence à placa ou ao chassi.\n' +
        '4. Clique em PESQUISAR para consultar o banco (os resultados são paginados).\n' +
        '5. Use "+ NOVO VEÍCULO" para cadastrar um veículo; o sistema valida os dados e bloqueia placas/chassis repetidos.\n\n' +
        'A API precisa estar rodando: na pasta backend, execute "py run.py".'
    );
});

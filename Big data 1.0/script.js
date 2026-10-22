/* ============================================================================
   PROJETO: Sistema de Identificação e Busca de Veículos (Projeto de Big Data)
   ARQUIVO: script.js
   ============================================================================
   Este arquivo contém toda a INTERATIVIDADE do site:
     1. Captura de elementos do DOM
     2. Lógica de login (trocar da tela de login para o painel)
     3. Lógica de logout (voltar do painel para o login)
     4. Mostrar/ocultar a senha digitada
     5. Mostrar/ocultar os mini-campos de "pesquisa parcial"
     6. Botão "Limpar" do formulário de pesquisa
     7. Simulação de pesquisa de veículos (dados de exemplo)
     8. Botão flutuante de ajuda

   IMPORTANTE: como a tag <script src="script.js"> está no final do
   <body> (veja o index.html), todo o HTML já foi carregado quando este
   código roda. Por isso NÃO precisamos esperar o evento
   "DOMContentLoaded" para começar a buscar elementos — eles já existem.
   ========================================================================= */


/* ----------------------------------------------------------------------
   1. CAPTURA DE ELEMENTOS DO DOM
   ------------------------------------------------------------------------
   "DOM" (Document Object Model) é a representação da página HTML em
   forma de objetos que o JavaScript consegue ler e manipular.

   Usamos duas formas de selecionar elementos:
     - document.getElementById("algumId")  → mais rápido, busca por id
     - document.querySelector("seletor")   → mais flexível, aceita
       qualquer seletor CSS (.classe, tag, [atributo], etc.)

   Guardamos cada elemento em uma constante (const) para não precisar
   "buscar" o mesmo elemento várias vezes no meio do código — isso deixa
   o código mais rápido e mais fácil de ler.
------------------------------------------------------------------------- */

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

// --- Botão de mostrar/ocultar senha ---
const togglePasswordBtn = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');

// --- Formulário e campos de PESQUISA (painel) ---
const searchForm = document.getElementById('searchForm');
const clearBtn = document.getElementById('clearBtn');

// --- Switch de "pesquisa parcial" ---
const partialSwitch = document.getElementById('partialSwitch');
const partialInputsRow = document.getElementById('partialInputsRow');

// --- Área de resultados ---
const emptyState = document.getElementById('emptyState');
const resultsWrapper = document.getElementById('resultsWrapper');
const resultsTableBody = document.getElementById('resultsTableBody');

// --- Botão flutuante de ajuda ---
const helpBtn = document.getElementById('helpBtn');

// Senha "correta" para esta simulação. Em um sistema real, essa
// verificação NUNCA aconteceria no navegador — ela seria feita em um
// servidor/back-end seguro. Aqui é só para fins didáticos/demonstrativos.
const SENHA_DEMONSTRACAO = '123456';


/* ----------------------------------------------------------------------
   2. LOGIN: trocar da tela "Acesso Restrito" para o "Painel de Pesquisa"
   ------------------------------------------------------------------------
   "addEventListener" é como dizemos ao navegador: "quando ESTE evento
   acontecer NESTE elemento, execute ESTA função". Aqui escutamos o
   evento "submit" do formulário, que dispara tanto ao clicar no botão
   ENTRAR quanto ao apertar a tecla Enter dentro de um dos campos.
------------------------------------------------------------------------- */
loginForm.addEventListener('submit', function (event) {
    // event.preventDefault() cancela o comportamento padrão do navegador
    // ao enviar um <form>, que seria RECARREGAR a página inteira. Como
    // esta é uma simulação 100% no front-end, queremos controlar nós
    // mesmos o que acontece a seguir, sem reload.
    event.preventDefault();

    const senhaDigitada = senhaInput.value.trim();

    if (senhaDigitada === SENHA_DEMONSTRACAO) {
        // --- LOGIN COM SUCESSO ---

        // classList.add('hidden') aplica a classe ".hidden" (definida no
        // styles.css como display:none) ao elemento, escondendo-o.
        loginScreen.classList.add('hidden');

        // classList.remove('hidden') faz o oposto: revela o elemento.
        panelScreen.classList.remove('hidden');
        headerRight.classList.remove('hidden');

        // Atualiza o badge do cabeçalho com a matrícula digitada, para
        // simular que o sistema "reconheceu" o usuário. Se o campo
        // estiver vazio, mantemos um valor de exemplo.
        const matriculaDigitada = matriculaInput.value.trim();
        userBadge.textContent = matriculaDigitada
            ? '12 ' + matriculaDigitada
            : '12 123456';

        // Garante que qualquer mensagem de erro de uma tentativa anterior
        // fique escondida da próxima vez que o usuário voltar ao login.
        loginError.classList.add('hidden');

        // Limpa o formulário de login por segurança/organização.
        loginForm.reset();
    } else {
        // --- LOGIN COM ERRO ---
        // Mostra a mensagem de erro que já existe no HTML (começa escondida).
        loginError.classList.remove('hidden');
    }
});


/* ----------------------------------------------------------------------
   3. LOGOUT: voltar do painel para a tela de login
------------------------------------------------------------------------- */
logoutBtn.addEventListener('click', function () {
    // Esconde o painel e o cabeçalho de usuário logado...
    panelScreen.classList.add('hidden');
    headerRight.classList.add('hidden');

    // ...e mostra a tela de login novamente.
    loginScreen.classList.remove('hidden');

    // Reseta também o formulário e os resultados de pesquisa, para que
    // o próximo usuário a usar o computador não veja dados da pesquisa
    // anterior.
    searchForm.reset();
    partialInputsRow.classList.add('hidden');
    resultsWrapper.classList.add('hidden');
    emptyState.classList.remove('hidden');
    resultsTableBody.innerHTML = '';
});


/* ----------------------------------------------------------------------
   4. MOSTRAR / OCULTAR SENHA
   ------------------------------------------------------------------------
   A ideia central: um <input> tem um atributo "type" que pode ser trocado
   dinamicamente via JavaScript. Quando type="password", o navegador
   mostra bolinhas/asteriscos no lugar dos caracteres digitados. Quando
   type="text", ele mostra o texto normalmente. Nós simplesmente
   alternamos entre os dois valores a cada clique.
------------------------------------------------------------------------- */
togglePasswordBtn.addEventListener('click', function () {
    // Verifica o valor ATUAL do atributo "type" do campo de senha.
    const senhaEstaVisivel = senhaInput.getAttribute('type') === 'text';

    if (senhaEstaVisivel) {
        // Se já está visível, volta a esconder.
        senhaInput.setAttribute('type', 'password');
    } else {
        // Se está escondida, revela o texto.
        senhaInput.setAttribute('type', 'text');
    }

    // Troca também o ícone do olho, como pista visual extra do estado atual.
    // Usamos innerHTML para substituir o desenho interno do SVG por um
    // ícone de "olho riscado" quando a senha estiver visível.
    if (senhaEstaVisivel) {
        // Voltando para "oculto": desenha o olho aberto normal
        eyeIcon.innerHTML = `
            <path d="M1 12 C4 6 8.5 3 12 3 C15.5 3 20 6 23 12 C20 18 15.5 21 12 21 C8.5 21 4 18 1 12 Z"
                  fill="none" stroke="#5b7290" stroke-width="1.7"/>
            <circle cx="12" cy="12" r="3.2" fill="none" stroke="#5b7290" stroke-width="1.7"/>
        `;
    } else {
        // Ficando "visível": desenha o olho com um traço cruzando (riscado)
        eyeIcon.innerHTML = `
            <path d="M1 12 C4 6 8.5 3 12 3 C15.5 3 20 6 23 12 C20 18 15.5 21 12 21 C8.5 21 4 18 1 12 Z"
                  fill="none" stroke="#1565c0" stroke-width="1.7"/>
            <circle cx="12" cy="12" r="3.2" fill="none" stroke="#1565c0" stroke-width="1.7"/>
            <line x1="2" y1="22" x2="22" y2="2" stroke="#1565c0" stroke-width="1.7" stroke-linecap="round"/>
        `;
    }
});


/* ----------------------------------------------------------------------
   5. SWITCH "PESQUISA PARCIAL"
   ------------------------------------------------------------------------
   O evento "change" de um checkbox dispara sempre que o usuário marca
   ou desmarca ele (seja clicando com o mouse, seja pelo teclado).
   A propriedade ".checked" nos diz se ele está marcado (true) ou
   desmarcado (false) NESTE exato momento.
------------------------------------------------------------------------- */
partialSwitch.addEventListener('change', function () {
    if (partialSwitch.checked) {
        partialInputsRow.classList.remove('hidden'); // liga → mostra Início/Meio/Fim
    } else {
        partialInputsRow.classList.add('hidden');     // desliga → esconde de novo
    }
});


/* ----------------------------------------------------------------------
   6. BOTÃO "LIMPAR" DO FORMULÁRIO DE PESQUISA
   ------------------------------------------------------------------------
   Todo elemento <form> em HTML já vem, de fábrica, com um método
   chamado .reset(), que devolve todos os campos dentro dele para o
   valor que tinham quando a página carregou (ou seja, vazios, no
   nosso caso). Não precisamos limpar campo por campo manualmente.
------------------------------------------------------------------------- */
clearBtn.addEventListener('click', function () {
    searchForm.reset();

    // Como o .reset() desmarca o switch de pesquisa parcial, escondemos
    // também a linha de Início/Meio/Fim, para o visual acompanhar o
    // estado real do formulário.
    partialInputsRow.classList.add('hidden');
});


/* ----------------------------------------------------------------------
   7. SIMULAÇÃO DE PESQUISA DE VEÍCULOS
   ------------------------------------------------------------------------
   Em um sistema real, ao clicar em "PESQUISAR" o front-end enviaria os
   valores do formulário para uma API/back-end, que consultaria um banco
   de dados e devolveria os veículos encontrados.

   Como este é um projeto DIDÁTICO e 100% front-end, simulamos essa
   resposta com uma lista fixa de veículos de exemplo, guardada aqui
   mesmo no JavaScript, em formato de array de objetos.
------------------------------------------------------------------------- */
const VEICULOS_EXEMPLO = [
    { placa: 'ABC-1234', modelo: 'Fiat Uno Mille 1.0', cor: 'Prata',   ano: 2015, proprietario: 'Carlos A. Souza' },
    { placa: 'DEF-5678', modelo: 'Volkswagen Gol 1.6',  cor: 'Branco',  ano: 2019, proprietario: 'Maria F. Lima' },
    { placa: 'GHI-9012', modelo: 'Chevrolet Onix LT',   cor: 'Preto',   ano: 2021, proprietario: 'João P. Ferreira' },
    { placa: 'JKL-3456', modelo: 'Honda Civic EXL',     cor: 'Cinza',   ano: 2020, proprietario: 'Ana C. Rodrigues' },
];

searchForm.addEventListener('submit', function (event) {
    // De novo, evitamos o recarregamento padrão da página ao enviar o form.
    event.preventDefault();

    // Passo 1: limpamos qualquer resultado de uma pesquisa anterior antes
    // de desenhar os novos, para não ficar duplicando linhas na tabela.
    resultsTableBody.innerHTML = '';

    // Passo 2: para cada veículo do array de exemplo, criamos uma linha
    // <tr> de tabela e a inserimos dentro do <tbody>.
    VEICULOS_EXEMPLO.forEach(function (veiculo) {
        // document.createElement cria um elemento HTML "em memória",
        // que ainda não aparece na página até ser inserido em algum lugar.
        const linha = document.createElement('tr');

        // Usamos um "template string" (crase ` `) para montar o HTML
        // interno da linha de forma legível, interpolando os dados do
        // objeto "veiculo" com a sintaxe ${...}.
        linha.innerHTML = `
            <td>${veiculo.placa}</td>
            <td>${veiculo.modelo}</td>
            <td>${veiculo.cor}</td>
            <td>${veiculo.ano}</td>
            <td>${veiculo.proprietario}</td>
        `;

        // appendChild insere a linha criada como o último filho do <tbody>.
        resultsTableBody.appendChild(linha);
    });

    // Passo 3: troca o "estado vazio" pelo "estado com tabela".
    emptyState.classList.add('hidden');
    resultsWrapper.classList.remove('hidden');
});


/* ----------------------------------------------------------------------
   8. BOTÃO FLUTUANTE DE AJUDA
   ------------------------------------------------------------------------
   Para manter o exemplo simples e 100% funcional sem depender de
   nenhuma biblioteca externa de modais/pop-ups, usamos aqui a função
   window.alert(), nativa do navegador. Em um projeto maior, o ideal
   seria trocar isso por um modal customizado, estilizado com o mesmo
   Design System do restante do site.
------------------------------------------------------------------------- */
helpBtn.addEventListener('click', function () {
    alert(
        'Ajuda rápida:\n\n' +
        '1. Faça login com sua MATRÍCULA/CPF e a senha de demonstração (123456).\n' +
        '2. No Painel de Pesquisa Avançada, preencha um ou mais filtros (Placa, Chassi, Marca/Modelo, etc.).\n' +
        '3. Ative "PESQUISA PARCIAL" caso queira buscar por trechos de Início, Meio ou Fim.\n' +
        '4. Clique em PESQUISAR para ver os resultados, ou em Limpar para reiniciar o formulário.'
    );
});

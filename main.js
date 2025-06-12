// main.js
// Este é o arquivo principal que inicializa o jogo, carrega os recursos (assets),
// configura os menus, os botões e os inputs do teclado.

// Adiciona um listener que espera todo o conteúdo do HTML (DOM) ser carregado
// antes de executar qualquer código, garantindo que todos os elementos existam.
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM carregado. Configurando o jogo...');

    // --- Referências aos Elementos da Página (HTML) ---
    // Pega as referências dos elementos HTML para que o JavaScript possa manipulá-los.
    const canvas = document.getElementById('canvas_jc');
    const context = canvas.getContext('2d');
    const menuPrincipal = document.getElementById('menu-principal');
    const botaoIniciar = document.getElementById('botao-iniciar');
    const menuPausa = document.getElementById('menu-pausa');
    const botaoReiniciarJogo = document.getElementById('botao-reiniciar-jogo');
    const botaoContinuarJogo = document.getElementById('botao-continuar-jogo');
    const botaoVoltarMenu = document.getElementById('botao-voltar-menu');
    const botaoControles = document.getElementById('botao-controles');
    const telaControles = document.getElementById('tela-controles');
    const botaoVoltarControles = document.getElementById('botao-voltar-controles');
    const telaGameOver = document.getElementById('tela-game-over');
    const botaoVoltarMenuGameOver = document.getElementById('botao-voltar-menu-gameover');
    
    // Referências para a tela de Vitória.
    const telaVitoria = document.getElementById('tela-vitoria');
    const botaoVoltarMenuVitoria = document.getElementById('botao-voltar-menu-vitoria');

    // --- Módulos Principais do Jogo ---
    // Instancia os componentes centrais do jogo.
    const teclado = new Teclado(document); // Gerenciador de inputs do teclado.
    const animacao = new Animacao(context, canvas); // O motor principal do jogo.

    // --- Variáveis de Jogo e Carregamento de Assets ---
    let jc; // Variável que armazenará a instância do jogador.
    // Cria objetos de imagem que serão usados para carregar os sprites.
    const imgJC = new Image();
    const imgCoracao = new Image();
    const imgInimigoPolvo = new Image();
    const imgBossAsset = new Image();
    // Agrupa todas as imagens em um array para facilitar o gerenciamento do carregamento.
    const imagens = [imgJC, imgCoracao, imgInimigoPolvo, imgBossAsset];
    let imagensCarregadas = 0; // Contador para saber quando todas as imagens terminaram de carregar.

    /**
     * Função central para iniciar uma nova partida ou reiniciar após um game over.
     */
    function iniciarNovoJogo() {
        console.log("Iniciando/Reiniciando o jogo...");
        // Reseta o motor de animação para um estado limpo (remove inimigos, etc.).
        animacao.resetarJogo();

        // Verificação de segurança para garantir que a classe Spritesheet foi carregada.
        if (typeof Spritesheet === 'undefined') {
            alert("Erro crítico: Classe Spritesheet não encontrada.");
            return;
        }
        
        // Cria uma nova instância do jogador.
        jc = new JC(context, teclado, imgJC, animacao, canvas);
        // Adiciona o jogador ao motor de animação, marcando-o como o jogador principal.
        animacao.novoSprite(jc, true);

        // Garante que todas as telas de menu estejam escondidas no início do jogo.
        if (menuPrincipal) menuPrincipal.classList.add('escondido');
        if (menuPausa) menuPausa.classList.add('escondido');
        if (telaControles) telaControles.classList.add('escondido');
        if (telaGameOver) telaGameOver.classList.add('escondido');
        if (telaVitoria) telaVitoria.classList.add('escondido');

        // Liga o loop principal do jogo.
        animacao.ligar();
        console.log("Jogo iniciado/reiniciado. Animação ligada.");
    }

    /**
     * Função de callback chamada toda vez que uma imagem termina de carregar.
     */
    function imagemCarregada() {
        // Incrementa o contador de imagens carregadas.
        imagensCarregadas++;
        // Verificação de erro comum: se a imagem carregou mas não tem altura, algo está errado com o arquivo.
        if (this.complete && this.naturalHeight === 0 && this.src) {
            console.error('IMAGEM PARECE NÃO TER CARREGADO CORRETAMENTE (altura 0):', this.src);
        }

        // Quando o número de imagens carregadas for igual ao total de imagens...
        if (imagensCarregadas === imagens.length) {
            // ...faz uma verificação final para garantir que todas estão realmente prontas.
            const tudoOk = imagens.every(img => img.complete && img.naturalHeight !== 0);
            if (tudoOk) {
                console.log("Assets carregados. Jogo pronto para iniciar via menu.");
                
                // Configura o motor de animação com as imagens carregadas.
                animacao.imgCoracaoHUD = imgCoracao;
                animacao.imgInimigo = imgInimigoPolvo;
                animacao.imgInimigoLinhas = 2;
                animacao.imgInimigoColunas = 4;
                animacao.imgBoss = imgBossAsset;
                
                // Configura os inputs do teclado agora que o jogo está pronto.
                configurarTeclado();
            } else {
                // Se alguma imagem falhou, exibe um erro detalhado.
                let erros = "ERRO FATAL NO CARREGAMENTO DE IMAGENS: ";
                imagens.forEach(img => {
                    if (!img.complete || img.naturalHeight === 0) {
                        erros += `${img.src || 'Imagem desconhecida'} falhou. `;
                    }
                });
                console.error(erros);
                alert(erros + "Verifique o console (F12).");
            }
        }
    }

    /**
     * Configura as ações que serão disparadas ao pressionar cada tecla.
     */
    function configurarTeclado() {
        // Associa uma função a cada tecla. A função só é executada se o jogo não estiver pausado.
        teclado.disparou(SETA_CIMA, () => { if(jc && !animacao.pausado) jc.pular(); });
        teclado.disparou(TECLA_W, () => { if(jc && !animacao.pausado) jc.pular(); });
        teclado.disparou(ESPACO, () => { if(jc && !animacao.pausado) jc.atirar(); });
        // Teclas de debug/cheat
        teclado.disparou(TECLA_R, () => { if(jc && !animacao.pausado) jc.restaurarVidas(); });
        teclado.disparou(TECLA_P, () => { if (jc && !jc.estaMorto && !animacao.pausado) jc.receberDano(); });
        // Tecla para pausar/despausar o jogo.
        teclado.disparou(77, function() { // Tecla 'M'
            // Só permite pausar se o jogo estiver rodando e nenhum outro menu estiver aberto.
            if (animacao.ligado && menuPrincipal.classList.contains('escondido') && telaControles.classList.contains('escondido')) {
                animacao.togglePausa();
            }
        });
    }

    // --- Lógica dos Botões da Interface ---
    // Adiciona um listener de evento 'click' para cada botão da interface.
    if (botaoIniciar) botaoIniciar.addEventListener('click', iniciarNovoJogo);
    if (botaoReiniciarJogo) botaoReiniciarJogo.addEventListener('click', iniciarNovoJogo);
    if (botaoContinuarJogo) botaoContinuarJogo.addEventListener('click', () => { if (animacao.pausado) animacao.togglePausa(); });
    // Botão para voltar ao menu principal a partir do menu de pausa (resulta em fim de jogo).
    if (botaoVoltarMenu) {
        botaoVoltarMenu.addEventListener('click', () => {
            if (menuPausa) menuPausa.classList.add('escondido');
            // Chamar gameOver() aqui encerra a partida atual.
            if (typeof animacao.gameOver === 'function') animacao.gameOver();
        });
    }
    // Botão para mostrar a tela de controles.
    if (botaoControles) {
        botaoControles.addEventListener('click', () => {
            if (menuPrincipal) menuPrincipal.classList.add('escondido');
            if (telaControles) telaControles.classList.remove('escondido');
        });
    }
    // Botão para voltar da tela de controles para o menu principal.
    if (botaoVoltarControles) {
        botaoVoltarControles.addEventListener('click', () => {
            if (telaControles) telaControles.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    // Botão para voltar ao menu principal a partir da tela de Game Over.
    if (botaoVoltarMenuGameOver) {
        botaoVoltarMenuGameOver.addEventListener('click', () => {
            if (telaGameOver) telaGameOver.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    
    // Botão para voltar ao menu principal a partir da tela de Vitória.
    if (botaoVoltarMenuVitoria) {
        botaoVoltarMenuVitoria.addEventListener('click', () => {
            if (telaVitoria) telaVitoria.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    
    // --- Início do Carregamento das Imagens ---
    // Itera sobre o array de imagens e configura os callbacks 'onload' e 'onerror'.
    imagens.forEach(img => {
        img.onload = imagemCarregada; // Função a ser chamada quando a imagem carrega com sucesso.
        img.onerror = function() { // Função a ser chamada se houver um erro ao carregar.
            console.error("ERRO AO CARREGAR IMAGEM:", img.src);
            // Mesmo com erro, chama a função para que o contador avance e o jogo não fique travado.
            imagemCarregada.call(img);
        };
    });
    // Define o atributo 'src' de cada imagem. É ESTA AÇÃO que efetivamente inicia o download da imagem.
    imgJC.src = 'img/JC_alpha.png';
    imgCoracao.src = 'img/vida-coracao.png';
    imgInimigoPolvo.src = 'img/inimigo_polvo.png';
    imgBossAsset.src = 'img/boss_mestre_do_caos.png';
});

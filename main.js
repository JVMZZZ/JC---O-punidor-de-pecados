// main.js
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM carregado. Configurando o jogo...');

    // Elementos da página
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
    
    // <<< ADICIONADO AQUI >>>: Referências para a nova tela de Vitória
    const telaVitoria = document.getElementById('tela-vitoria');
    const botaoVoltarMenuVitoria = document.getElementById('botao-voltar-menu-vitoria');

    // Módulos do Jogo
    const teclado = new Teclado(document);
    const animacao = new Animacao(context, canvas);

    // Variáveis de Jogo
    let jc; 
    const imgJC = new Image();
    const imgCoracao = new Image();
    const imgInimigoPolvo = new Image();
    const imgBossAsset = new Image();
    const imagens = [imgJC, imgCoracao, imgInimigoPolvo, imgBossAsset];
    let imagensCarregadas = 0;

    // Função para iniciar ou reiniciar o jogo
    function iniciarNovoJogo() {
        console.log("Iniciando/Reiniciando o jogo...");
        animacao.resetarJogo();

        if (typeof Spritesheet === 'undefined') {
            alert("Erro crítico: Classe Spritesheet não encontrada.");
            return;
        }
        
        jc = new JC(context, teclado, imgJC, animacao, canvas);
        animacao.novoSprite(jc, true);

        // Garante que todos os menus, incluindo o de Vitória, estejam escondidos ao iniciar
        if (menuPrincipal) menuPrincipal.classList.add('escondido');
        if (menuPausa) menuPausa.classList.add('escondido');
        if (telaControles) telaControles.classList.add('escondido');
        if (telaGameOver) telaGameOver.classList.add('escondido');
        if (telaVitoria) telaVitoria.classList.add('escondido'); // <<< ADICIONADO AQUI >>>

        animacao.ligar();
        console.log("Jogo iniciado/reiniciado. Animação ligada.");
    }

    // Função chamada quando cada imagem termina de carregar
    function imagemCarregada() {
        imagensCarregadas++;
        if (this.complete && this.naturalHeight === 0 && this.src) {
            console.error('IMAGEM PARECE NÃO TER CARREGADO CORRETAMENTE (altura 0):', this.src);
        }

        if (imagensCarregadas === imagens.length) {
            const tudoOk = imagens.every(img => img.complete && img.naturalHeight !== 0);
            if (tudoOk) {
                console.log("Assets carregados. Jogo pronto para iniciar via menu.");
                
                // Configura a instância da animação com os recursos carregados
                animacao.imgCoracaoHUD = imgCoracao;
                animacao.imgInimigo = imgInimigoPolvo;
                animacao.imgInimigoLinhas = 2;
                animacao.imgInimigoColunas = 4;
                animacao.imgBoss = imgBossAsset;
                
                configurarTeclado();
            } else {
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

    // Configura os listeners de teclado
    function configurarTeclado() {
        teclado.disparou(SETA_CIMA, () => { if(jc && !animacao.pausado) jc.pular(); });
        teclado.disparou(TECLA_W, () => { if(jc && !animacao.pausado) jc.pular(); });
        teclado.disparou(ESPACO, () => { if(jc && !animacao.pausado) jc.atirar(); });
        teclado.disparou(TECLA_R, () => { if(jc && !animacao.pausado) jc.restaurarVidas(); });
        teclado.disparou(TECLA_P, () => { if (jc && !jc.estaMorto && !animacao.pausado) jc.receberDano(); });
        teclado.disparou(77, function() { // Tecla 'M'
            if (animacao.ligado && menuPrincipal.classList.contains('escondido') && telaControles.classList.contains('escondido')) { 
                animacao.togglePausa();
            }
        });
    }

    // Lógica dos Botões
    if (botaoIniciar) botaoIniciar.addEventListener('click', iniciarNovoJogo);
    if (botaoReiniciarJogo) botaoReiniciarJogo.addEventListener('click', iniciarNovoJogo);
    if (botaoContinuarJogo) botaoContinuarJogo.addEventListener('click', () => { if (animacao.pausado) animacao.togglePausa(); });
    if (botaoVoltarMenu) {
        botaoVoltarMenu.addEventListener('click', () => {
            if (menuPausa) menuPausa.classList.add('escondido');
            // Nota: O botão de voltar no menu de pausa deve te levar de volta ao menu principal,
            // o que geralmente significa que o jogo acabou. Se o jogador puder voltar sem o jogo acabar,
            // o comportamento aqui pode precisar ser diferente de chamar gameOver().
            if (typeof animacao.gameOver === 'function') animacao.gameOver();
        });
    }
    if (botaoControles) {
        botaoControles.addEventListener('click', () => {
            if (menuPrincipal) menuPrincipal.classList.add('escondido');
            if (telaControles) telaControles.classList.remove('escondido');
        });
    }
    if (botaoVoltarControles) {
        botaoVoltarControles.addEventListener('click', () => {
            if (telaControles) telaControles.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    if (botaoVoltarMenuGameOver) {
        botaoVoltarMenuGameOver.addEventListener('click', () => {
            if (telaGameOver) telaGameOver.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    
    // <<< ADICIONADO AQUI >>>: Lógica para o novo botão na tela de Vitória
    if (botaoVoltarMenuVitoria) {
        botaoVoltarMenuVitoria.addEventListener('click', () => {
            if (telaVitoria) telaVitoria.classList.add('escondido');
            if (menuPrincipal) menuPrincipal.classList.remove('escondido');
        });
    }
    
    // Define os callbacks e inicia o carregamento das imagens
    imagens.forEach(img => {
        img.onload = imagemCarregada;
        img.onerror = function() {
            console.error("ERRO AO CARREGAR IMAGEM:", img.src);
            imagemCarregada.call(img); 
        };
    });
    imgJC.src = 'img/JC_alpha.png';
    imgCoracao.src = 'img/vida-coracao.png';
    imgInimigoPolvo.src = 'img/inimigo_polvo.png';
    imgBossAsset.src = 'img/boss_mestre_do_caos.png';
});
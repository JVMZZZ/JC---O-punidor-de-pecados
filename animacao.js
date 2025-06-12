// animacao.js
// É responsável por gerenciar o loop de renderização (game loop), todos os objetos (sprites),
// a câmera, o spawn de inimigos, as colisões e os eventos principais do jogo.

/**
 * Construtor do motor de animação. Inicializa o estado do jogo.
 */
function Animacao(context, canvas) {
    // --- Referências Essenciais ---
    this.context = context; // O "pincel" para desenhar no canvas.
    this.canvas = canvas; // A referência ao elemento <canvas>, usado para obter dimensões.

    // --- Gerenciamento de Sprites ---
    this.sprites = []; // Array que armazena todos os objetos ativos no jogo (jogador, inimigos, etc.).
    this.jogadorPrincipal = null; // Referência direta ao objeto do jogador para acesso rápido.

    // --- Controle do Loop de Animação ---
    this.ligado = false; // Chave geral do loop. Se 'false', a animação para.
    this.ultimoTempo = 0; // Armazena o timestamp do último quadro, para calcular o deltaTime.
    this.pausado = false; // Flag para pausar o jogo. O loop continua, mas as atualizações são puladas.

    // --- Configurações do Mundo e Câmera ---
    this.cameraX = 0; // Posição X da câmera no mundo do jogo.
    this.cameraY = 0; // Posição Y da câmera no mundo do jogo.
    this.mundoLargura = 5000; // Largura total do cenário.
    this.cameraSuavizacao = 0.08; // Fator para suavizar o movimento da câmera, criando um efeito de "lag" suave.

    // --- Lógica de Spawn de Inimigos ---
    this.distanciaSpawnInimigo = 700; // Distância (em pixels) do jogador onde inimigos podem surgir.
    this.maxInimigos = 5; // Número máximo de inimigos "comuns" na tela.
    this.frequenciaSpawnInimigo = 5000; // Intervalo de tempo mínimo (ms) para tentar criar um novo inimigo.
    this.tempoUltimoSpawnInimigo = 0; // Registra o timestamp do último spawn.
    this.distanciaMinimaEntreInimigos = 40; // Espaçamento mínimo para evitar que inimigos se sobreponham.
    this.imgInimigo = null; // Objeto de imagem (spritesheet) dos inimigos.
    this.imgInimigoLinhas = 1; // Linhas no spritesheet do inimigo.
    this.imgInimigoColunas = 4; // Colunas no spritesheet do inimigo.

    // --- Eventos de Jogo (Portão em x=4000) ---
    this.condicaoPortao4000Liberado = false; // 'true' quando o jogador cumpre o requisito para abrir o portão.
    this.jogadorPassouPortao4000 = false; // 'true' quando o jogador cruza a marca de X=4000.
    this.inimigosDerrotadosContador = 0; // Contador de inimigos derrotados para a condição do portão.
    this.totalInimigosParaLiberarPortao = 5; // Meta de abates para liberar o portão.

    // --- Lógica de Recompensas e Drops ---
    this.abatesDesdeUltimoCoracao = 0; // Contador de abates para o drop de um item de cura.
    this.abatesNecessariosPorCoracao = 3; // Meta de abates para dropar um coração.
    this.imgCoracaoHUD = null; // Imagem do coração para a HUD e para o item dropado.
    this.abatesParaVidaExtra = 0; // Contador de abates para a recompensa de vida máxima.
    this.abatesNecessariosParaVidaExtra = 30; // A meta de 30 abates para a recompensa.

    // --- Lógica do Chefe (Boss) ---
    this.imgBoss = null; // Imagem (spritesheet) do Boss.
    this.bossInstancia = null; // Referência ao objeto do Boss quando ele estiver ativo.
    this.bossJaFoiSpawnado = false; // Flag para garantir que o Boss seja criado apenas uma vez.
}

Animacao.prototype = {
    /**
     * Adiciona um novo sprite ao motor de animação.
     */
    novoSprite: function(sprite, ehJogadorPrincipal = false) {
        // Adiciona o sprite ao array principal de gerenciamento.
        this.sprites.push(sprite);
        
        // Se este sprite for o jogador, armazena uma referência direta a ele.
        if (ehJogadorPrincipal) {
            this.jogadorPrincipal = sprite;
        }

        // Garante que o sprite tenha uma referência de volta a este motor de animação.
        if (sprite && typeof sprite.animacao === 'undefined') {
            sprite.animacao = this;
        }
    },

    /**
     * Inicia o loop principal do jogo.
     */
    ligar: function() {
        // Define os tempos iniciais para o cálculo de tempo e spawn.
        this.ultimoTempo = Date.now();
        this.tempoUltimoSpawnInimigo = Date.now();
        // Ativa o loop.
        this.ligado = true;
        this.pausado = false;
        // Inicia o ciclo de renderização.
        this.proximoFrame();
    },

    /**
     * Para completamente o loop principal do jogo.
     */
    desligar: function() {
        this.ligado = false;
    },

    /**
     * Atualiza a posição da câmera para seguir o jogador ou fixar-se em um local.
     */
    atualizarCamera: function() {
        // Se não houver jogador, não faz nada.
        if (!this.jogadorPrincipal) return;
        
        // Define a coordenada da barreira.
        const BARRIER_X_COORD = 4000;
        
        // Se o jogador já passou pelo portão...
        if (this.jogadorPassouPortao4000) {
            // A câmera se fixa no início da arena do boss.
            this.cameraX = BARRIER_X_COORD;
            // Garante que a câmera não ultrapasse os limites do mundo.
            this.cameraX = Math.min(this.cameraX, this.mundoLargura - this.canvas.width);
            this.cameraX = Math.max(0, this.cameraX);
        } else {
            // Caso contrário, a câmera segue o jogador.
            // Calcula a posição X alvo da câmera para centralizar o jogador.
            let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2) + (this.jogadorPrincipal.largura / 2);
            // Aplica uma interpolação linear para mover a câmera suavemente.
            let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * this.cameraSuavizacao;
            // Se a câmera estiver muito próxima do alvo, trava nela para evitar trepidação.
            if (Math.abs(alvoCameraX - novaCameraX) < 0.5) novaCameraX = alvoCameraX;
            this.cameraX = novaCameraX;
            // Garante que a câmera não saia dos limites do mundo.
            this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        }
    },

    /**
     * Verifica as condições e, se possível, cria um novo inimigo.
     */
    tentarSpawnInimigo: function(tempoAtual) {
        // Não cria inimigos se o jogador estiver na arena do boss.
        if (this.jogadorPassouPortao4000 || (this.bossInstancia && !this.bossInstancia.removivel)) return;
        // Não cria se o tempo desde o último spawn for menor que a frequência.
        if ((tempoAtual - this.tempoUltimoSpawnInimigo) < this.frequenciaSpawnInimigo) return;
        // Reseta o timer de spawn.
        this.tempoUltimoSpawnInimigo = tempoAtual;
        // Não cria se a contagem de inimigos atingiu o máximo.
        let inimigosVivos = this.sprites.filter(s => s && s.tipo === 'inimigo' && !s.removivel).length;
        if (inimigosVivos >= this.maxInimigos) return;
        // Não cria se a imagem do inimigo ou o jogador não estiverem prontos.
        if (!this.imgInimigo || !this.jogadorPrincipal || !this.imgInimigo.complete || this.imgInimigo.naturalHeight === 0) return;

        // Define a altura (Y) do spawn.
        let spawnY = (this.jogadorPrincipal.posicaoChao !== undefined) ? this.jogadorPrincipal.posicaoChao : (this.canvas.height - 100);
        let playerX = this.jogadorPrincipal.x;
        // Estima a largura do inimigo para cálculos de posição.
        let larguraEstimadaInimigo = (this.imgInimigoColunas > 0 && this.imgInimigo.naturalWidth > 0) ? this.imgInimigo.naturalWidth / this.imgInimigoColunas : 50;
        const LIMITE_SPAWN_ANTES_PORTAO = 3950;
        
        // Calcula as possíveis posições de spawn.
        let posicoesPossiveisX = [];
        let spawnEsquerdaX = playerX - this.distanciaSpawnInimigo;
        // Verifica se a posição à esquerda é válida.
        if (spawnEsquerdaX >= 0 && (spawnEsquerdaX + larguraEstimadaInimigo) < LIMITE_SPAWN_ANTES_PORTAO) {
            posicoesPossiveisX.push(spawnEsquerdaX);
        }
        let spawnDireitaX = playerX + this.distanciaSpawnInimigo;
        // Verifica se a posição à direita é válida.
        if (spawnDireitaX >= 0 && (spawnDireitaX + larguraEstimadaInimigo) < LIMITE_SPAWN_ANTES_PORTAO) {
            posicoesPossiveisX.push(spawnDireitaX);
        }
        
        // Se houver uma posição válida...
        if (posicoesPossiveisX.length > 0) {
            // Escolhe aleatoriamente uma das posições.
            let spawnX = posicoesPossiveisX[Math.floor(Math.random() * posicoesPossiveisX.length)];
            // Cria a nova instância do Inimigo.
            var novoInimigo = new Inimigo(this.context, spawnX, spawnY, this.jogadorPrincipal, this, this.canvas, this.imgInimigo, this.imgInimigoLinhas, this.imgInimigoColunas);
            // Adiciona o novo inimigo ao jogo.
            this.novoSprite(novoInimigo);
        }
    },
    
    /**
     * Aplica uma força de separação entre inimigos para evitar que se amontoem.
     */
    aplicarSeparacaoInimigos: function() {
        // Não executa se estiver na arena do boss.
        if (this.jogadorPassouPortao4000 || (this.bossInstancia && !this.bossInstancia.removivel)) return;
        // Pega todos os inimigos ativos.
        let inimigos = this.sprites.filter(s => s && s.tipo === 'inimigo' && !s.removivel);
        // Compara cada inimigo com todos os outros.
        for (let i = 0; i < inimigos.length; i++) {
            for (let j = i + 1; j < inimigos.length; j++) {
                let inimigoA = inimigos[i], inimigoB = inimigos[j];
                let la = inimigoA.largura || 50, ha = inimigoA.altura || 50;
                let lb = inimigoB.largura || 50, hb = inimigoB.altura || 50;
                // Calcula a distância entre os centros dos dois inimigos.
                let caX = inimigoA.x + la/2, caY = inimigoA.y + ha/2;
                let cbX = inimigoB.x + lb/2, cbY = inimigoB.y + hb/2;
                let dx = cbX - caX, dy = cbY - caY;
                let dist = Math.hypot(dx, dy);
                // Se a distância for menor que o mínimo desejado...
                if (dist < this.distanciaMinimaEntreInimigos && dist > 0) {
                    // Calcula o quanto cada um precisa se mover.
                    let mover = (this.distanciaMinimaEntreInimigos - dist)/2;
                    let normDx = dx/dist, normDy = dy/dist;
                    // Move os inimigos em direções opostas.
                    inimigoA.x -= normDx * mover; inimigoA.y -= normDy * mover;
                    inimigoB.x += normDx * mover; inimigoB.y += normDy * mover;
                    // Garante que eles não saiam dos limites do mundo.
                    inimigoA.x = Math.max(0, Math.min(inimigoA.x, this.mundoLargura - la));
                    inimigoB.x = Math.max(0, Math.min(inimigoB.x, this.mundoLargura - lb));
                }
            }
        }
    },

    /**
     * Verifica se a condição para liberar o portão em X=4000 foi atingida.
     */
    verificarCondicaoPortao4000: function() {
        // Se o portão já foi liberado, não faz nada.
        if (this.condicaoPortao4000Liberado) return;
        // Se o contador de inimigos derrotados atingiu a meta...
        if (this.inimigosDerrotadosContador >= this.totalInimigosParaLiberarPortao) {
            // Libera o portão.
            this.condicaoPortao4000Liberado = true;
            console.log("CONDIÇÃO DO PORTÃO 4000 CUMPRIDA! Portão liberado.");
        }
    },

    /**
     * Desenha o feedback visual do portão em X=4000.
     */
    desenharFeedbackPortao4000: function() {
        // Não desenha se o jogador já passou do portão.
        if (this.jogadorPassouPortao4000) return;
        
        const BARRIER_X_COORD = 4000;
        const LARGURA_PAREDE = 20;
        // Otimização: Se a parede estiver fora da visão da câmera, não desenha.
        if (BARRIER_X_COORD + LARGURA_PAREDE / 2 < this.cameraX || 
            BARRIER_X_COORD - LARGURA_PAREDE / 2 > this.cameraX + this.canvas.width) {
            return;
        }
        
        let xDesenhoParede = BARRIER_X_COORD;
        // Salva o estado do contexto.
        this.context.save();
        // Se o portão está liberado...
        if (this.condicaoPortao4000Liberado) {
            // Exibe um texto "CAMINHO LIVRE!" quando o jogador se aproxima.
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) {
                this.context.fillStyle = 'lightgreen'; this.context.font = 'bold 20px Arial';
                this.context.textAlign = 'center'; this.context.shadowColor = "black";
                this.context.shadowBlur = 4; this.context.fillText("CAMINHO LIVRE!", xDesenhoParede, 50);
                this.context.shadowColor = "transparent";
            }
        } else {
            // Se o portão está trancado, desenha uma parede.
            this.context.fillStyle = '#4A4A4A'; this.context.strokeStyle = '#202020';
            this.context.lineWidth = 3;
            this.context.fillRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, this.canvas.height);
            this.context.strokeRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, this.canvas.height);
            this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)'; this.context.lineWidth = 1;
            // Desenha linhas verticais para detalhe.
            const numLinhasV = 3; const espLinhas = LARGURA_PAREDE / (numLinhasV + 1);
            for (let i = 1; i <= numLinhasV; i++) {
                let xLinha = xDesenhoParede - LARGURA_PAREDE / 2 + (i * espLinhas);
                this.context.beginPath(); this.context.moveTo(xLinha, 0); this.context.lineTo(xLinha, this.canvas.height); this.context.stroke();
            }
            // Exibe um texto com a condição para abrir o portão.
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) {
                let inimigosFaltantes = Math.max(0, this.totalInimigosParaLiberarPortao - this.inimigosDerrotadosContador);
                let textoStatus = `BARREIRA ATIVA!\nDerrote ${inimigosFaltantes} inimigos.`;
                if (inimigosFaltantes === 1) textoStatus = `BARREIRA ATIVA!\nDerrote mais 1 inimigo.`;
                this.context.fillStyle = 'white'; this.context.font = 'bold 16px Arial';
                this.context.textAlign = 'center'; this.context.shadowColor = "black"; this.context.shadowBlur = 5;
                const lineHeight = 20; const lines = textoStatus.split('\n');
                for (let j = 0; j < lines.length; j++) this.context.fillText(lines[j], xDesenhoParede, 40 + (j * lineHeight));
                this.context.shadowColor = "transparent";
            }
        }
        // Restaura o estado do contexto.
        this.context.restore();
    },

    /**
     * Cria a instância do Boss e a adiciona ao jogo.
     */
    spawnBoss: function() {
        // Verifica se a imagem do Boss está pronta.
        if (!this.imgBoss || !this.imgBoss.complete || this.imgBoss.naturalHeight === 0) {
            console.warn("Animacao: Imagem do Boss não carregada, não pode spawnar.");
            return;
        }
        // Define a posição de spawn do Boss.
        const spawnXBoss = 4400;
        const alturaBoss = 120;
        const spawnYBoss = (this.jogadorPrincipal && this.jogadorPrincipal.posicaoChao !== undefined) 
                           ? (this.jogadorPrincipal.posicaoChao - alturaBoss + (this.jogadorPrincipal.altura || 0)) 
                           : (this.canvas.height - alturaBoss - 20);
        // Cria a instância do Boss.
        this.bossInstancia = new Boss(this.context, spawnXBoss, spawnYBoss, this.imgBoss, this, this.jogadorPrincipal, this.canvas);
        // Adiciona o Boss ao jogo.
        this.novoSprite(this.bossInstancia);
        // Marca que o Boss já foi criado.
        this.bossJaFoiSpawnado = true;

        // Inicia o registo de dano quando o boss aparece.
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.iniciarContagemDanoBoss === 'function') {
            this.jogadorPrincipal.iniciarContagemDanoBoss();
        }

        console.log("EVENTO: BOSS SPAWNADO!");
    },

    /**
     * Ativa os efeitos de quando o jogador entra na arena do Boss.
     */
    ativarEfeitosPortao4000: function() {
        console.log("ATIVANDO EFEITOS DO PORTÃO 4000! Eliminando inimigos normais...");
        // Itera sobre todos os sprites para remover os inimigos comuns.
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let sprite = this.sprites[i];
            if (sprite && sprite.tipo === 'inimigo') {
                sprite.removivel = true;
            }
        }
    },

    /**
     * Função chamada quando o Boss é derrotado.
     */
    eventoBossDerrotado: function() {
        console.log("Animacao: Evento de Boss Derrotado Recebido!");
        this.desligar(); // Para o loop do jogo
        this.bossInstancia = null; // Limpa a referência ao boss

        // Verifica se o jogador existe e se NÃO sofreu dano na batalha final.
        if (this.jogadorPrincipal && !this.jogadorPrincipal.sofreuDanoNaBatalhaFinal) {
            console.log("CONDIÇÃO DE VITÓRIA PERFEITA ATINGIDA!");
            // Mostra a tela de VITÓRIA PERFEITA (o Easter Egg)
            const telaVitoriaPerfeita = document.getElementById('tela-vitoria-perfeita');
            if (telaVitoriaPerfeita) {
                telaVitoriaPerfeita.classList.remove('escondido');
            }
        } else {
            // Caso contrário, mostra a tela de vitória normal.
            const telaVitoriaElement = document.getElementById('tela-vitoria');
            if (telaVitoriaElement) {
                telaVitoriaElement.classList.remove('escondido');
            }
        }
    },

    /**
     * Alterna o estado de pausa do jogo e exibe/esconde o menu de pausa.
     */
    togglePausa: function() {
        // Inverte o estado de pausa.
        this.pausado = !this.pausado;
        // Pega o elemento do menu de pausa no HTML.
        const menuPausaElement = document.getElementById('menu-pausa');
        if (menuPausaElement) {
            // Se o jogo está pausado, mostra o menu.
            if (this.pausado) {
                menuPausaElement.classList.remove('escondido');
                console.log("Jogo Pausado.");
            } else {
                // Se o jogo foi retomado, esconde o menu.
                menuPausaElement.classList.add('escondido');
                console.log("Jogo Retomado.");
            }
        }
    },

    /**
     * Reseta o estado do jogo para um novo começo.
     */
    resetarJogo: function() {
        console.log("Resetando estado da animação (sem recriar jogador aqui)...");
        // Limpa todos os sprites, incluindo o jogador antigo.
        this.sprites = [];
        this.jogadorPrincipal = null;
        
        // Reinicia as variáveis de estado do jogo.
        this.cameraX = 0;
        this.cameraY = 0;
        this.condicaoPortao4000Liberado = false;
        this.jogadorPassouPortao4000 = false;
        this.inimigosDerrotadosContador = 0;
        this.abatesDesdeUltimoCoracao = 0;
        
        this.bossInstancia = null;
        this.bossJaFoiSpawnado = false;
        
        this.tempoUltimoSpawnInimigo = Date.now();
        this.pausado = false;
    },
    
    /**
     * Ativa a tela de Game Over e para o jogo.
     */
    gameOver: function() {
        console.log("GAME OVER!");
        // Para o loop do jogo completamente.
        this.desligar();

        // Mostra a tela de Game Over no HTML.
        const telaGameOverElement = document.getElementById('tela-game-over');
        if (telaGameOverElement) {
            telaGameOverElement.classList.remove('escondido');
        }
    },

    /**
     * O coração do motor do jogo. Chamado recursivamente via requestAnimationFrame.
     * Orquestra todas as chamadas de atualização, desenho, colisão e lógica.
     */
    proximoFrame: function() {
        // Se o jogo não estiver ligado ou estiver pausado, interrompe a execução da lógica.
        if (!this.ligado || this.pausado) {
            // Se estiver ligado, mas pausado, continua agendando o próximo frame para não parar o loop.
            if (this.ligado) {
                requestAnimationFrame(() => this.proximoFrame());
            }
            return;
        }

        // Calcula o deltaTime: o tempo (em segundos) que passou desde o último quadro.
        var agora = Date.now();
        var deltaTime = (agora - this.ultimoTempo) / 1000.0;
        this.ultimoTempo = agora;

        // ATUALIZAÇÃO DE ESTADOS E LÓGICA 
        this.verificarCondicaoPortao4000();
        let estavaAntesDoPortao = !this.jogadorPassouPortao4000;
        
        this.tentarSpawnInimigo(agora);

        // Chama o método 'atualizar' de cada sprite.
        for (var i = 0; i < this.sprites.length; i++) {
            const spriteAtual = this.sprites[i];
            if (spriteAtual && typeof spriteAtual.atualizar === 'function') {
                spriteAtual.atualizar(deltaTime);
            }
        }
        
        // Dispara o evento se o jogador acabou de passar pelo portão.
        if (estavaAntesDoPortao && this.jogadorPassouPortao4000) {
            this.ativarEfeitosPortao4000();
        }

        // Spawna o boss se as condições forem atendidas.
        if (this.jogadorPassouPortao4000 && !this.bossJaFoiSpawnado && !this.bossInstancia) {
            this.spawnBoss();
        }
        
        // Atualiza a câmera e limpa a tela para o novo desenho.
        this.atualizarCamera();
        this.limparTela();

        // RENDERIZAÇÃO
        // Salva o estado do canvas.
        this.context.save();
        // Aplica o deslocamento da câmera a tudo que for desenhado a seguir.
        this.context.translate(-this.cameraX, -this.cameraY);
        
        // Desenha o cenário (que se move com a câmera).
        const alturaChao = 200;
        this.context.fillStyle = '#87CEEB'; // Céu
        this.context.fillRect(0, 0, this.mundoLargura, this.canvas.height - alturaChao);
        this.context.fillStyle = '#D2B48C'; // Chão
        this.context.fillRect(0, this.canvas.height - alturaChao, this.mundoLargura, alturaChao);
        
        // Aplica a lógica de separação de inimigos antes de desenhar.
        this.aplicarSeparacaoInimigos();

        // DETECÇÃO DE COLISÕES 
        var jogador = this.jogadorPrincipal;
        // Verifica se o jogador existe, não está morto e pode colidir.
        if (jogador && !jogador.estaMorto && typeof jogador.getHitboxMundo === 'function') {
            var hitboxJogador = jogador.getHitboxMundo();
            // Itera de trás para frente para poder remover itens do array sem pular o próximo item.
            for (var i = this.sprites.length - 1; i >= 0; i--) {
                var outroSprite = this.sprites[i];
                // Pula o sprite se ele for inválido, for o próprio jogador, ou não puder colidir.
                if (!outroSprite || outroSprite === jogador || typeof outroSprite.getHitboxMundo !== 'function' || !outroSprite.tipo) continue;
                
                // --- Lógica de colisão do Jogador com Inimigos/Lasers ---
                if (outroSprite.tipo === 'inimigo' || outroSprite.tipo === 'laserInimigo') {
                    var hitboxOutro = outroSprite.getHitboxMundo();
                    // Se as hitboxes colidem...
                    if (hitboxOutro && colidemRetangulos(hitboxJogador, hitboxOutro)) {
                        // O jogador recebe dano.
                        if (typeof jogador.receberDano === 'function') jogador.receberDano();
                        // Se for um laser, ele é removido após a colisão.
                        if (outroSprite.tipo === 'laserInimigo') outroSprite.removivel = true;
                    }
                }
                // --- Lógica de colisão do Projétil do Jogador (AguaBenta) ---
                else if (outroSprite.tipo === 'aguaBenta') {
                    var hitboxAguaBenta = outroSprite.getHitboxMundo();
                    if (!hitboxAguaBenta) continue;
                    // O projétil precisa verificar a colisão com todos os outros sprites.
                    for (var j = this.sprites.length - 1; j >= 0; j--) {
                        if (i === j) continue; // Não colide consigo mesmo.
                        var alvoDoProjetil = this.sprites[j];
                        // Verifica se o alvo é válido e pode colidir.
                        if (alvoDoProjetil && !alvoDoProjetil.removivel && typeof alvoDoProjetil.getHitboxMundo === 'function') {
                            // Se o alvo for um inimigo...
                            if (alvoDoProjetil.tipo === 'inimigo') {
                                var hitboxInimigo = alvoDoProjetil.getHitboxMundo();
                                if (hitboxInimigo && colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                    // Marca o inimigo e o projétil para remoção.
                                    alvoDoProjetil.removivel = true;
                                    outroSprite.removivel = true;

                                    // --- LÓGICA DE RECOMPENSAS POR ABATE ---
                                    this.abatesParaVidaExtra++;
                                    console.log(`Abates para recompensa: ${this.abatesParaVidaExtra} / ${this.abatesNecessariosParaVidaExtra}`);
                                    // Verifica se atingiu a meta para a recompensa de vida extra.
                                    if (this.abatesParaVidaExtra >= this.abatesNecessariosParaVidaExtra) {
                                        console.log("META DE 30 ABATES ATINGIDA! Dando recompensa!");
                                        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.aumentarVidaMaxima === 'function') {
                                            this.jogadorPrincipal.aumentarVidaMaxima(5);
                                        }
                                        this.abatesParaVidaExtra = 0; // Reseta o contador.
                                    }
                                    
                                    // Incrementa o contador para o portão, se ele ainda não estiver liberado.
                                    if (!this.condicaoPortao4000Liberado) this.inimigosDerrotadosContador++;
                                    
                                    // Se o jogador não tem vida cheia e está antes do portão...
                                    if (jogador.vidas < jogador.maxVidas && !this.jogadorPassouPortao4000) {
                                        this.abatesDesdeUltimoCoracao++;
                                        // Verifica se atingiu a meta para dropar um coração.
                                        if (this.abatesDesdeUltimoCoracao >= this.abatesNecessariosPorCoracao) {
                                            // Lógica para criar o item de coração na posição do inimigo derrotado.
                                            let imgH = this.imgCoracaoHUD.naturalHeight||20, imgW = this.imgCoracaoHUD.naturalWidth||20;
                                            let pL = alvoDoProjetil.largura||50, pA = alvoDoProjetil.altura||50;
                                            let dropX = alvoDoProjetil.x + (pL/2) - (imgW/2);
                                            let dropY = alvoDoProjetil.y + (pA/2) - (imgH/2);
                                            var coracaoDrop = new CoracaoDropado(this.context, dropX, dropY, this.imgCoracaoHUD, this);
                                            this.novoSprite(coracaoDrop);
                                            this.abatesDesdeUltimoCoracao = 0; // Reseta o contador.
                                        }
                                    }
                                    break; // O projétil só pode atingir um alvo, então sai do loop interno.
                                }
                            }
                            // Se o alvo for o boss...
                            else if (alvoDoProjetil.tipo === 'boss' && !alvoDoProjetil.estaMorto) {
                                var hitboxBoss = alvoDoProjetil.getHitboxMundo();
                                if (hitboxBoss && colidemRetangulos(hitboxAguaBenta, hitboxBoss)) {
                                    // O boss recebe dano.
                                    if (typeof alvoDoProjetil.receberDano === 'function') alvoDoProjetil.receberDano(1);
                                    // O projétil é removido.
                                    outroSprite.removivel = true;
                                    break; // Sai do loop interno.
                                }
                            }
                        }
                    }
                }
                // --- Lógica de colisão do Jogador com Itens (Coração) ---
                else if (outroSprite.tipo === 'coracaoDropado') {
                    var hitboxCoracao = outroSprite.getHitboxMundo();
                    if (hitboxCoracao && colidemRetangulos(hitboxJogador, hitboxCoracao)) {
                        // O jogador ganha vida.
                        if (typeof jogador.ganharVida === 'function') jogador.ganharVida(1);
                        // O item é removido.
                        outroSprite.removivel = true;
                    }
                }
                // --- Lógica de colisão do Jogador com o Boss (dano por toque) ---
                else if (outroSprite.tipo === 'boss' && !outroSprite.estaMorto) {
                    var hitboxBoss = outroSprite.getHitboxMundo();
                    if (hitboxBoss && colidemRetangulos(hitboxJogador, hitboxBoss)) {
                        // (Lógica de dano por toque no boss pode ser adicionada aqui)
                        // if (typeof jogador.receberDano === 'function') jogador.receberDano();
                    }
                }
            }
        }
        
        // Remove todos os sprites marcados como 'removivel = true'.
        this.sprites = this.sprites.filter(sprite => sprite && !sprite.removivel);

        // Desenha todos os sprites que restaram.
        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && typeof this.sprites[i].desenhar === 'function') this.sprites[i].desenhar();
        }
        
        // Desenha o feedback do portão.
        this.desenharFeedbackPortao4000();
        // Restaura o estado do canvas, removendo a translação da câmera.
        this.context.restore();

        // HUD de Vidas do Jogador
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
            var ctx = this.context; ctx.save();
            // Tenta desenhar com a imagem do coração.
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xIni = 10, yCor = 10, lCor = this.imgCoracaoHUD.width || 20, aCor = this.imgCoracaoHUD.height || 20, espCor = 5;
                for (var k = 0; k < this.jogadorPrincipal.vidas; k++) {
                    ctx.drawImage(this.imgCoracaoHUD, xIni + (k * (lCor + espCor)), yCor, lCor, aCor);
                }
            } else {
                // Se a imagem não carregar, usa um texto como fallback.
                ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txtVidas = "";
                var numVidas = (this.jogadorPrincipal.vidas !== undefined) ? this.jogadorPrincipal.vidas : 0;
                for (var c = 0; c < numVidas; c++) txtVidas += "❤ "; ctx.fillText(txtVidas, 10, 30);
            }
            ctx.restore();
        }
        
        // HUD de Vida do Boss
        if (this.bossInstancia && !this.bossInstancia.estaMorto) {
            var ctxBossHUD = this.context; ctxBossHUD.save();
            let larguraTela = this.canvas.width; let larguraBarra = larguraTela * 0.5;
            let alturaBarra = 25; let xBarra = (larguraTela - larguraBarra) / 2;
            let yBarra = 15; let percentualVida = Math.max(0, this.bossInstancia.vidas / this.bossInstancia.maxVidas);
            // Desenha o fundo da barra.
            ctxBossHUD.fillStyle = '#333'; ctxBossHUD.fillRect(xBarra, yBarra, larguraBarra, alturaBarra);
            // Desenha a vida restante.
            ctxBossHUD.fillStyle = (percentualVida > 0.5) ? 'darkred' : ((percentualVida > 0.2) ? '#FF4500' : '#B22222');
            ctxBossHUD.fillRect(xBarra, yBarra, larguraBarra * percentualVida, alturaBarra);
            // Desenha a borda.
            ctxBossHUD.strokeStyle = 'black'; ctxBossHUD.lineWidth = 2; ctxBossHUD.strokeRect(xBarra, yBarra, larguraBarra, alturaBarra);
            // Desenha o texto da vida.
            ctxBossHUD.fillStyle = 'white'; ctxBossHUD.font = 'bold 16px Arial'; ctxBossHUD.textAlign = 'center';
            ctxBossHUD.shadowColor = "black"; ctxBossHUD.shadowBlur = 3;
            ctxBossHUD.fillText(`BOSS: ${this.bossInstancia.vidas} / ${this.bossInstancia.maxVidas}`, xBarra + larguraBarra / 2, yBarra + alturaBarra - 7);
            ctxBossHUD.restore();
        }

        // Agenda a chamada para o próximo quadro, criando o loop.
        requestAnimationFrame(() => this.proximoFrame());
    },

    /**
     * Função chamada quando o Boss é derrotado, mostrando a tela de vitória.
     */
    eventoBossDerrotado: function() {
        console.log("Animacao: Evento de Boss Derrotado Recebido!");
        // Para o loop do jogo.
        this.desligar();
        // Limpa a referência ao boss.
        this.bossInstancia = null;

        // Mostra a tela de vitória no HTML.
        const telaVitoriaElement = document.getElementById('tela-vitoria');
        if (telaVitoriaElement) {
            telaVitoriaElement.classList.remove('escondido');
        }
    },

    /**
     * Limpa toda a área visível do canvas.
     */
    limparTela: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

/**
 * Função auxiliar global para detectar colisão entre dois retângulos.
 */
function colidemRetangulos(ret1, ret2) {
    // Se um dos retângulos for nulo, não há colisão.
    if (!ret1 || !ret2) return false;
    // Fallback para valores nulos ou indefinidos.
    const r1x = ret1.x||0, r1w = ret1.largura||0, r1y = ret1.y||0, r1h = ret1.altura||0;
    const r2x = ret2.x||0, r2w = ret2.largura||0, r2y = ret2.y||0, r2h = ret2.altura||0;
    // A colisão ocorre se NÃO houver um eixo de separação entre os retângulos.
    return !(r1x + r1w < r2x || r1x > r2x + r2w || r1y + r1h < r2y || r1y > r2y + r2h);
}
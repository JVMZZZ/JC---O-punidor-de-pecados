// animacao.js
function Animacao(context, canvas) {
    this.context = context;
    this.canvas = canvas;
    this.sprites = [];
    this.ligado = false;
    this.ultimoTempo = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    
    this.mundoLargura = 5000;
    this.distanciaSpawnInimigo = 700; 

    this.jogadorPrincipal = null;
    this.cameraSuavizacao = 0.08;
    this.imgCoracaoHUD = null; // Usado para HUD e para dropar corações

    this.maxInimigos = 5; // Máximo de inimigos normais na tela (antes do boss)
    this.frequenciaSpawnInimigo = 5000; // Milissegundos
    this.tempoUltimoSpawnInimigo = 0;

    this.imgInimigo = null;
    this.imgInimigoLinhas = 1; // Ajuste conforme sua spritesheet de inimigo
    this.imgInimigoColunas = 4; // Ajuste

    this.distanciaMinimaEntreInimigos = 40; 

    // PROPRIEDADES PARA O PORTÃO/BARREIRA E CONDIÇÃO
    this.condicaoPortao4000Liberado = false;
    this.jogadorPassouPortao4000 = false;
    this.inimigosDerrotadosContador = 0; // Para liberar o portão
    this.totalInimigosParaLiberarPortao = 0; // Quantidade de abates para liberar o portão

    // PROPRIEDADES PARA DROP DE CORAÇÃO
    this.abatesDesdeUltimoCoracao = 0;
    this.abatesNecessariosPorCoracao = 3; // A cada X abates, dropa um coração

    // PROPRIEDADES PARA O BOSS
    this.imgBoss = null; 
    this.bossInstancia = null; 
    this.bossJaFoiSpawnado = false;
}

Animacao.prototype = {
    novoSprite: function(sprite, ehJogadorPrincipal = false) {
        this.sprites.push(sprite);
        if (ehJogadorPrincipal) {
            this.jogadorPrincipal = sprite;
        }
        if (sprite && typeof sprite.animacao === 'undefined') {
            sprite.animacao = this;
        }
    },

    ligar: function() {
        this.ultimoTempo = Date.now();
        this.tempoUltimoSpawnInimigo = Date.now(); // Inicializa timer de spawn
        this.ligado = true;
        this.proximoFrame();
    },

    desligar: function() {
        this.ligado = false;
    },

    atualizarCamera: function() {
        if (!this.jogadorPrincipal) return;

        const BARRIER_X_COORD = 4000;

        if (this.jogadorPassouPortao4000) {
            // CÂMERA FIXA APÓS PASSAR O PORTÃO
            this.cameraX = BARRIER_X_COORD;

            // Ajuste para garantir que a câmera não mostre além dos limites do mundo
            // se a área após a barreira for menor que a largura do canvas.
            if (this.mundoLargura - BARRIER_X_COORD < this.canvas.width) {
                // Se a área restante é pequena, câmera mostra o máximo à direita possível.
                this.cameraX = this.mundoLargura - this.canvas.width;
            }
             // Garante que a câmera não fique em posição negativa (caso extremo)
            this.cameraX = Math.max(0, this.cameraX);
            // E também não passe do limite direito do mundo (se BARRIER_X_COORD for muito perto do fim)
            this.cameraX = Math.min(this.cameraX, this.mundoLargura - this.canvas.width);


        } else {
            // Câmera com side-scrolling normal
            let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2) + (this.jogadorPrincipal.largura / 2);
            let suavizacaoAtual = this.cameraSuavizacao;

            let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * suavizacaoAtual;
            if (Math.abs(alvoCameraX - novaCameraX) < 0.5) novaCameraX = alvoCameraX; // Snap se perto
            this.cameraX = novaCameraX;

            // Limites gerais da câmera
            this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        }
        // this.cameraY = 0; // Y da câmera permanece fixo
    },

    tentarSpawnInimigo: function(tempoAtual) {
        // Não spawna inimigos normais se:
        // 1. O jogador já passou pelo portão (entrou na área do boss).
        // 2. O Boss já foi spawnado e ainda está ativo.
        if (this.jogadorPassouPortao4000 || (this.bossInstancia && !this.bossInstancia.removivel)) {
            return; 
        }

        if ((tempoAtual - this.tempoUltimoSpawnInimigo) < this.frequenciaSpawnInimigo) {
            return; 
        }
        this.tempoUltimoSpawnInimigo = tempoAtual;

        let inimigosVivos = this.sprites.filter(s => s && s.tipo === 'inimigo' && !s.removivel).length;
        if (inimigosVivos >= this.maxInimigos) {
            return;
        }

        if (!this.imgInimigo || !this.jogadorPrincipal || !this.imgInimigo.complete || this.imgInimigo.naturalHeight === 0) {
            // console.warn("[Animacao] Spawn de inimigo normal cancelado: assets não prontos ou jogador não definido.");
            return;
        }

        let spawnY = (this.jogadorPrincipal.posicaoChao !== undefined) 
                     ? this.jogadorPrincipal.posicaoChao 
                     : (this.canvas.height - 100); // Fallback para Y

        let playerX = this.jogadorPrincipal.x;
        let larguraEstimadaInimigo = (this.imgInimigoColunas > 0 && this.imgInimigo.naturalWidth > 0)
                                   ? this.imgInimigo.naturalWidth / this.imgInimigoColunas
                                   : 50; // Fallback
        
        let posicoesPossiveisX = [];
        const LIMITE_SPAWN_ANTES_PORTAO = 3950; // Não spawnar colado na barreira de 4000px

        let spawnEsquerdaX = playerX - this.distanciaSpawnInimigo;
        if (spawnEsquerdaX >= 0 && (spawnEsquerdaX + larguraEstimadaInimigo) < LIMITE_SPAWN_ANTES_PORTAO) {
            posicoesPossiveisX.push(spawnEsquerdaX);
        }

        let spawnDireitaX = playerX + this.distanciaSpawnInimigo;
        // Garante que o spawn à direita também respeite o limite antes do portão
        if (spawnDireitaX >= 0 && (spawnDireitaX + larguraEstimadaInimigo) < LIMITE_SPAWN_ANTES_PORTAO) {
             posicoesPossiveisX.push(spawnDireitaX);
        }

        if (posicoesPossiveisX.length > 0) {
            let spawnX = posicoesPossiveisX[Math.floor(Math.random() * posicoesPossiveisX.length)];
            var novoInimigo = new Inimigo(this.context, spawnX, spawnY, this.jogadorPrincipal, this, this.canvas, this.imgInimigo, this.imgInimigoLinhas, this.imgInimigoColunas);
            this.novoSprite(novoInimigo);
        }
    },
    
    aplicarSeparacaoInimigos: function() {
        // Só aplica se o jogador não passou o portão e se não há boss ativo (onde não haverá inimigos normais)
        if (this.jogadorPassouPortao4000 || (this.bossInstancia && !this.bossInstancia.removivel)) return;

        let inimigos = this.sprites.filter(sprite => sprite && sprite.tipo === 'inimigo' && !sprite.removivel);
        for (let i = 0; i < inimigos.length; i++) {
            for (let j = i + 1; j < inimigos.length; j++) {
                let inimigoA = inimigos[i]; let inimigoB = inimigos[j];
                let la = inimigoA.largura || 50; let ha = inimigoA.altura || 50; // Fallbacks
                let lb = inimigoB.largura || 50; let hb = inimigoB.altura || 50;
                let caX = inimigoA.x + la/2; let caY = inimigoA.y + ha/2;
                let cbX = inimigoB.x + lb/2; let cbY = inimigoB.y + hb/2;
                let dx = cbX - caX; let dy = cbY - caY;
                let dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < this.distanciaMinimaEntreInimigos && dist > 0) {
                    let sobreposicao = this.distanciaMinimaEntreInimigos - dist;
                    let normDx = dx/dist; let normDy = dy/dist;
                    let mover = sobreposicao/2;
                    inimigoA.x -= normDx * mover; inimigoA.y -= normDy * mover;
                    inimigoB.x += normDx * mover; inimigoB.y += normDy * mover;
                    // Clamping para os limites do mundo
                    inimigoA.x = Math.max(0, Math.min(inimigoA.x, this.mundoLargura - la));
                    inimigoB.x = Math.max(0, Math.min(inimigoB.x, this.mundoLargura - lb));
                    // Adicionar clamping para Y se os inimigos tiverem limites verticais
                }
            }
        }
    },

    verificarCondicaoPortao4000: function() {
        if (this.condicaoPortao4000Liberado) return; 
        if (this.inimigosDerrotadosContador >= this.totalInimigosParaLiberarPortao) {
            this.condicaoPortao4000Liberado = true;
            console.log("CONDIÇÃO DO PORTÃO 4000 CUMPRIDA! Portão liberado.");
            // Tocar som de portão aqui, se desejar
        }
    },

    desenharFeedbackPortao4000: function() {
        if (this.jogadorPassouPortao4000) return; // Não desenha se já passou

        const BARRIER_X_COORD = 4000;
        const ALTURA_PAREDE = this.canvas.height;
        const LARGURA_PAREDE = 20; // Largura da "parede" visual

        // Verifica se a parede está visível na câmera
        if (BARRIER_X_COORD + LARGURA_PAREDE / 2 < this.cameraX || 
            BARRIER_X_COORD - LARGURA_PAREDE / 2 > this.cameraX + this.canvas.width) {
            return; 
        }
        
        let xDesenhoParede = BARRIER_X_COORD; 
        this.context.save();

        if (this.condicaoPortao4000Liberado) {
            // Portão aberto: mostra apenas texto "CAMINHO LIVRE"
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) { // Se perto
                this.context.fillStyle = 'lightgreen';
                this.context.font = 'bold 20px Arial';
                this.context.textAlign = 'center';
                this.context.shadowColor = "black";
                this.context.shadowBlur = 4;
                this.context.fillText("CAMINHO LIVRE!", xDesenhoParede, 50);
                this.context.shadowColor = "transparent"; // Reseta sombra
            }
        } else {
            // Portão fechado: desenha a parede
            this.context.fillStyle = '#4A4A4A'; 
            this.context.strokeStyle = '#202020'; 
            this.context.lineWidth = 3;
            this.context.fillRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, ALTURA_PAREDE);
            this.context.strokeRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, ALTURA_PAREDE);

            // Detalhes visuais simples na parede
            this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.context.lineWidth = 1;
            const numLinhasVert = 3;
            const espLinhas = LARGURA_PAREDE / (numLinhasVert + 1);
            for (let i = 1; i <= numLinhasVert; i++) {
                let xLinha = xDesenhoParede - LARGURA_PAREDE / 2 + (i * espLinhas);
                this.context.beginPath(); this.context.moveTo(xLinha, 0); this.context.lineTo(xLinha, ALTURA_PAREDE); this.context.stroke();
            }
            
            // Texto de status do portão
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) { // Se perto
                let inimigosFaltantes = Math.max(0, this.totalInimigosParaLiberarPortao - this.inimigosDerrotadosContador);
                let textoStatus = `BARREIRA ATIVA!\nDerrote ${inimigosFaltantes} inimigos.`;
                if (inimigosFaltantes === 1) textoStatus = `BARREIRA ATIVA!\nDerrote mais 1 inimigo.`;
                else if (inimigosFaltantes === 0 && !this.condicaoPortao4000Liberado) textoStatus = `BARREIRA ATIVA!\nProcessando...`;

                this.context.fillStyle = 'white'; this.context.font = 'bold 16px Arial';
                this.context.textAlign = 'center'; this.context.shadowColor = "black"; this.context.shadowBlur = 5;
                const lineHeight = 20; const lines = textoStatus.split('\n');
                for (let j = 0; j < lines.length; j++) this.context.fillText(lines[j], xDesenhoParede, 40 + (j * lineHeight));
                this.context.shadowColor = "transparent"; // Reseta sombra
            }
        }
        this.context.restore();
    },

    spawnBoss: function() {
        if (!this.imgBoss || !this.imgBoss.complete || this.imgBoss.naturalHeight === 0) {
            console.warn("Animacao: Imagem do Boss (this.imgBoss) não carregada ou inválida. Boss não pode ser spawnado.");
            return;
        }
        // Posição de spawn do Boss
        const spawnXBoss = 4400; // Ex: Um pouco depois do portão de 4000
        const alturaBoss = 120; // Altura estimada do Boss para posicionamento Y (ajuste com a real)
        const spawnYBoss = (this.jogadorPrincipal && this.jogadorPrincipal.posicaoChao !== undefined) 
                           ? (this.jogadorPrincipal.posicaoChao - alturaBoss + (this.jogadorPrincipal.altura || 0)) // Tenta alinhar bases
                           : (this.canvas.height - alturaBoss - 20); // Fallback (20px do chão)

        this.bossInstancia = new Boss(this.context, spawnXBoss, spawnYBoss, this.imgBoss, this);
        this.novoSprite(this.bossInstancia);
        this.bossJaFoiSpawnado = true; 
        console.log("EVENTO: BOSS SPAWNADO!");
    },

    ativarEfeitosPortao4000: function() {
        console.log("ATIVANDO EFEITOS DO PORTÃO 4000! Eliminando inimigos normais...");
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let sprite = this.sprites[i];
            // Garante que só remove inimigos normais, não o jogador, corações dropados ou o futuro boss.
            if (sprite && sprite.tipo === 'inimigo' && !sprite.removivel) {
                sprite.removivel = true;
            }
        }
    },

    eventoBossDerrotado: function() {
        console.log("Animacao: Evento de Boss Derrotado Recebido!");
        this.bossInstancia = null; // Limpa a referência
        alert("VOCÊ VENCEU O BOSS! PARABÉNS!");
        // this.desligar(); // Exemplo: para o loop do jogo
        // Ou carrega a próxima fase, etc.
    },

    proximoFrame: function() {
        if (!this.ligado) return;

        var agora = Date.now();
        var deltaTime = (agora - this.ultimoTempo) / 1000.0;
        this.ultimoTempo = agora; 

        this.verificarCondicaoPortao4000();
        let estavaAntesDoPortao = !this.jogadorPassouPortao4000;
        
        this.tentarSpawnInimigo(agora); 

        for (var i = 0; i < this.sprites.length; i++) {
            const spriteAtual = this.sprites[i];
            if (spriteAtual && typeof spriteAtual.atualizar === 'function') {
                spriteAtual.atualizar(deltaTime); // JC.atualizar pode setar this.animacao.jogadorPassouPortao4000
            }
        }
        
        if (estavaAntesDoPortao && this.jogadorPassouPortao4000) {
            this.ativarEfeitosPortao4000();
        }

        if (this.jogadorPassouPortao4000 && !this.bossJaFoiSpawnado && !this.bossInstancia) {
            this.spawnBoss();
        }
        
        this.atualizarCamera(); 
        this.limparTela();

        this.context.save();
        this.context.translate(-this.cameraX, -this.cameraY);
        
        this.aplicarSeparacaoInimigos();

        var jogador = this.jogadorPrincipal;
        if (jogador && !jogador.estaMorto && typeof jogador.getHitboxMundo === 'function') {
            var hitboxJogador = jogador.getHitboxMundo();

            for (var i = this.sprites.length - 1; i >= 0; i--) { // Iterar de trás para frente ao remover
                var outroSprite = this.sprites[i];
                if (!outroSprite || outroSprite === jogador || !outroSprite.getHitboxMundo || !outroSprite.tipo) {
                    continue;
                }
                
                if (outroSprite.tipo === 'inimigo' || outroSprite.tipo === 'laserInimigo') {
                    var hitboxOutro = outroSprite.getHitboxMundo();
                    if (hitboxOutro && colidemRetangulos(hitboxJogador, hitboxOutro)) {
                        if (typeof jogador.receberDano === 'function') jogador.receberDano();
                        if (outroSprite.tipo === 'laserInimigo') outroSprite.removivel = true;
                    }
                } 
                else if (outroSprite.tipo === 'aguaBenta') {
                    var hitboxAguaBenta = outroSprite.getHitboxMundo();
                    if (!hitboxAguaBenta) continue;

                    for (var j = this.sprites.length - 1; j >= 0; j--) {
                         if (i === j) continue; 
                        var alvoDoProjetil = this.sprites[j];

                        // AguaBenta vs Inimigo Normal
                        if (alvoDoProjetil && alvoDoProjetil.tipo === 'inimigo' && !alvoDoProjetil.removivel && alvoDoProjetil.getHitboxMundo) {
                            var hitboxInimigo = alvoDoProjetil.getHitboxMundo();
                            if (hitboxInimigo && colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                alvoDoProjetil.removivel = true; 
                                outroSprite.removivel = true; 

                                if (!this.condicaoPortao4000Liberado) this.inimigosDerrotadosContador++;
                                if (this.jogadorPrincipal && this.jogadorPrincipal.vidas < this.jogadorPrincipal.maxVidas && !this.jogadorPassouPortao4000) {
                                    this.abatesDesdeUltimoCoracao++;
                                    if (this.abatesDesdeUltimoCoracao >= this.abatesNecessariosPorCoracao) {
                                        if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalWidth > 0) {
                                            let imgH = this.imgCoracaoHUD.naturalHeight||20; let imgW = this.imgCoracaoHUD.naturalWidth||20;
                                            let pInimigoL = alvoDoProjetil.largura || 50; let pInimigoA = alvoDoProjetil.altura || 50;
                                            let dropX = alvoDoProjetil.x + (pInimigoL / 2) - (imgW / 2);
                                            let dropY = alvoDoProjetil.y + (pInimigoA / 2) - (imgH / 2);
                                            dropX = Math.max(10, Math.min(dropX, this.mundoLargura - imgW - 10));
                                            dropY = Math.max(10, Math.min(dropY, this.canvas.height - imgH - 10));
                                            var coracaoDrop = new CoracaoDropado(this.context, dropX, dropY, this.imgCoracaoHUD, this);
                                            this.novoSprite(coracaoDrop);
                                            this.abatesDesdeUltimoCoracao = 0; 
                                        }
                                    }
                                }
                                break; 
                            }
                        }
                        // AguaBenta vs Boss
                        else if (alvoDoProjetil && alvoDoProjetil.tipo === 'boss' && !alvoDoProjetil.estaMorto && alvoDoProjetil.getHitboxMundo) {
                            var hitboxBoss = alvoDoProjetil.getHitboxMundo();
                            if (hitboxBoss && colidemRetangulos(hitboxAguaBenta, hitboxBoss)) {
                                if (typeof alvoDoProjetil.receberDano === 'function') alvoDoProjetil.receberDano(1);
                                outroSprite.removivel = true; // AguaBenta some
                                break; 
                            }
                        }
                    }
                }
                else if (outroSprite.tipo === 'coracaoDropado') {
                    var hitboxCoracao = outroSprite.getHitboxMundo();
                    if (hitboxCoracao && colidemRetangulos(hitboxJogador, hitboxCoracao)) {
                        if (typeof jogador.ganharVida === 'function') jogador.ganharVida(1);
                        outroSprite.removivel = true;
                    }
                }
                else if (outroSprite.tipo === 'boss' && !outroSprite.estaMorto) { 
                    var hitboxBoss = outroSprite.getHitboxMundo();
                    if (hitboxBoss && colidemRetangulos(hitboxJogador, hitboxBoss)) {
                        // if (typeof jogador.receberDano === 'function') jogador.receberDano(); // Dano por toque no Boss
                    }
                }
            }
        }

        this.sprites = this.sprites.filter(sprite => sprite && !sprite.removivel);

        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && typeof this.sprites[i].desenhar === 'function') this.sprites[i].desenhar();
        }
        this.desenharFeedbackPortao4000();
        this.context.restore();

        // HUD
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
            var ctx = this.context; ctx.save();
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xIni = 10, yCor = 10, lCor = this.imgCoracaoHUD.width || 20, aCor = this.imgCoracaoHUD.height || 20, espCor = 5;
                for (var k = 0; k < this.jogadorPrincipal.vidas; k++) {
                    ctx.drawImage(this.imgCoracaoHUD, xIni + (k * (lCor + espCor)), yCor, lCor, aCor);
                }
            } else { 
                ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txt = "";
                var numV = (this.jogadorPrincipal.vidas !== undefined) ? this.jogadorPrincipal.vidas : 0;
                for (var c = 0; c < numV; c++) txt += "❤ "; ctx.fillText(txt, 10, 30);
            }
            ctx.restore();
        }
        requestAnimationFrame(() => this.proximoFrame());
    },

    limparTela: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

function colidemRetangulos(ret1, ret2) {
    if (!ret1 || !ret2) return false;
    const r1x = ret1.x||0; const r1w = ret1.largura||0; const r1y = ret1.y||0; const r1h = ret1.altura||0;
    const r2x = ret2.x||0; const r2w = ret2.largura||0; const r2y = ret2.y||0; const r2h = ret2.altura||0;
    return !(r1x + r1w < r2x || r1x > r2x + r2w || r1y + r1h < r2y || r1y > r2y + r2h);
}
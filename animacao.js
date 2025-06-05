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

    this.maxInimigos = 5; 
    this.frequenciaSpawnInimigo = 5000;
    this.tempoUltimoSpawnInimigo = 0;

    this.imgInimigo = null;
    this.imgInimigoLinhas = 1; // Ajuste conforme sua spritesheet
    this.imgInimigoColunas = 4; // Ajuste

    this.distanciaMinimaEntreInimigos = 40; 

    // Propriedades para o Portão/Barreira e sua Condição
    this.condicaoPortao4000Liberado = false;
    this.jogadorPassouPortao4000 = false;
    this.inimigosDerrotadosContador = 0;
    this.totalInimigosParaLiberarPortao = 5; // Abates para liberar o portão

    // Propriedades para o Drop de Corações
    this.abatesDesdeUltimoCoracao = 0;
    this.abatesNecessariosPorCoracao = 3; 

    // Propriedades para o Boss
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
        this.tempoUltimoSpawnInimigo = Date.now();
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
            // Câmera fica fixa após passar o portão, mostrando a arena do Boss
            this.cameraX = BARRIER_X_COORD;

            // Garante que a câmera não mostre além dos limites do mundo
            this.cameraX = Math.min(this.cameraX, this.mundoLargura - this.canvas.width);
            this.cameraX = Math.max(0, this.cameraX);
        } else {
            // Câmera com side-scrolling normal, seguindo o jogador
            let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2) + (this.jogadorPrincipal.largura / 2);
            let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * this.cameraSuavizacao;
            if (Math.abs(alvoCameraX - novaCameraX) < 0.5) novaCameraX = alvoCameraX;
            this.cameraX = novaCameraX;

            this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        }
    },

    tentarSpawnInimigo: function(tempoAtual) {
        // Não spawna inimigos normais se o jogador já passou para a área do Boss
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
            return;
        }

        let spawnY = (this.jogadorPrincipal.posicaoChao !== undefined) ? this.jogadorPrincipal.posicaoChao : (this.canvas.height - 100);
        let playerX = this.jogadorPrincipal.x;
        let larguraEstimadaInimigo = (this.imgInimigoColunas > 0 && this.imgInimigo.naturalWidth > 0) ? this.imgInimigo.naturalWidth / this.imgInimigoColunas : 50;
        
        const LIMITE_SPAWN_ANTES_PORTAO = 3950;
        let posicoesPossiveisX = [];
        
        let spawnEsquerdaX = playerX - this.distanciaSpawnInimigo;
        if (spawnEsquerdaX >= 0 && (spawnEsquerdaX + larguraEstimadaInimigo) < LIMITE_SPAWN_ANTES_PORTAO) {
            posicoesPossiveisX.push(spawnEsquerdaX);
        }
        let spawnDireitaX = playerX + this.distanciaSpawnInimigo;
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
        if (this.jogadorPassouPortao4000 || (this.bossInstancia && !this.bossInstancia.removivel)) return;

        let inimigos = this.sprites.filter(s => s && s.tipo === 'inimigo' && !s.removivel);
        for (let i = 0; i < inimigos.length; i++) {
            for (let j = i + 1; j < inimigos.length; j++) {
                let inimigoA = inimigos[i], inimigoB = inimigos[j];
                let la = inimigoA.largura || 50, ha = inimigoA.altura || 50;
                let lb = inimigoB.largura || 50, hb = inimigoB.altura || 50;
                let caX = inimigoA.x + la/2, caY = inimigoA.y + ha/2;
                let cbX = inimigoB.x + lb/2, cbY = inimigoB.y + hb/2;
                let dx = cbX - caX, dy = cbY - caY;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < this.distanciaMinimaEntreInimigos && dist > 0) {
                    let mover = (this.distanciaMinimaEntreInimigos - dist)/2;
                    let normDx = dx/dist, normDy = dy/dist;
                    inimigoA.x -= normDx * mover; inimigoA.y -= normDy * mover;
                    inimigoB.x += normDx * mover; inimigoB.y += normDy * mover;
                    inimigoA.x = Math.max(0, Math.min(inimigoA.x, this.mundoLargura - la));
                    inimigoB.x = Math.max(0, Math.min(inimigoB.x, this.mundoLargura - lb));
                }
            }
        }
    },

    verificarCondicaoPortao4000: function() {
        if (this.condicaoPortao4000Liberado) return; 
        if (this.inimigosDerrotadosContador >= this.totalInimigosParaLiberarPortao) {
            this.condicaoPortao4000Liberado = true;
            console.log("CONDIÇÃO DO PORTÃO 4000 CUMPRIDA! Portão liberado.");
        }
    },

    desenharFeedbackPortao4000: function() {
        if (this.jogadorPassouPortao4000) return;

        const BARRIER_X_COORD = 4000;
        const LARGURA_PAREDE = 20;

        if (BARRIER_X_COORD + LARGURA_PAREDE / 2 < this.cameraX || 
            BARRIER_X_COORD - LARGURA_PAREDE / 2 > this.cameraX + this.canvas.width) {
            return; 
        }
        
        let xDesenhoParede = BARRIER_X_COORD; 
        this.context.save();

        if (this.condicaoPortao4000Liberado) {
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) {
                this.context.fillStyle = 'lightgreen'; this.context.font = 'bold 20px Arial';
                this.context.textAlign = 'center'; this.context.shadowColor = "black";
                this.context.shadowBlur = 4; this.context.fillText("CAMINHO LIVRE!", xDesenhoParede, 50);
                this.context.shadowColor = "transparent";
            }
        } else {
            this.context.fillStyle = '#4A4A4A'; this.context.strokeStyle = '#202020'; 
            this.context.lineWidth = 3;
            this.context.fillRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, this.canvas.height);
            this.context.strokeRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, this.canvas.height);

            this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)'; this.context.lineWidth = 1;
            const numLinhasV = 3; const espLinhas = LARGURA_PAREDE / (numLinhasV + 1);
            for (let i = 1; i <= numLinhasV; i++) {
                let xLinha = xDesenhoParede - LARGURA_PAREDE / 2 + (i * espLinhas);
                this.context.beginPath(); this.context.moveTo(xLinha, 0); this.context.lineTo(xLinha, this.canvas.height); this.context.stroke();
            }
            
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
        this.context.restore();
    },

    spawnBoss: function() {
        if (!this.imgBoss || !this.imgBoss.complete || this.imgBoss.naturalHeight === 0) {
            console.warn("Animacao: Imagem do Boss (this.imgBoss) não carregada ou inválida. Boss não pode ser spawnado.");
            return;
        }
        
        const spawnXBoss = 4400;
        const alturaBoss = 120; // Ajuste com a altura real do seu boss
        const spawnYBoss = (this.jogadorPrincipal && this.jogadorPrincipal.posicaoChao !== undefined) 
                           ? (this.jogadorPrincipal.posicaoChao - alturaBoss + (this.jogadorPrincipal.altura || 0)) 
                           : (this.canvas.height - alturaBoss - 20);

        this.bossInstancia = new Boss(this.context, spawnXBoss, spawnYBoss, this.imgBoss, this, this.jogadorPrincipal, this.canvas);
        
        this.novoSprite(this.bossInstancia);
        this.bossJaFoiSpawnado = true;
        console.log("EVENTO: BOSS SPAWNADO!");
    },

    ativarEfeitosPortao4000: function() {
        console.log("ATIVANDO EFEITOS DO PORTÃO 4000! Eliminando inimigos normais...");
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let sprite = this.sprites[i];
            if (sprite && sprite.tipo === 'inimigo') {
                sprite.removivel = true;
            }
        }
    },

    eventoBossDerrotado: function() {
        console.log("Animacao: Evento de Boss Derrotado Recebido!");
        this.bossInstancia = null;
        alert("VOCÊ VENCEU O BOSS! PARABÉNS!");
        // this.desligar(); 
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
                spriteAtual.atualizar(deltaTime);
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

        // Lógica de Colisão
        var jogador = this.jogadorPrincipal;
        if (jogador && !jogador.estaMorto && typeof jogador.getHitboxMundo === 'function') {
            var hitboxJogador = jogador.getHitboxMundo();
            for (var i = this.sprites.length - 1; i >= 0; i--) { 
                var outroSprite = this.sprites[i];
                if (!outroSprite || outroSprite === jogador || typeof outroSprite.getHitboxMundo !== 'function' || !outroSprite.tipo) continue;
                
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

                        if (alvoDoProjetil && !alvoDoProjetil.removivel && typeof alvoDoProjetil.getHitboxMundo === 'function') {
                            if (alvoDoProjetil.tipo === 'inimigo') {
                                var hitboxInimigo = alvoDoProjetil.getHitboxMundo();
                                if (hitboxInimigo && colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                    alvoDoProjetil.removivel = true; 
                                    outroSprite.removivel = true; 

                                    if (!this.condicaoPortao4000Liberado) this.inimigosDerrotadosContador++;
                                    if (this.jogadorPrincipal.vidas < this.jogadorPrincipal.maxVidas && !this.jogadorPassouPortao4000) {
                                        this.abatesDesdeUltimoCoracao++;
                                        if (this.abatesDesdeUltimoCoracao >= this.abatesNecessariosPorCoracao) {
                                            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete) {
                                                let imgH = this.imgCoracaoHUD.naturalHeight||20, imgW = this.imgCoracaoHUD.naturalWidth||20;
                                                let pL = alvoDoProjetil.largura||50, pA = alvoDoProjetil.altura||50;
                                                let dropX = alvoDoProjetil.x + (pL/2) - (imgW/2);
                                                let dropY = alvoDoProjetil.y + (pA/2) - (imgH/2);
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
                            } else if (alvoDoProjetil.tipo === 'boss' && !alvoDoProjetil.estaMorto) {
                                var hitboxBoss = alvoDoProjetil.getHitboxMundo();
                                if (hitboxBoss && colidemRetangulos(hitboxAguaBenta, hitboxBoss)) {
                                    if (typeof alvoDoProjetil.receberDano === 'function') alvoDoProjetil.receberDano(1);
                                    outroSprite.removivel = true;
                                    break; 
                                }
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
                        // if (typeof jogador.receberDano === 'function') jogador.receberDano(); // Dano por toque
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

        // HUD do Jogador
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
            var ctx = this.context; ctx.save();
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xIni = 10, yCor = 10, lCor = this.imgCoracaoHUD.width || 20, aCor = this.imgCoracaoHUD.height || 20, espCor = 5;
                for (var k = 0; k < this.jogadorPrincipal.vidas; k++) {
                    ctx.drawImage(this.imgCoracaoHUD, xIni + (k * (lCor + espCor)), yCor, lCor, aCor);
                }
            } else { 
                ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txtVidas = "";
                var numVidas = (this.jogadorPrincipal.vidas !== undefined) ? this.jogadorPrincipal.vidas : 0;
                for (var c = 0; c < numVidas; c++) txtVidas += "❤ "; ctx.fillText(txtVidas, 10, 30);
            }
            ctx.restore();
        }
        
        // HUD do Boss
        if (this.bossInstancia && !this.bossInstancia.estaMorto) {
            var ctxBossHUD = this.context; ctxBossHUD.save();
            let larguraTela = this.canvas.width; let larguraBarra = larguraTela * 0.5;
            let alturaBarra = 25; let xBarra = (larguraTela - larguraBarra) / 2;
            let yBarra = 15; let percentualVida = Math.max(0, this.bossInstancia.vidas / this.bossInstancia.maxVidas);
            ctxBossHUD.fillStyle = '#333'; ctxBossHUD.fillRect(xBarra, yBarra, larguraBarra, alturaBarra);
            ctxBossHUD.fillStyle = (percentualVida > 0.5) ? 'darkred' : ((percentualVida > 0.2) ? '#FF4500' : '#B22222');
            ctxBossHUD.fillRect(xBarra, yBarra, larguraBarra * percentualVida, alturaBarra);
            ctxBossHUD.strokeStyle = 'black'; ctxBossHUD.lineWidth = 2; ctxBossHUD.strokeRect(xBarra, yBarra, larguraBarra, alturaBarra);
            ctxBossHUD.fillStyle = 'white'; ctxBossHUD.font = 'bold 16px Arial'; ctxBossHUD.textAlign = 'center';
            ctxBossHUD.shadowColor = "black"; ctxBossHUD.shadowBlur = 3;
            ctxBossHUD.fillText(`BOSS: ${this.bossInstancia.vidas} / ${this.bossInstancia.maxVidas}`, xBarra + larguraBarra / 2, yBarra + alturaBarra - 7);
            ctxBossHUD.restore();
        }

        requestAnimationFrame(() => this.proximoFrame());
    },

    limparTela: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

function colidemRetangulos(ret1, ret2) {
    if (!ret1 || !ret2) return false;
    const r1x = ret1.x||0, r1w = ret1.largura||0, r1y = ret1.y||0, r1h = ret1.altura||0;
    const r2x = ret2.x||0, r2w = ret2.largura||0, r2y = ret2.y||0, r2h = ret2.altura||0;
    return !(r1x + r1w < r2x || r1x > r2x + r2w || r1y + r1h < r2y || r1y > r2y + r2h);
}
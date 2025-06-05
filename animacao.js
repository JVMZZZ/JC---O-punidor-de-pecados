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
    this.imgCoracaoHUD = null; // Será usado para dropar corações também

    this.maxInimigos = 5;
    this.frequenciaSpawnInimigo = 5000;
    this.tempoUltimoSpawnInimigo = 0;

    this.imgInimigo = null;
    this.imgInimigoLinhas = 1;
    this.imgInimigoColunas = 4;

    this.distanciaMinimaEntreInimigos = 40; 

    // PROPRIEDADES PARA O PORTÃO/BARREIRA E CONDIÇÃO
    this.condicaoPortao4000Liberado = false;
    this.jogadorPassouPortao4000 = false;
    this.inimigosDerrotadosContador = 0; // Para o portão
    this.totalInimigosParaLiberarPortao = 5; 

    // NOVAS PROPRIEDADES PARA DROP DE CORAÇÃO
    this.abatesDesdeUltimoCoracao = 0;
    this.abatesNecessariosPorCoracao = 3;
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
            this.cameraX = BARRIER_X_COORD;
            if (this.mundoLargura - BARRIER_X_COORD < this.canvas.width && BARRIER_X_COORD <= this.mundoLargura - this.canvas.width) {
                 this.cameraX = this.mundoLargura - this.canvas.width;
            } else if (BARRIER_X_COORD > this.mundoLargura - this.canvas.width) {
                 this.cameraX = Math.max(0, this.mundoLargura - this.canvas.width);
            }
            this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        } else {
            let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2) + (this.jogadorPrincipal.largura / 2);
            let suavizacaoAtual = this.cameraSuavizacao;
            let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * suavizacaoAtual;
            if (Math.abs(alvoCameraX - novaCameraX) < 0.5) novaCameraX = alvoCameraX;
            this.cameraX = novaCameraX;
            this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        }
    },

    tentarSpawnInimigo: function(tempoAtual) {
        if (this.jogadorPassouPortao4000) return; 
        if ((tempoAtual - this.tempoUltimoSpawnInimigo) < this.frequenciaSpawnInimigo) return; 
        this.tempoUltimoSpawnInimigo = tempoAtual;
        let inimigosVivos = this.sprites.filter(s => s && s.tipo === 'inimigo' && !s.removivel).length;
        if (inimigosVivos >= this.maxInimigos) return;
        if (!this.imgInimigo || !this.jogadorPrincipal || !this.imgInimigo.complete || this.imgInimigo.naturalHeight === 0) return;

        let spawnY = (this.jogadorPrincipal.posicaoChao !== undefined) ? this.jogadorPrincipal.posicaoChao : (this.canvas.height - 100);
        let playerX = this.jogadorPrincipal.x;
        let larguraEstimadaInimigo = (this.imgInimigoColunas > 0) ? this.imgInimigo.naturalWidth / this.imgInimigoColunas : 50;
        
        let posicoesPossiveisX = [];
        let spawnEsquerdaX = playerX - this.distanciaSpawnInimigo;
        if (spawnEsquerdaX >= 0 && (spawnEsquerdaX + larguraEstimadaInimigo) < 3950) { // Não spawna muito perto da barreira (3950)
            posicoesPossiveisX.push(spawnEsquerdaX);
        }
        let spawnDireitaX = playerX + this.distanciaSpawnInimigo;
        if (spawnDireitaX >= 0 && (spawnDireitaX + larguraEstimadaInimigo) < 3950) {
             posicoesPossiveisX.push(spawnDireitaX);
        }

        if (posicoesPossiveisX.length > 0) {
            let spawnX = posicoesPossiveisX[Math.floor(Math.random() * posicoesPossiveisX.length)];
            var novoInimigo = new Inimigo(this.context, spawnX, spawnY, this.jogadorPrincipal, this, this.canvas, this.imgInimigo, this.imgInimigoLinhas, this.imgInimigoColunas);
            this.novoSprite(novoInimigo);
        }
    },

    aplicarSeparacaoInimigos: function() {
        if (this.jogadorPassouPortao4000) return;
        // ... (código de separação como antes, mas pode ser otimizado ou simplificado se necessário) ...
        let inimigos = this.sprites.filter(sprite => sprite && sprite.tipo === 'inimigo' && !sprite.removivel);
        for (let i = 0; i < inimigos.length; i++) {
            for (let j = i + 1; j < inimigos.length; j++) {
                let inimigoA = inimigos[i]; let inimigoB = inimigos[j];
                let la = inimigoA.largura || 50; let ha = inimigoA.altura || 50;
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
        const ALTURA_PAREDE = this.canvas.height;
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
            this.context.fillRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, ALTURA_PAREDE);
            this.context.strokeRect(xDesenhoParede - LARGURA_PAREDE / 2, 0, LARGURA_PAREDE, ALTURA_PAREDE);
            this.context.strokeStyle = 'rgba(0, 0, 0, 0.3)'; this.context.lineWidth = 1;
            const numLinhasV = 3; const espLinhas = LARGURA_PAREDE / (numLinhasV + 1);
            for (let i = 1; i <= numLinhasV; i++) {
                let xL = xDesenhoParede - LARGURA_PAREDE / 2 + (i * espLinhas);
                this.context.beginPath(); this.context.moveTo(xL, 0); this.context.lineTo(xL, ALTURA_PAREDE); this.context.stroke();
            }
            if (this.jogadorPrincipal && Math.abs(this.jogadorPrincipal.x - BARRIER_X_COORD) < 400) {
                let inimigosFaltantes = Math.max(0, this.totalInimigosParaLiberarPortao - this.inimigosDerrotadosContador);
                let txt = `BARREIRA ATIVA!\nDerrote ${inimigosFaltantes} inimigos.`;
                if (inimigosFaltantes === 1) txt = `BARREIRA ATIVA!\nDerrote mais 1 inimigo.`;
                else if (inimigosFaltantes === 0 && !this.condicaoPortao4000Liberado) txt = `BARREIRA ATIVA!\nProcessando...`;
                this.context.fillStyle = 'white'; this.context.font = 'bold 16px Arial'; this.context.textAlign = 'center';
                this.context.shadowColor = "black"; this.context.shadowBlur = 5;
                const lineHeight = 20; const lines = txt.split('\n');
                for (let j = 0; j < lines.length; j++) this.context.fillText(lines[j], xDesenhoParede, 40 + (j * lineHeight));
                this.context.shadowColor = "transparent";
            }
        }
        this.context.restore();
    },

    ativarEfeitosPortao4000: function() {
        console.log("ATIVANDO EFEITOS DO PORTÃO 4000! Eliminando inimigos...");
        for (let i = 0; i < this.sprites.length; i++) {
            let sprite = this.sprites[i];
            if (sprite && sprite.tipo === 'inimigo' && !sprite.removivel) {
                sprite.removivel = true;
            }
        }
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

        this.atualizarCamera(); 
        this.limparTela();

        this.context.save();
        this.context.translate(-this.cameraX, -this.cameraY);
        
        this.aplicarSeparacaoInimigos();

        var jogador = this.jogadorPrincipal;
        if (jogador && !jogador.estaMorto && jogador.getHitboxMundo) {
            var hitboxJogador = jogador.getHitboxMundo();
            for (var i = this.sprites.length - 1; i >= 0; i--) {
                var outroSprite = this.sprites[i];
                if (!outroSprite || outroSprite === jogador || !outroSprite.getHitboxMundo || !outroSprite.tipo) continue;
                
                if (outroSprite.tipo === 'inimigo' || outroSprite.tipo === 'laserInimigo') {
                    var hitboxOutro = outroSprite.getHitboxMundo();
                    if (hitboxOutro && colidemRetangulos(hitboxJogador, hitboxOutro)) {
                        if (typeof jogador.receberDano === 'function') jogador.receberDano();
                        if (outroSprite.tipo === 'laserInimigo') outroSprite.removivel = true;
                    }
                } else if (outroSprite.tipo === 'aguaBenta') {
                    var hitboxAguaBenta = outroSprite.getHitboxMundo();
                    if (!hitboxAguaBenta) continue;
                    for (var j = this.sprites.length - 1; j >= 0; j--) { // Iterar com cuidado se for modificar o array
                        if (i === j) continue; // Não colidir aguaBenta consigo mesma (se fosse o caso)
                        var possivelInimigo = this.sprites[j];
                        if (possivelInimigo && possivelInimigo.tipo === 'inimigo' && !possivelInimigo.removivel && possivelInimigo.getHitboxMundo) {
                            var hitboxInimigo = possivelInimigo.getHitboxMundo();
                            if (hitboxInimigo && colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                console.log("DEBUG CORAÇÃO: Colisão AguaBenta com Inimigo detectada."); // Log 1
                                possivelInimigo.removivel = true; 
                                outroSprite.removivel = true;

                                if (!this.condicaoPortao4000Liberado) this.inimigosDerrotadosContador++;
                                
                                if (this.jogadorPrincipal) {
                                    console.log("DEBUG CORAÇÃO: Verificando condições de drop..."); // Log 2
                                    console.log(`DEBUG CORAÇÃO: Vidas J: ${this.jogadorPrincipal.vidas}, Max Vidas J: ${this.jogadorPrincipal.maxVidas}, Passou Portão: ${this.jogadorPassouPortao4000}`); // Log 3

                                    if (this.jogadorPrincipal.vidas < this.jogadorPrincipal.maxVidas && !this.jogadorPassouPortao4000) {
                                        this.abatesDesdeUltimoCoracao++;
                                        console.log(`DEBUG CORAÇÃO: Abates para coração incrementado: ${this.abatesDesdeUltimoCoracao}/${this.abatesNecessariosPorCoracao}`); // Log 4
                                        if (this.abatesDesdeUltimoCoracao >= this.abatesNecessariosPorCoracao) {
                                            console.log("DEBUG CORAÇÃO: CONDIÇÃO DE ABATES ATINGIDA PARA DROP!"); // Log 5
                                            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalWidth > 0) {
                                                console.log("DEBUG CORAÇÃO: Imagem do coração OK. Tentando dropar..."); // Log 6
                                                let imgH = this.imgCoracaoHUD.naturalHeight || 20; let imgW = this.imgCoracaoHUD.naturalWidth || 20;
                                                let pInimigoL = possivelInimigo.largura || 50; let pInimigoA = possivelInimigo.altura || 50;
                                                let dropX = possivelInimigo.x + (pInimigoL / 2) - (imgW / 2);
                                                let dropY = possivelInimigo.y + (pInimigoA / 2) - (imgH / 2);
                                                dropX = Math.max(10, Math.min(dropX, this.mundoLargura - imgW - 10));
                                                dropY = Math.max(10, Math.min(dropY, this.canvas.height - imgH - 10));
                                                var coracaoDrop = new CoracaoDropado(this.context, dropX, dropY, this.imgCoracaoHUD, this);
                                                this.novoSprite(coracaoDrop); 
                                                console.log("DEBUG CORAÇÃO: CORAÇÃO EFETIVAMENTE DROPADO em X:", dropX.toFixed(0), "Y:", dropY.toFixed(0)); // Log 7
                                                this.abatesDesdeUltimoCoracao = 0; 
                                            } else {
                                                console.warn("DEBUG CORAÇÃO: Imagem do coração (this.imgCoracaoHUD) NÃO pronta para drop. Completa:", this.imgCoracaoHUD ? this.imgCoracaoHUD.complete : 'N/A', "Largura:", this.imgCoracaoHUD ? this.imgCoracaoHUD.naturalWidth : 'N/A'); // Log 8
                                            }
                                        }
                                    } else {
                                        console.log("DEBUG CORAÇÃO: Condição de vida do jogador ou portão não permitiu contagem para drop."); // Log 9
                                        if(this.jogadorPrincipal.vidas >= this.jogadorPrincipal.maxVidas) console.log("DEBUG CORAÇÃO: Vidas do jogador no máximo.");
                                        if(this.jogadorPassouPortao4000) console.log("DEBUG CORAÇÃO: Jogador já passou do portão 4000.");
                                    }
                                } else {
                                   console.warn("DEBUG CORAÇÃO: jogadorPrincipal não definido ao tentar dropar coração."); // Log 10
                                }
                                break; 
                            }
                        }
                    }
                } else if (outroSprite.tipo === 'coracaoDropado') {
                    var hitboxCoracao = outroSprite.getHitboxMundo();
                    if (hitboxCoracao && colidemRetangulos(hitboxJogador, hitboxCoracao)) {
                        if (typeof jogador.ganharVida === 'function') jogador.ganharVida(1);
                        outroSprite.removivel = true;
                        console.log("DEBUG CORAÇÃO: Jogador coletou um coração!");
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
        if (this.jogadorPrincipal && this.jogadorPrincipal.vidas !== undefined) {
            var ctx = this.context; ctx.save();
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xIni = 10, yCor = 10, lCor = this.imgCoracaoHUD.width, aCor = this.imgCoracaoHUD.height, espCor = 5;
                if (lCor === 0 || aCor === 0) { // Fallback
                    ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txt = "";
                    for (var c = 0; c < this.jogadorPrincipal.vidas; c++) txt += "❤ "; ctx.fillText(txt, 10, 30);
                } else {
                    for (var k = 0; k < this.jogadorPrincipal.vidas; k++) {
                        ctx.drawImage(this.imgCoracaoHUD, xIni + (k * (lCor + espCor)), yCor, lCor, aCor);
                    }
                }
            } else { // Fallback
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


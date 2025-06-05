// animacao.js
function Animacao(context, canvas) {
    this.context = context;
    this.canvas = canvas;
    this.sprites = [];
    this.ligado = false;
    this.ultimoTempo = 0;

    this.cameraX = 0;
    this.cameraY = 0;
    this.mundoLargura = 5000; // Conforme seu último HTML
    this.jogadorPrincipal = null;
    this.cameraSuavizacao = 0.08; // Um valor mais suave
    this.imgCoracaoHUD = null; // Será definido após o carregamento da imagem
}

Animacao.prototype = {
    novoSprite: function(sprite, ehJogadorPrincipal = false) {
        // Log para depurar adição de sprites e seus tipos
        console.log("[Animacao.JS novoSprite] Adicionando sprite:", sprite, "Tipo:", (sprite && sprite.tipo ? sprite.tipo : "N/A"), "É jogador principal?:", ehJogadorPrincipal);
        this.sprites.push(sprite);
        if (ehJogadorPrincipal) {
            this.jogadorPrincipal = sprite;
            // Dá ao sprite principal uma referência à animação, se ele precisar (ex: JC para mundoLargura)
            if (sprite && typeof sprite.animacao === 'undefined') {
                 sprite.animacao = this;
            }
        }
        // Garante que outros sprites também tenham referência à animação, se precisarem (ex: Inimigo para adicionar lasers)
        if (sprite && typeof sprite.animacao === 'undefined') {
             sprite.animacao = this;
        }
    },

    ligar: function() {
        this.ultimoTempo = new Date().getTime();
        this.ligado = true;
        this.proximoFrame();
    },

    desligar: function() {
        this.ligado = false;
    },

    atualizarCamera: function() {
        if (!this.jogadorPrincipal) return;
        let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2);
        let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * this.cameraSuavizacao;
        if (Math.abs(alvoCameraX - novaCameraX) < 0.5) {
            novaCameraX = alvoCameraX;
        }
        this.cameraX = novaCameraX;
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
    },

    proximoFrame: function() {
        console.log("[Animacao] proximoFrame - CICLO INICIADO", new Date().getTime()); 
        if (!this.ligado) return;

        var agora = new Date().getTime();
        var deltaTime = (agora - this.ultimoTempo) / 1000.0;

        this.atualizarCamera();
        this.limparTela();

        this.context.save();
        this.context.translate(-this.cameraX, -this.cameraY);

        // --- NOVO LOG AQUI ---
        console.log("[Animacao] Sprites na lista para atualizar:", this.sprites.length, this.sprites);
        // --------------------

        // 1. ATUALIZA todos os sprites
        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && this.sprites[i].atualizar) {
                this.sprites[i].atualizar(deltaTime);
            }
        }

        // 2. VERIFICAÇÃO DE COLISÕES
        var jogador = this.jogadorPrincipal;
        if (jogador && typeof jogador.estaVivo === 'function' && jogador.estaVivo() && typeof jogador.getHitboxMundo === 'function') {
            var hitboxJogador = jogador.getHitboxMundo();

            for (var i = 0; i < this.sprites.length; i++) {
                var outroSprite = this.sprites[i];

                if (!outroSprite || outroSprite === jogador || !outroSprite.getHitboxMundo || !outroSprite.tipo) {
                    continue;
                }

                // A) Colisão: JC (jogador) vs. Inimigos ou Lasers de Inimigos
                if (outroSprite.tipo === 'inimigo' || outroSprite.tipo === 'laserInimigo') {
                    // console.log("[Animacao] Verificando colisão JC vs", outroSprite.tipo); // Log para depuração
                    var hitboxOutro = outroSprite.getHitboxMundo();
                    if (colidemRetangulos(hitboxJogador, hitboxOutro)) {
                        console.log("COLISÃO DETECTADA entre JC e:", outroSprite.tipo, outroSprite);
                        console.log("JC está invencível antes do dano?", jogador.invencivel);
                        jogador.sofrerDano(1); // JC sofre dano

                        if (outroSprite.tipo === 'laserInimigo' && outroSprite.removivel !== undefined) {
                            outroSprite.removivel = true; // Laser do inimigo some ao colidir
                            console.log("Laser do inimigo removido após colisão com JC.");
                        }
                        // O break aqui faz o JC tomar dano de apenas UMA fonte por frame.
                        // A invencibilidade do JC deve prevenir dano contínuo do mesmo toque.
                        break;
                    }
                }
                // B) Colisão: AguaBenta do JC vs. Inimigos
                else if (outroSprite.tipo === 'aguaBenta') {
                    var hitboxAguaBenta = outroSprite.getHitboxMundo();
                    // Iterar sobre os sprites novamente para encontrar inimigos
                    for (var j = 0; j < this.sprites.length; j++) {
                        var possivelInimigo = this.sprites[j];
                        if (possivelInimigo && possivelInimigo.tipo === 'inimigo' && typeof possivelInimigo.getHitboxMundo === 'function') {
                            var hitboxInimigo = possivelInimigo.getHitboxMundo();
                            if (colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                console.log("COLISÃO: AguaBenta atingiu Inimigo!");
                                if (typeof possivelInimigo.sofrerDano === 'function') { // Se o inimigo tiver um método sofrerDano
                                    // possivelInimigo.sofrerDano(1); // Implemente isso em Inimigo.js
                                    console.log("Inimigo deveria sofrer dano (implementar sofrerDano em Inimigo.js). Por enquanto, será removido.");
                                    possivelInimigo.removivel = true; // Por enquanto, remove o inimigo
                                } else {
                                    possivelInimigo.removivel = true; // Remove o inimigo se não tiver sofrerDano
                                }
                                outroSprite.removivel = true; // AguaBenta some após atingir
                                break; // AguaBenta atinge apenas um inimigo e some
                            }
                        }
                    }
                }
            }
        }

        // Remove sprites marcados como "removivel"
        this.sprites = this.sprites.filter(function(sprite) {
            return sprite && !sprite.removivel;
        });

        // DESENHA todos os sprites restantes
        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && this.sprites[i].desenhar) {
                this.sprites[i].desenhar();
            }
        }

        this.context.restore(); // Restaura o contexto para desenhar o HUD

        // --- HUD ---
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
            var ctx = this.context;
            ctx.save();
            
            // Log para depurar o valor de vidas que o HUD está usando
            console.log('[ANIMACAO.JS - HUD] Desenhando HUD. Vidas do jogadorPrincipal:', this.jogadorPrincipal.vidas, 'Esta Morto:', this.jogadorPrincipal.estaMorto);

            // Desenhar IMAGENS de Coração
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xInicialCoracao = 10;
                var yCoracao = 10;
                var larguraCoracao = this.imgCoracaoHUD.width;
                var alturaCoracao = this.imgCoracaoHUD.height;
                var espacamentoCoracao = 5;

                if (larguraCoracao === 0 || alturaCoracao === 0) {
                    console.error("[HUD] Imagem do coração com dimensão 0. Verifique o carregamento ou o arquivo de imagem.");
                    // Fallback para texto se a imagem do coração falhou em dimensões
                    ctx.fillStyle = 'red'; ctx.font = '20px Arial';
                    var coracoesTexto = "";
                    for (var c = 0; c < this.jogadorPrincipal.vidas; c++) { coracoesTexto += "❤ "; }
                    ctx.fillText(coracoesTexto, 10, 10);
                } else {
                    for (var i = 0; i < this.jogadorPrincipal.vidas; i++) {
                        var xPos = xInicialCoracao + (i * (larguraCoracao + espacamentoCoracao));
                        try {
                            ctx.drawImage(this.imgCoracaoHUD, xPos, yCoracao, larguraCoracao, alturaCoracao);
                        } catch (e) {
                            console.error("[HUD] Erro ao tentar desenhar a imagem do coração:", e);
                        }
                    }
                }
            } else { // Fallback se imgCoracaoHUD não está pronta ou não foi definida
                // console.log("[HUD] Imagem do coração não pronta/definida. Usando fallback de texto.");
                ctx.fillStyle = 'red'; ctx.font = '20px Arial';
                var numVidas = (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas === 'number') ? this.jogadorPrincipal.vidas : 0;
                var coracoesTexto = "";
                for (var c = 0; c < numVidas; c++) { coracoesTexto += "❤ "; }
                ctx.fillText(coracoesTexto, 10, 10);
            }
            ctx.restore();
        }
        // --- FIM HUD ---

        this.ultimoTempo = agora;
        var animacao_self = this;
        requestAnimationFrame(function() {
            animacao_self.proximoFrame();
        });
    },

    limparTela: function() {
        var ctx = this.context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
};

// Função colidemRetangulos (deve estar acessível, pode ficar no final deste arquivo ou em utils.js)
function colidemRetangulos(ret1, ret2) {
    if (!ret1 || !ret2) return false; // Verificação de segurança
    return !(ret1.x + ret1.largura < ret2.x ||
             ret1.x > ret2.x + ret2.largura ||
             ret1.y + ret1.altura < ret2.y ||
             ret1.y > ret2.y + ret2.altura);
}
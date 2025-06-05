// animacao.js
function Animacao(context, canvas) {
    this.context = context;
    this.canvas = canvas;
    this.sprites = [];
    this.ligado = false;
    this.ultimoTempo = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    
    // --- MUDANÇAS AQUI ---
    this.mundoLargura = 3000;             // << NOVO: Largura do mundo reduzida
    this.distanciaSpawnInimigo = 900;     // << NOVO: Distância fixa para spawnar do jogador
    // --- FIM DAS MUDANÇAS ---

    this.jogadorPrincipal = null;
    this.cameraSuavizacao = 0.08;
    this.imgCoracaoHUD = null;

    this.maxInimigos = 5;
    this.frequenciaSpawnInimigo = 5000;
    this.tempoUltimoSpawnInimigo = 0;

    this.imgInimigo = null;
    this.imgInimigoLinhas = 1;  // Lembre-se de configurar estes no seu HTML
    this.imgInimigoColunas = 4; // Lembre-se de configurar estes no seu HTML

    // << NOVA PROPRIEDADE PARA DISTÂNCIA ENTRE INIMIGOS >>
    this.distanciaMinimaEntreInimigos = 40; 
}

Animacao.prototype = {
    novoSprite: function(sprite, ehJogadorPrincipal = false) {
        // console.log("[Animacao.JS novoSprite] Adicionando sprite:", (sprite && sprite.tipo ? sprite.tipo : "N/A"));
        this.sprites.push(sprite);
        if (ehJogadorPrincipal) {
            this.jogadorPrincipal = sprite;
        }
        // Garante que todos os sprites tenham referência à instância de animação, se precisarem
        if (sprite && typeof sprite.animacao === 'undefined') {
             sprite.animacao = this;
        }
    },

    ligar: function() {
        this.ultimoTempo = Date.now(); // Usar Date.now() para o tempo inicial
        this.tempoUltimoSpawnInimigo = Date.now(); // Inicializa o timer de spawn
        this.ligado = true;
        this.proximoFrame();
    },

    desligar: function() {
        this.ligado = false;
    },

    atualizarCamera: function() {
        if (!this.jogadorPrincipal) return;
        // Lógica de câmera suavizada (como você já tinha)
        let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2) + (this.jogadorPrincipal.largura / 2);
        let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * this.cameraSuavizacao;
        if (Math.abs(alvoCameraX - novaCameraX) < 0.5) novaCameraX = alvoCameraX; // Snap se perto
        this.cameraX = novaCameraX;
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width)); // Limites da câmera
        // this.cameraY similarmente se você tiver movimento vertical da câmera
    },

    tentarSpawnInimigo: function(tempoAtual) {
        // console.log("[SPAWN_DEBUG] Verificando spawn..."); // Mantenha os logs de debug se precisar

        if ((tempoAtual - this.tempoUltimoSpawnInimigo) < this.frequenciaSpawnInimigo) {
            return; 
        }
        this.tempoUltimoSpawnInimigo = tempoAtual;

        let inimigosVivos = 0;
        for (let i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && this.sprites[i].tipo === 'inimigo' && !this.sprites[i].removivel) {
                inimigosVivos++;
            }
        }

        if (inimigosVivos >= this.maxInimigos) {
            // console.log("[SPAWN_DEBUG] Máximo de inimigos atingido.");
            return;
        }

        if (!this.imgInimigo || !this.jogadorPrincipal) {
            console.warn("[Animacao] Spawn cancelado (ainda): imgInimigo ou jogadorPrincipal não definidos.");
            return;
        }
        if (!this.imgInimigo.complete || this.imgInimigo.naturalHeight === 0) {
            console.warn("[Animacao] Spawn cancelado (ainda): imgInimigo não carregada completamente.");
            return;
        }

        // --- LÓGICA DE POSIÇÃO DE SPAWN ATUALIZADA ---
        let spawnX = 0;
        // Assumindo que jogadorPrincipal.posicaoChao existe e é onde o inimigo deve spawnar verticalmente.
        // Se inimigo.js não define this.posicaoChao ou a usa, ajuste conforme necessário.
        let spawnY = (this.jogadorPrincipal && typeof this.jogadorPrincipal.posicaoChao === 'number') 
                     ? this.jogadorPrincipal.posicaoChao 
                     : (this.canvas.height - 100); // Fallback se posicaoChao não estiver definida

        let playerX = this.jogadorPrincipal.x;
        
        let larguraEstimadaInimigo = 0;
        if (this.imgInimigo && this.imgInimigo.complete && this.imgInimigoColunas > 0 && this.imgInimigo.naturalWidth > 0) {
            larguraEstimadaInimigo = this.imgInimigo.naturalWidth / this.imgInimigoColunas;
        } else {
            larguraEstimadaInimigo = 50; // Um valor padrão se não puder calcular
        }

        let posicoesPossiveisX = [];
        
        let spawnEsquerdaX = playerX - this.distanciaSpawnInimigo;
        if (spawnEsquerdaX >= 0 && spawnEsquerdaX <= this.mundoLargura - larguraEstimadaInimigo) {
            posicoesPossiveisX.push(spawnEsquerdaX);
        }

        let spawnDireitaX = playerX + this.distanciaSpawnInimigo;
        if (spawnDireitaX >= 0 && spawnDireitaX <= this.mundoLargura - larguraEstimadaInimigo) {
            posicoesPossiveisX.push(spawnDireitaX);
        }

        if (posicoesPossiveisX.length > 0) {
            spawnX = posicoesPossiveisX[Math.floor(Math.random() * posicoesPossiveisX.length)];
            
            console.log(`[Animacao] Spawnando novo inimigo. Vivos (antes): ${inimigosVivos}. Pos: (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);

            let novoInimigo = new Inimigo(
                this.context,
                spawnX,
                spawnY, // Usando spawnY calculado
                this.jogadorPrincipal,
                this,
                this.canvas,
                this.imgInimigo,
                this.imgInimigoLinhas,
                this.imgInimigoColunas
            );
            this.novoSprite(novoInimigo);
        } else {
            // console.log(`[Animacao] Não foi possível encontrar posição de spawn a ${this.distanciaSpawnInimigo}px do jogador dentro do mundo de ${this.mundoLargura}px.`);
        }
        // --- FIM DA LÓGICA DE POSIÇÃO DE SPAWN ATUALIZADA ---
    },

    // << NOVO MÉTODO PARA SEPARAÇÃO DE INIMIGOS >>
    aplicarSeparacaoInimigos: function() {
        let inimigos = this.sprites.filter(sprite => sprite && sprite.tipo === 'inimigo' && !sprite.removivel);

        for (let i = 0; i < inimigos.length; i++) {
            for (let j = i + 1; j < inimigos.length; j++) {
                let inimigoA = inimigos[i];
                let inimigoB = inimigos[j];

                // Assegurar que largura e altura sejam números válidos
                let larguraA = (typeof inimigoA.largura === 'number' && inimigoA.largura > 0) ? inimigoA.largura : 50;
                let alturaA = (typeof inimigoA.altura === 'number' && inimigoA.altura > 0) ? inimigoA.altura : 50;
                let larguraB = (typeof inimigoB.largura === 'number' && inimigoB.largura > 0) ? inimigoB.largura : 50;
                let alturaB = (typeof inimigoB.altura === 'number' && inimigoB.altura > 0) ? inimigoB.altura : 50;


                let centroAx = inimigoA.x + larguraA / 2;
                let centroAy = inimigoA.y + alturaA / 2;
                let centroBx = inimigoB.x + larguraB / 2;
                let centroBy = inimigoB.y + alturaB / 2;

                let dx = centroBx - centroAx;
                let dy = centroBy - centroAy;
                let distancia = Math.sqrt(dx * dx + dy * dy);

                if (distancia < this.distanciaMinimaEntreInimigos && distancia > 0) { // distancia > 0 para evitar NaN
                    let sobreposicao = this.distanciaMinimaEntreInimigos - distancia;
                    // Normalizar o vetor de direção (dx, dy)
                    let normDx = dx / distancia;
                    let normDy = dy / distancia;

                    let moverValor = sobreposicao / 2; // Cada inimigo se move metade da sobreposição

                    // Mover inimigoA para longe de inimigoB
                    inimigoA.x -= normDx * moverValor;
                    inimigoA.y -= normDy * moverValor;

                    // Mover inimigoB para longe de inimigoA
                    inimigoB.x += normDx * moverValor;
                    inimigoB.y += normDy * moverValor;

                    // Restringir posições para dentro do mundo
                    // Eixo X
                    inimigoA.x = Math.max(0, Math.min(inimigoA.x, this.mundoLargura - larguraA));
                    inimigoB.x = Math.max(0, Math.min(inimigoB.x, this.mundoLargura - larguraB));
                    
                    // Eixo Y - A restrição em Y depende se os inimigos devem ficar no chão.
                    // O código de Inimigo.js permite movimento em Y para perseguir o jogador.
                    // Se eles tivessem que ficar no chão, por exemplo em this.jogadorPrincipal.posicaoChao:
                    // inimigoA.y = this.jogadorPrincipal.posicaoChao - alturaA; (se y é o topo)
                    // inimigoB.y = this.jogadorPrincipal.posicaoChao - alturaB;
                    // Por agora, vamos assumir que o movimento em Y é livre, como na perseguição.
                    // Se houver limites verticais para o mundo, adicione-os aqui.
                    // Ex: inimigoA.y = Math.max(0, Math.min(inimigoA.y, this.canvas.height - alturaA));
                    //     inimigoB.y = Math.max(0, Math.min(inimigoB.y, this.canvas.height - alturaB));
                }
            }
        }
    },

    proximoFrame: function() {
        if (!this.ligado) return;

        var agora = Date.now();
        var deltaTime = (agora - this.ultimoTempo) / 1000.0;
        this.ultimoTempo = agora; 

        this.tentarSpawnInimigo(agora);

        this.atualizarCamera();
        this.limparTela();

        this.context.save();
        this.context.translate(-this.cameraX, -this.cameraY);

        // Atualizar todos os sprites
        for (var i = 0; i < this.sprites.length; i++) {
            const spriteAtual = this.sprites[i];
            if (spriteAtual && typeof spriteAtual.atualizar === 'function') {
                spriteAtual.atualizar(deltaTime);
            }
        }

        // << CHAMAR A LÓGICA DE SEPARAÇÃO DEPOIS DE ATUALIZAR AS POSIÇÕES >>
        this.aplicarSeparacaoInimigos();

        // Lógica de colisão existente
        var jogador = this.jogadorPrincipal;
        if (jogador && typeof jogador.getHitboxMundo === 'function' &&
            typeof jogador.estaMorto !== 'undefined' && !jogador.estaMorto) {
            var hitboxJogador = jogador.getHitboxMundo();
            for (var i = 0; i < this.sprites.length; i++) {
                var outroSprite = this.sprites[i];
                if (!outroSprite || outroSprite === jogador || typeof outroSprite.getHitboxMundo !== 'function' || !outroSprite.tipo) {
                    continue;
                }
                if (outroSprite.tipo === 'inimigo' || outroSprite.tipo === 'laserInimigo') {
                    var hitboxOutro = outroSprite.getHitboxMundo();
                    if (colidemRetangulos(hitboxJogador, hitboxOutro)) {
                        // console.log("COLISÃO DETECTADA entre JC e:", outroSprite.tipo);
                        jogador.receberDano();
                        if (outroSprite.tipo === 'laserInimigo' && typeof outroSprite.removivel !== 'undefined') {
                            outroSprite.removivel = true;
                        }
                        // break; // Considerar se o jogador deve levar apenas um dano por frame
                    }
                }
                else if (outroSprite.tipo === 'aguaBenta') {
                    var hitboxAguaBenta = outroSprite.getHitboxMundo();
                    for (var j = 0; j < this.sprites.length; j++) {
                        var possivelInimigo = this.sprites[j];
                        if (possivelInimigo && possivelInimigo.tipo === 'inimigo' && typeof possivelInimigo.getHitboxMundo === 'function') {
                            var hitboxInimigo = possivelInimigo.getHitboxMundo();
                            if (colidemRetangulos(hitboxAguaBenta, hitboxInimigo)) {
                                // console.log("COLISÃO: AguaBenta atingiu Inimigo!");
                                if (typeof possivelInimigo.receberDano === 'function') { // Se o inimigo tiver um método receberDano
                                    // possivelInimigo.receberDano(1); // Você precisaria criar essa função no inimigo.js
                                    console.log("Inimigo atingido por AguaBenta. Implementar receberDano no inimigo.");
                                    possivelInimigo.removivel = true;
                                } else {
                                    possivelInimigo.removivel = true;
                                }
                                outroSprite.removivel = true;
                                // break; // AguaBenta atinge um inimigo e some
                            }
                        }
                    }
                }
            }
        }

        // Remover sprites marcados como removíveis
        this.sprites = this.sprites.filter(function(sprite) { return sprite && !sprite.removivel; });

        // Desenhar todos os sprites
        for (var i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i] && typeof this.sprites[i].desenhar === 'function') {
                this.sprites[i].desenhar();
            }
        }
        this.context.restore();

        // HUD
        if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
            var ctx = this.context; ctx.save();
            if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
                var xInicialCoracao = 10, yCoracao = 10;
                var larguraCoracao = this.imgCoracaoHUD.width, alturaCoracao = this.imgCoracaoHUD.height;
                var espacamentoCoracao = 5;
                if (larguraCoracao === 0 || alturaCoracao === 0) { // Fallback se dimensões da imagem do coração não carregarem
                    ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txt = "";
                    for (var c = 0; c < this.jogadorPrincipal.vidas; c++) txt += "❤ "; ctx.fillText(txt, 10, 30);
                } else {
                    for (var k = 0; k < this.jogadorPrincipal.vidas; k++) {
                        var xPos = xInicialCoracao + (k * (larguraCoracao + espacamentoCoracao));
                        ctx.drawImage(this.imgCoracaoHUD, xPos, yCoracao, larguraCoracao, alturaCoracao);
                    }
                }
            } else { // Fallback se imagem do coração não estiver pronta
                ctx.fillStyle = 'red'; ctx.font = '20px Arial'; var txt = "";
                var numVidas = (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas === 'number') ? this.jogadorPrincipal.vidas : 0;
                for (var c = 0; c < numVidas; c++) txt += "❤ "; ctx.fillText(txt, 10, 30);
            }
            ctx.restore();
        }

        // this.ultimoTempo = agora; // Movido para o início do proximoFrame para cálculo correto do deltaTime
        var animacao_self = this;
        requestAnimationFrame(function() {
            animacao_self.proximoFrame();
        });
    },

    limparTela: function() {
        var ctx = this.context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    // A função colidemRetangulos já estava definida no seu código, mantenha-a.
    // Se não estiver, adicione-a aqui ou em um local acessível:
    /*
    colidemRetangulos: function(ret1, ret2) { // Se for método da classe
        if (!ret1 || !ret2) return false;
        return !(ret1.x + ret1.largura < ret2.x ||
                 ret1.x > ret2.x + ret2.largura ||
                 ret1.y + ret1.altura < ret2.y ||
                 ret1.y > ret2.y + ret2.altura);
    }
    */
};

// Se colidemRetangulos for uma função global como no seu último envio:
function colidemRetangulos(ret1, ret2) {
    if (!ret1 || !ret2) return false;
    // Verifica se as propriedades existem e são números antes de usar
    const r1x = typeof ret1.x === 'number' ? ret1.x : 0;
    const r1w = typeof ret1.largura === 'number' ? ret1.largura : 0;
    const r1y = typeof ret1.y === 'number' ? ret1.y : 0;
    const r1h = typeof ret1.altura === 'number' ? ret1.altura : 0;

    const r2x = typeof ret2.x === 'number' ? ret2.x : 0;
    const r2w = typeof ret2.largura === 'number' ? ret2.largura : 0;
    const r2y = typeof ret2.y === 'number' ? ret2.y : 0;
    const r2h = typeof ret2.altura === 'number' ? ret2.altura : 0;
    
    return !(r1x + r1w < r2x ||
             r1x > r2x + r2w ||
             r1y + r1h < r2y ||
             r1y > r2y + r2h);
}
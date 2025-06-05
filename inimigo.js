// inimigo.js

function Inimigo(context, x, y, jogadorAlvo, animacao, canvas, imagemInimigo, linhasSheet, colunasSheet) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.jogadorAlvo = jogadorAlvo;
    this.animacao = animacao;
    this.canvas = canvas;
    this.tipo = 'inimigo';

    this.velocidadeMovimento = 50; // Velocidade do inimigo (pixels por segundo)
    this.raioDeteccao = 1000;
    this.distanciaMinima = 300;   // Distância para parar de perseguir

    this.velocidadeLaser = 1.7;
    this.cooldownTiro = 3000; // Tempo em milissegundos
    this.ultimoTiroTempo = 0;
    this.removivel = false;

    this.imagem = imagemInimigo;
    this.sheet = null;
    this.largura = 50;
    this.altura = 50;

    const lSheetValida = (typeof linhasSheet === 'number' && linhasSheet > 0) ? linhasSheet : 1;
    const cSheetValida = (typeof colunasSheet === 'number' && colunasSheet > 0) ? colunasSheet : 1;

    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0 && this.imagem.naturalWidth > 0) {
        try {
            this.sheet = new Spritesheet(this.context, this.imagem, lSheetValida, cSheetValida);
            this.sheet.intervalo = 150;
            this.largura = this.imagem.width / cSheetValida;
            this.altura = this.imagem.height / lSheetValida;
            if (isNaN(this.largura) || isNaN(this.altura) || this.largura <= 0 || this.altura <= 0) {
                console.warn("Inimigo: Cálculo de largura/altura da spritesheet inválido. Usando fallback.", {imgW: this.imagem.width, imgH: this.imagem.height, cS: cSheetValida, lS: lSheetValida});
                this.largura = 50; this.altura = 50; this.sheet = null;
            } else { this.sheet.linha = 0; }
        } catch (e) {
            console.error("Inimigo: ERRO ao criar Spritesheet.", e);
            this.sheet = null; this.largura = 50; this.altura = 50;
        }
    } else {
        // console.warn("Inimigo: Imagem não disponível ou não carregada no construtor.");
    }

    this.hitboxOffsetX = 4; this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - (this.hitboxOffsetX * 2);
    this.hitboxAltura = this.altura - (this.hitboxOffsetY * 2);
    if (this.hitboxLargura <= 0) this.hitboxLargura = Math.max(10, this.largura * 0.5);
    if (this.hitboxAltura <= 0) this.hitboxAltura = Math.max(10, this.altura * 0.5);

    // console.log("Inimigo criado. L:", this.largura, "A:", this.altura);
}

Inimigo.prototype = {
    atualizar: function(deltaTime) {
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }

        if (!this.jogadorAlvo) {
            // console.log("[Inimigo.atualizar] ERRO: this.jogadorAlvo é NULO ou INDEFINIDO!");
            return;
        }

        let jogadorEstaVivo;
        if (typeof this.jogadorAlvo.estaMorto !== 'undefined') {
            jogadorEstaVivo = !this.jogadorAlvo.estaMorto;
        } else if (typeof this.jogadorAlvo.vidas !== 'undefined') {
            jogadorEstaVivo = this.jogadorAlvo.vidas > 0;
        } else {
            console.error("[Inimigo.atualizar] ERRO CRÍTICO: Não foi possível determinar se o jogador está vivo.");
            return;
        }

        if (!jogadorEstaVivo) {
            // console.log("[Inimigo.atualizar] Jogador alvo não está vivo. Inimigo não faz nada.");
            return;
        }

        let jgLargura = this.jogadorAlvo.largura || 0;
        let jgAltura = this.jogadorAlvo.altura || 0;
        let centroJogadorX = this.jogadorAlvo.x + jgLargura / 2;
        let centroJogadorY = this.jogadorAlvo.y + jgAltura / 2;
        let centroInimigoX = this.x + this.largura / 2;
        let centroInimigoY = this.y + this.altura / 2;

        let dx = centroJogadorX - centroInimigoX;
        let dy = centroJogadorY - centroInimigoY;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        if (isNaN(distancia)) {
            console.error("[Inimigo.atualizar] ERRO: Distância calculada é NaN!");
            return;
        }

        // --- LÓGICA DE MOVIMENTO E ATAQUE ---
        if (distancia <= this.raioDeteccao) { // Jogador está dentro do raio de detecção
            // 1. LÓGICA DE MOVIMENTO
            if (distancia > this.distanciaMinima) { // Se o inimigo está mais longe que a distância mínima, ele se move
                let normDx = dx / distancia;
                let normDy = dy / distancia;

                this.x += normDx * this.velocidadeMovimento * deltaTime;
                this.y += normDy * this.velocidadeMovimento * deltaTime;
                // console.log(`[Inimigo] Perseguindo jogador. Dist: ${distancia.toFixed(0)}`);
            } else {
                // Inimigo está dentro da distância mínima (<= distanciaMinima). Para de perseguir.
                // console.log(`[Inimigo] Próximo ao jogador (dist <= ${this.distanciaMinima}px). Perseguição parada. Dist: ${distancia.toFixed(0)}`);
            }

            // 2. LÓGICA DE ATAQUE (tiro)
            let agora = Date.now();
            let tempoDesdeUltimoTiro = agora - this.ultimoTiroTempo;

            if (tempoDesdeUltimoTiro > this.cooldownTiro) {
                this.atirarLaser(dx, dy, distancia);
                this.ultimoTiroTempo = agora;
            }

        } else {
            // Jogador está fora do raio de detecção.
            // console.log(`[Inimigo] Jogador fora do raio de detecção. Dist: ${distancia.toFixed(0)}`);
        }
    },

    atirarLaser: function(dxParaJogador, dyParaJogador, distanciaAteJogador) {
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        let dirX = 0;
        let dirY = 0;

        if (distanciaAteJogador > 0) {
            dirX = dxParaJogador / distanciaAteJogador;
            dirY = dyParaJogador / distanciaAteJogador;
        } else {
            return; // Não atira se a distância for zero ou inválida
        }
        try {
            if (typeof Laser !== 'undefined' && this.animacao && typeof this.animacao.novoSprite === 'function') {
                var laser = new Laser(this.context, origemX, origemY, dirX, dirY, this.velocidadeLaser, this.canvas, this.animacao);
                this.animacao.novoSprite(laser);
            } else {
                console.error("[Inimigo.atirarLaser] ERRO: Classe Laser não definida ou this.animacao.novoSprite não é uma função.");
            }
        } catch (e) {
            console.error("[Inimigo.atirarLaser] ERRO CRÍTICO ao criar ou adicionar Laser:", e);
        }
    },

    desenhar: function() {
        var ctx = this.context;
    ctx.save();

    let deveVirar = false; // Por padrão, não vira (assumindo que o sprite original olha para a ESQUERDA)

    if (this.jogadorAlvo) {
        let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let enemyCenterX = this.x + this.largura / 2;

        // --- CONDIÇÃO INVERTIDA AQUI ---
        // Se o jogador está à DIREITA do inimigo, então devemos virar o sprite
        // (porque assumimos que o sprite original do inimigo olha para a ESQUERDA)
        if (playerCenterX > enemyCenterX) { 
            deveVirar = true; 
        }
        // Se o jogador está à ESQUERDA, deveVirar continua false, desenhando o sprite na orientação padrão (esquerda).
    }

    // O restante da lógica de desenho (com ctx.scale e as coordenadas) permanece o mesmo:
    if (this.sheet && this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0) {
        if (deveVirar) {
            ctx.scale(-1, 1); 
            this.sheet.desenhar(-this.x - this.largura, this.y);
        } else {
            this.sheet.desenhar(this.x, this.y);
        }
    } else {
        // Fallback de desenho
        if (deveVirar) {
            ctx.scale(-1, 1);
            ctx.fillStyle = 'purple';
            ctx.fillRect(-this.x - this.largura, this.y, this.largura, this.altura);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, this.largura, this.altura);
            ctx.strokeStyle = 'white';
            ctx.strokeText("INIMIGO", this.x + 5, this.y + 20);
        }
    }

    ctx.restore();
    },

    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura,
            altura: this.hitboxAltura
        };
    },

    desenharHitbox: function() {
        var hitbox = this.getHitboxMundo();
        var ctx = this.context;
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    }
};
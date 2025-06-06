// inimigo.js

function Inimigo(context, x, y, jogadorAlvo, animacao, canvas, imagemInimigo, linhasSheet, colunasSheet) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.jogadorAlvo = jogadorAlvo;
    this.animacao = animacao;
    this.canvas = canvas;
    this.tipo = 'inimigo';

    this.velocidadeMovimento = 50;
    this.raioDeteccao = 1000;
    this.distanciaMinima = 300; 

    this.velocidadeLaser = 1.7;
    this.cooldownTiro = 3000;
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
                console.warn("Inimigo: Cálculo de largura/altura da spritesheet inválido. Usando fallback.");
                this.largura = 50; this.altura = 50; this.sheet = null;
            } else { this.sheet.linha = 0; } // Define a linha inicial da spritesheet
        } catch (e) {
            console.error("Inimigo: ERRO ao criar Spritesheet.", e);
            this.sheet = null; this.largura = 50; this.altura = 50;
        }
    }

    this.hitboxOffsetX = 4; this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - (this.hitboxOffsetX * 2);
    this.hitboxAltura = this.altura - (this.hitboxOffsetY * 2);
    if (this.hitboxLargura <= 0) this.hitboxLargura = Math.max(10, this.largura * 0.5);
    if (this.hitboxAltura <= 0) this.hitboxAltura = Math.max(10, this.altura * 0.5);
}

Inimigo.prototype = {
    atualizar: function(deltaTime) {
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }

        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) {
            return;
        }

        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroJogadorY = this.jogadorAlvo.y + (this.jogadorAlvo.altura || 0) / 2;
        let centroInimigoX = this.x + this.largura / 2;
        let centroInimigoY = this.y + this.altura / 2;

        let dx = centroJogadorX - centroInimigoX;
        let dy = centroJogadorY - centroInimigoY;
        let distancia = Math.hypot(dx, dy); // Usar hypot para cálculo de distância mais seguro

        if (isNaN(distancia)) {
            console.error("[Inimigo.atualizar] ERRO: Distância calculada é NaN!");
            return;
        }

        if (distancia <= this.raioDeteccao) {
            if (distancia > this.distanciaMinima) {
                let normDx = dx / distancia;
                let normDy = dy / distancia;
                this.x += normDx * this.velocidadeMovimento * deltaTime;
                this.y += normDy * this.velocidadeMovimento * deltaTime;
            }
            
            let agora = Date.now();
            if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
                this.atirarLaser(dx, dy, distancia); // Passa dx, dy, distancia para o método de tiro
                this.ultimoTiroTempo = agora;
            }
        }
    },

    atirarLaser: function(dxParaJogador, dyParaJogador, distanciaAteJogador) {
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        
        const dirY = 0; // Laser sempre horizontal
        let dirX = 1;   

        if (this.jogadorAlvo) {
            let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
            let enemyCenterX = this.x + this.largura / 2;
            if (playerCenterX < enemyCenterX) dirX = -1;
            else if (playerCenterX > enemyCenterX) dirX = 1;
            else dirX = -1; // Padrão se alinhado
        }

        try {
            if (typeof Laser !== 'undefined' && this.animacao && typeof this.animacao.novoSprite === 'function') {
                var laser = new Laser(this.context, origemX, origemY, dirX, dirY, this.velocidadeLaser, this.canvas, this.animacao);
                this.animacao.novoSprite(laser);
            } else {
                console.error("[Inimigo.atirarLaser] ERRO: Dependências não encontradas (Laser ou animacao.novoSprite).");
            }
        } catch (e) {
            console.error("[Inimigo.atirarLaser] ERRO CRÍTICO ao criar Laser:", e);
        }
    },

    desenhar: function() {
        var ctx = this.context;
        ctx.save();

        let deveVirar = false; 
        if (this.jogadorAlvo) {
            let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
            let enemyCenterX = this.x + this.largura / 2;
            if (playerCenterX > enemyCenterX) { 
                deveVirar = true; 
            }
        }

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
                // Opcional: ctx.strokeStyle = 'white'; ctx.strokeText("INIMIGO", this.x + 5, this.y + 20);
            }
        }
        ctx.restore();
    },
    // A definição duplicada de 'desenhar' foi removida.

    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura,
            altura: this.hitboxAltura
        };
    },

    desenharHitbox: function() { // Para debug
        var hitbox = this.getHitboxMundo();
        var ctx = this.context;
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    }
};

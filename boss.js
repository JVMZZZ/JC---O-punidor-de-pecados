// boss.js

function Boss(context, x, y, imagemBoss, animacao, jogadorAlvo, canvas) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.imagem = imagemBoss;
    this.animacao = animacao;
    this.jogadorAlvo = jogadorAlvo;
    this.canvas = canvas;
    this.tipo = 'boss';
    this.removivel = false;

    // Propriedades de Estado do Boss
    this.largura = 120; 
    this.altura = 120; 
    this.maxVidas = 60;
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    // Propriedades de Movimento
    this.velocidadeMovimento = 25;
    this.raioDeteccao = 9999;
    this.distanciaMinima = 150;

    // Propriedades de Ataque
    this.velocidadeLaser = 3.0;
    this.cooldownTiro = 2800;
    this.ultimoTiroTempo = 0;

    // Propriedades para a Janela de Vulnerabilidade
    this.vulneravel = false; // Começa invulnerável
    this.tempoFimVulnerabilidade = 0;
    this.duracaoVulnerabilidade = 2000; // 2 segundos em milissegundos

    // Configuração da Spritesheet (descomente e ajuste para a sua imagem)
    this.sheet = null;
    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0) {
        // --- AJUSTE OS VALORES AQUI ---
        let linhas = 2;    // Quantas linhas de animação tem sua imagem do Boss?
        let colunas = 4;   // Quantos quadros (colunas) por linha?
        // --------------------------------

        this.sheet = new Spritesheet(this.context, this.imagem, linhas, colunas); 
        this.sheet.intervalo = 250; 
        
        this.largura = this.imagem.width / colunas;
        this.altura = this.imagem.height / linhas;
    } else {
        console.warn("Boss: Imagem não carregada ou spritesheet não configurada.");
    }

    // Hitbox
    this.hitboxOffsetX = 15; 
    this.hitboxOffsetY = 15;
    this.hitboxLargura = this.largura - 30;
    this.hitboxAltura = this.altura - 30;
}

Boss.prototype = {
    atualizar: function(deltaTime) {
        if (this.estaMorto) return;

        // Verifica se a janela de vulnerabilidade acabou
        if (this.vulneravel && Date.now() > this.tempoFimVulnerabilidade) {
            this.vulneravel = false;
        }

        // Lógica de Movimento e Ataque
        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) return;

        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroBossX = this.x + this.largura / 2;
        let distancia = Math.hypot(
            centroJogadorX - centroBossX,
            (this.jogadorAlvo.y + (this.jogadorAlvo.altura / 2)) - (this.y + this.altura / 2)
        );

        if (distancia > this.distanciaMinima) {
            let dx = centroJogadorX - centroBossX;
            let dy = (this.jogadorAlvo.y + (this.jogadorAlvo.altura / 2)) - (this.y + this.altura / 2);
            let normDx = dx / distancia;
            let normDy = dy / distancia;
            this.x += normDx * this.velocidadeMovimento * deltaTime;
            this.y += normDy * this.velocidadeMovimento * deltaTime;
        }
        
        let agora = Date.now();
        if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
            this.atirar();
            this.ultimoTiroTempo = agora;
        }
        
        // Manter o Boss dentro dos limites da sua arena
        const ARENA_MIN_X = 4000;
        const ARENA_MAX_X = this.animacao.mundoLargura - this.largura;
        const ARENA_MIN_Y = 0;
        const ARENA_MAX_Y = this.canvas.height - this.altura;
        this.x = Math.max(ARENA_MIN_X, Math.min(this.x, ARENA_MAX_X));
        this.y = Math.max(ARENA_MIN_Y, Math.min(this.y, ARENA_MAX_Y));

        if (this.sheet) {
            this.sheet.proximoQuadro();
        }
    },
    
    atirar: function() {
        if (!this.jogadorAlvo || this.estaMorto) return;

        this.vulneravel = true; // Fica vulnerável ao atirar
        this.tempoFimVulnerabilidade = Date.now() + this.duracaoVulnerabilidade;

        let direcaoX = (this.jogadorAlvo.x > this.x) ? 1 : -1;
        const numTiros = 2;
        const intervaloEntreTiros = 200;

        for (let i = 0; i < numTiros; i++) {
            setTimeout(() => {
                this.spawnLaser(direcaoX);
            }, i * intervaloEntreTiros);
        }
    },

    spawnLaser: function(direcaoX) {
        if (this.estaMorto) return;

        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        const direcaoY = 0;

        if (typeof Laser !== 'undefined' && this.animacao && this.animacao.novoSprite) {
            var laser = new Laser(this.context, origemX, origemY, direcaoX, direcaoY, this.velocidadeLaser, this.canvas, this.animacao);
            this.animacao.novoSprite(laser);
        }
    },

    desenhar: function() {
        if (this.estaMorto && !this.removivel) return; 

        this.context.save();

        // Feedback visual para o estado de vulnerabilidade
        if (this.vulneravel) {
            this.context.shadowColor = 'red';
            this.context.shadowBlur = 25;
        }

        let deveVirar = (this.jogadorAlvo && (this.jogadorAlvo.x + (this.jogadorAlvo.largura / 2)) > (this.x + this.largura / 2));
        
        if (deveVirar) {
            this.context.scale(-1, 1);
            var xInvertido = -this.x - this.largura;

            if (this.sheet) this.sheet.desenhar(xInvertido, this.y);
            else if (this.imagem && this.imagem.complete) this.context.drawImage(this.imagem, xInvertido, this.y, this.largura, this.altura);
            else this.context.fillRect(xInvertido, this.y, this.largura, this.altura);
        } else {
            if (this.sheet) this.sheet.desenhar(this.x, this.y);
            else if (this.imagem && this.imagem.complete) this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
            else this.context.fillRect(this.x, this.y, this.largura, this.altura);
        }

        this.context.restore(); // Restaura o contexto (remove o brilho e o espelhamento)

        // Descomente esta linha para ver a hitbox durante o desenvolvimento:
        // this.desenharHitbox();
    },

    receberDano: function(quantidade) {
        if (!this.vulneravel) {
            // Pode adicionar um som de "dano bloqueado" aqui
            return; 
        }
        if (this.estaMorto) return;

        this.vidas -= quantidade;
        
        if (this.vidas <= 0) {
            this.vidas = 0;
            this.morrer();
        }
    },

    // --- Demais Métodos Auxiliares ---

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
        this.context.save();
        this.context.strokeStyle = 'lime';
        this.context.lineWidth = 2;
        this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        this.context.restore();
    },

    morrer: function() {
        if (this.estaMorto) return;
        this.estaMorto = true;
        this.vulneravel = false; // Garante que não possa mais levar dano
        console.log("BOSS DERROTADO!");
        
        setTimeout(() => {
            this.removivel = true;
        }, 1500); // Delay para animação de morte

        if (this.animacao && typeof this.animacao.eventoBossDerrotado === 'function') {
            this.animacao.eventoBossDerrotado();
        }
    }
};
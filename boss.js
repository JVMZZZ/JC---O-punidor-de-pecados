// boss.js

// A assinatura do construtor foi atualizada para receber 'jogadorAlvo' e 'canvas'
function Boss(context, x, y, imagemBoss, animacao, jogadorAlvo, canvas) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.imagem = imagemBoss;
    this.animacao = animacao;
    this.jogadorAlvo = jogadorAlvo; // Armazena o alvo a ser perseguido
    this.canvas = canvas;           // Referência ao canvas para limites de altura
    this.tipo = 'boss';
    this.removivel = false;

    // Propriedades do Boss
    this.largura = 120; 
    this.altura = 120; 
    this.maxVidas = 30;
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    // Propriedades para Movimento
    this.velocidadeMovimento = 25; // Velocidade do Boss em pixels por segundo
    this.raioDeteccao = 9999;      // Raio de detecção enorme para estar sempre ativo
    this.distanciaMinima = 150;   // Para de se aproximar a esta distância do jogador

    // Configuração da Spritesheet (descomente e ajuste para a sua imagem)
    this.sheet = null;
    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0) {
        // --- AJUSTE OS VALORES AQUI ---
        let linhas = 2;    // Quantas linhas de animação tem sua imagem do Boss?
        let colunas = 4;   // Quantos quadros (colunas) por linha?
        // --------------------------------

        this.sheet = new Spritesheet(this.context, this.imagem, linhas, colunas); 
        this.sheet.intervalo = 250; // Velocidade da animação (tempo em ms entre frames)
        
        // Atualiza a largura e altura do Boss para o tamanho de um único frame
        this.largura = this.imagem.width / colunas;
        this.altura = this.imagem.height / linhas;
    } else {
        console.warn("Boss: Imagem não carregada ou spritesheet não configurada. Usando dimensões de fallback.");
    }

    // Hitbox
    this.hitboxOffsetX = 15; 
    this.hitboxOffsetY = 15;
    this.hitboxLargura = this.largura - 30; // Ex: largura total - (2 * offsetX)
    this.hitboxAltura = this.altura - 30;  // Ex: altura total - (2 * offsetY)

    console.log(`Boss criado em (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) com ${this.vidas} vidas.`);
}

Boss.prototype = {
    atualizar: function(deltaTime) {
        if (this.estaMorto) return;

        // Lógica de Movimento
        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) return;

        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroBossX = this.x + this.largura / 2;
        let distancia = Math.abs(centroJogadorX - centroBossX); // Distância horizontal

        if (distancia <= this.raioDeteccao) {
            if (distancia > this.distanciaMinima) {
                // Persegue o jogador
                let dx = centroJogadorX - centroBossX;
                let dy = (this.jogadorAlvo.y + (this.jogadorAlvo.altura / 2)) - (this.y + this.altura / 2);
                let normDx = dx / distancia;
                let normDy = dy / distancia; // Mantém movimento em Y para seguir o jogador verticalmente também
                this.x += normDx * this.velocidadeMovimento * deltaTime;
                this.y += normDy * this.velocidadeMovimento * deltaTime;
            }

            // << LÓGICA PARA ATIVAR O ATAQUE >>
            // O Boss pode atirar mesmo quando está parado (perto do jogador)
            let agora = Date.now();
            if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
                this.atirar();
                this.ultimoTiroTempo = agora;
            }
        }
        
        // Manter o Boss dentro dos limites da sua arena
        const ARENA_MIN_X = 4000;
        const ARENA_MAX_X = this.animacao.mundoLargura - this.largura;
        const ARENA_MIN_Y = 0;
        const ARENA_MAX_Y = this.canvas.height - this.altura;
        this.x = Math.max(ARENA_MIN_X, Math.min(this.x, ARENA_MAX_X));
        this.y = Math.max(ARENA_MIN_Y, Math.min(this.y, ARENA_MAX_Y));

        // Atualizar animação da spritesheet
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }
    },
    
    // << NOVO MÉTODO PARA CRIAR UM ÚNICO LASER >>
    spawnLaser: function(direcaoX) {
        // Não cria o laser se o Boss foi derrotado enquanto o tiro estava "agendado"
        if (this.estaMorto) return;

        // Ponto de origem do laser (ajuste se o canhão do boss for em outro lugar)
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        const direcaoY = 0; // Sempre horizontal

        // Cria e adiciona o laser ao jogo
        if (typeof Laser !== 'undefined' && this.animacao && typeof this.animacao.novoSprite === 'function') {
            var laser = new Laser(this.context, origemX, origemY, direcaoX, direcaoY, this.velocidadeLaser, this.canvas, this.animacao);
            this.animacao.novoSprite(laser);
        } else {
            console.error("Boss.spawnLaser: Classe Laser ou animacao.novoSprite não disponível.");
        }
    },

    // << NOVO MÉTODO PARA CONTROLAR A RAJADA DE TIROS >>
    atirar: function() {
        if (!this.jogadorAlvo) return;
        console.log("Boss está atacando!");

        // Determina a direção do tiro
        let direcaoX = (this.jogadorAlvo.x > this.x) ? 1 : -1;

        const numTiros = 3; // O Boss atira 3 lasers por rajada
        const intervaloEntreTiros = 200; // 200ms de intervalo entre cada tiro da rajada

        // Usa setTimeout para espaçar os tiros da rajada
        for (let i = 0; i < numTiros; i++) {
            setTimeout(() => {
                this.spawnLaser(direcaoX);
            }, i * intervaloEntreTiros);
        }
    },

    desenhar: function() {
        if (this.estaMorto && !this.removivel) return; 

        this.context.save();

        let deveVirar = false; 
        if (this.jogadorAlvo) {
            let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
            let enemyCenterX = this.x + this.largura / 2;
            if (playerCenterX > enemyCenterX) { 
                deveVirar = true;
            }
        }
        
        if (deveVirar) {
            this.context.scale(-1, 1);
            var xInvertido = -this.x - this.largura;
            if (this.sheet) {
                this.sheet.desenhar(xInvertido, this.y);
            } else if (this.imagem && this.imagem.complete) {
                this.context.drawImage(this.imagem, xInvertido, this.y, this.largura, this.altura);
            } else {
                this.context.fillStyle = 'darkred';
                this.context.fillRect(xInvertido, this.y, this.largura, this.altura);
            }
        } else {
            if (this.sheet) {
                this.sheet.desenhar(this.x, this.y);
            } else if (this.imagem && this.imagem.complete) {
                this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
            } else {
                this.context.fillStyle = 'darkred';
                this.context.fillRect(this.x, this.y, this.largura, this.altura);
            }
        }

        this.context.restore();

        // Para depuração, você pode descomentar esta linha:
        // this.desenharHitbox();
    },

    desenharHitbox: function() { 
        var hitbox = this.getHitboxMundo();
        this.context.save();
        this.context.strokeStyle = 'yellow';
        this.context.lineWidth = 2;
        this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        this.context.restore();

        // this.desenharHitbox();
    },

    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura,
            altura: this.hitboxAltura
        };
    },

    receberDano: function(quantidade) {
        if (this.estaMorto) return;
        this.vidas -= quantidade;
        console.log(`Boss recebeu ${quantidade} de dano. Vidas restantes: ${this.vidas}/${this.maxVidas}`);
        if (this.vidas <= 0) {
            this.vidas = 0;
            this.morrer();
        }
    },

    morrer: function() {
        if (this.estaMorto) return;
        this.estaMorto = true;
        console.log("BOSS DERROTADO!");
        setTimeout(() => {
            this.removivel = true;
            console.log("Boss marcado para remoção do jogo.");
        }, 1500);
        if (this.animacao && typeof this.animacao.eventoBossDerrotado === 'function') {
            this.animacao.eventoBossDerrotado();
        }
    }
};
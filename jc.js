// jc.js
var JC_DIREITA = 1;
var JC_ESQUERDA = 2;

function JC(context, teclado, imagem, animacao, canvas) {
    // ... (seu construtor JC como antes) ...
    this.context = context;
    this.teclado = teclado;
    this.imagem = imagem;
    this.animacao = animacao;
    this.canvas = canvas;
    this.tipo = 'jogador';

    this.x = 50;
    this.posicaoChao = 300; // Ajuste conforme a altura do seu personagem e chão
    this.y = this.posicaoChao;
    this.alturaPulo = 100;
    this.duracaoPuloMs = 500;
    this.estaPulando = false;
    this.velocidade = 2; // Ajuste conforme necessário

    this.invencivel = false;
    this.duracaoInvencibilidade = 1000; 
    this.tempoInvencivelRestante = 0;

    this.maxVidas = 5;
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    // Configuração da Spritesheet
    // Assumindo que Spritesheet está definida em spritesheet_jc.js ou similar
    if (typeof Spritesheet !== 'undefined') {
        this.sheet = new Spritesheet(context, imagem, 3, 8); // 3 linhas, 8 colunas
        this.sheet.intervalo = 120; // Milissegundos entre frames
    } else {
        console.error("JC: Classe Spritesheet não definida!");
        this.sheet = null; // Evitar erros se Spritesheet não estiver carregada
    }


    this.andando = false;
    this.direcao = JC_DIREITA;

    if (imagem && imagem.complete && imagem.naturalHeight > 0 && this.sheet && this.sheet.numColunas > 0 && this.sheet.numLinhas > 0) {
        this.largura = imagem.width / this.sheet.numColunas;
        this.altura = imagem.height / this.sheet.numLinhas;
    } else {
        this.largura = 40; this.altura = 50;
        // console.warn("JC: Usando dimensões de fallback.");
    }

    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - 10;
    this.hitboxAltura = this.altura - 10;
}

JC.prototype = {
    // ... (seus métodos atualizar, desenhar, pular, atirar, receberDano, morrer, restaurarVidas, getHitboxMundo) ...

    // Certifique-se que este método está aqui:
    ganharVida: function(quantidade) {
        if (this.estaMorto) return;

        if (this.vidas < this.maxVidas) {
            this.vidas += quantidade;
            if (this.vidas > this.maxVidas) {
                this.vidas = this.maxVidas;
            }
            console.log(`[JC] Vida aumentada! Vidas: ${this.vidas}/${this.maxVidas}`);
        } else {
            console.log(`[JC] Tentou ganhar vida, mas já está com vidas no máximo (${this.vidas}/${this.maxVidas}).`);
        }
    },

    // Adicione os outros métodos do JC aqui, se eles não estiverem já no seu arquivo
    // Exemplo:
    atualizar: function(deltaTime) {
        if (this.estaMorto) return;

        // Lógica de invencibilidade
        if (this.invencivel) {
            this.tempoInvencivelRestante -= deltaTime * 1000;
            if (this.tempoInvencivelRestante <= 0) {
                this.invencivel = false;
                this.tempoInvencivelRestante = 0;
            }
        }

        let newX = this.x;
        let direcaoMovimentoIntent = 0;

        if (this.teclado.pressionada(SETA_DIREITA) || this.teclado.pressionada(TECLA_D)) {
            if (!this.andando || this.direcao != JC_DIREITA) {
                if(this.sheet) { this.sheet.linha = 1; this.sheet.coluna = 0; }
            }
            this.andando = true; this.direcao = JC_DIREITA;
            if(this.sheet) this.sheet.proximoQuadro();
            newX += this.velocidade;
            direcaoMovimentoIntent = 1;
        } else if (this.teclado.pressionada(SETA_ESQUERDA) || this.teclado.pressionada(TECLA_A)) {
            if (!this.andando || this.direcao != JC_ESQUERDA) {
                 if(this.sheet) { this.sheet.linha = 2; this.sheet.coluna = 0; }
            }
            this.andando = true; this.direcao = JC_ESQUERDA;
            if(this.sheet) this.sheet.proximoQuadro();
            newX -= this.velocidade;
            direcaoMovimentoIntent = -1;
        } else {
            if (this.andando) {
                if(this.sheet) {
                    this.sheet.linha = 0; // Linha para "parado"
                    if (this.direcao == JC_DIREITA) this.sheet.coluna = 0;
                    else if (this.direcao == JC_ESQUERDA) this.sheet.coluna = 1; // Supondo frame diferente para parado à esquerda
                }
            }
            this.andando = false;
        }
        
        const BARRIER_X_COORD = 4000;
        const BARRIER_START_AREA1 = 0;

        if (this.animacao) {
            if (this.x < BARRIER_X_COORD && direcaoMovimentoIntent === 1) {
                if (newX + this.largura > BARRIER_X_COORD) {
                    if (!this.animacao.condicaoPortao4000Liberado) {
                        newX = BARRIER_X_COORD - this.largura;
                    }
                }
            }
            else if (this.x >= BARRIER_X_COORD && this.animacao.jogadorPassouPortao4000 && direcaoMovimentoIntent === -1) {
                if (newX < BARRIER_X_COORD) {
                    newX = BARRIER_X_COORD;
                }
            }
        }
        this.x = newX;

        if (this.animacao && this.animacao.condicaoPortao4000Liberado && !this.animacao.jogadorPassouPortao4000) {
            if (this.x >= BARRIER_X_COORD) {
                this.animacao.jogadorPassouPortao4000 = true;
                console.log("JC: Oficialmente na Área 2 (4000-5000px). Não pode mais voltar.");
            }
        }
        
        if (this.animacao && typeof this.animacao.mundoLargura !== 'undefined') {
            if (this.x < BARRIER_START_AREA1) this.x = BARRIER_START_AREA1;
            if (this.x + this.largura > this.animacao.mundoLargura) {
                this.x = this.animacao.mundoLargura - this.largura;
            }
        }
    },
    desenhar: function() {
        if (this.estaMorto) return; // Ou desenhar sprite de morte

        let deveDesenharSprite = true;
        if (this.invencivel) {
            deveDesenharSprite = Math.floor(Date.now() / 100) % 2 === 0;
        }

        if (deveDesenharSprite && this.sheet) {
            this.sheet.desenhar(this.x, this.y);
        } else if (deveDesenharSprite && !this.sheet) { // Fallback se sheet não existir
            this.context.fillStyle = "blue";
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
        }
        // this.desenharHitbox();
    },
    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX, y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura, altura: this.hitboxAltura
        };
    },
    pular: function() {
        if (this.estaMorto || this.estaPulando) return;
        this.estaPulando = true;
        let yInicialPulo = this.y;
        let tempoPuloDecorrido = 0;
        const duracaoSubida = this.duracaoPuloMs / 2;
        const duracaoDescida = this.duracaoPuloMs / 2;

        const animarPulo = (timestamp) => {
            if (!this.inicioPulo) this.inicioPulo = timestamp;
            tempoPuloDecorrido = timestamp - this.inicioPulo;

            if (tempoPuloDecorrido < duracaoSubida) {
                // Fase de subida (parábola simples)
                let progresso = tempoPuloDecorrido / duracaoSubida; // 0 a 1
                this.y = yInicialPulo - this.alturaPulo * (1 - Math.pow(1 - progresso, 2)); 
            } else if (tempoPuloDecorrido < this.duracaoPuloMs) {
                // Fase de descida
                let progressoDescida = (tempoPuloDecorrido - duracaoSubida) / duracaoDescida; // 0 a 1
                this.y = (yInicialPulo - this.alturaPulo) + this.alturaPulo * Math.pow(progressoDescida, 2);
            } else {
                // Fim do pulo
                this.y = this.posicaoChao;
                this.estaPulando = false;
                this.inicioPulo = null; 
                return;
            }
            requestAnimationFrame(animarPulo);
        };
        requestAnimationFrame(animarPulo);
    },
    atirar: function() {
        if (this.estaMorto) return;
        var xBola, yBola, direcaoTiro;
        yBola = this.y + (this.altura / 3) - 3; // Raio 6 da AguaBenta / 2 = 3

        if (this.direcao == JC_DIREITA) {
            xBola = this.x + this.largura; direcaoTiro = 1;
        } else { 
            xBola = this.x; direcaoTiro = -1;
        }
        if (typeof AguaBenta !== 'undefined' && this.animacao && this.animacao.novoSprite) {
            var agua = new AguaBenta(this.context, xBola, yBola, direcaoTiro, this.canvas);
            this.animacao.novoSprite(agua);
        }
    },
    receberDano: function() {
        if (this.invencivel || this.estaMorto) return;
        this.vidas--;
        this.invencivel = true;
        this.tempoInvencivelRestante = this.duracaoInvencibilidade;
        if (this.vidas <= 0) {
            this.vidas = 0; this.morrer();
        }
    },
    morrer: function() {
        if (this.estaMorto) return;
        this.estaMorto = true; this.andando = false;
        console.log("[JC.JS - morrer] JC Morreu! Vidas:", this.vidas);
        // Lógica de game over ou reinício pode ser chamada a partir daqui,
        // talvez notificando a 'animacao'.
        // Ex: if(this.animacao) this.animacao.gameOver();
    },
    restaurarVidas: function() {
        this.vidas = this.maxVidas;
        this.estaMorto = false;
        this.invencivel = false;
        this.tempoInvencivelRestante = 0;
        if(this.sheet) { this.sheet.linha = 0; this.sheet.coluna = 0; }
        this.y = this.posicaoChao; // Reposiciona no chão
        console.log("[JC.JS - restaurarVidas] JC vidas restauradas! Vidas:", this.vidas);
    }
};
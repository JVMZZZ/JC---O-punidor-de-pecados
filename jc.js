// jc.js
var JC_DIREITA = 1;
var JC_ESQUERDA = 2;

function JC(context, teclado, imagem, animacao, canvas) {
    this.context = context;
    this.teclado = teclado;
    this.imagem = imagem;
    this.animacao = animacao;
    this.canvas = canvas;
    this.tipo = 'jogador';

    this.x = 50;
    
    // Configuração da Spritesheet (é importante que largura/altura sejam definidas antes de calcular a posição no chão)
    if (typeof Spritesheet !== 'undefined') {
        this.sheet = new Spritesheet(context, imagem, 3, 8); // 3 linhas, 8 colunas
        this.sheet.intervalo = 120;
    } else {
        console.error("JC: Classe Spritesheet não definida!");
        this.sheet = null;
    }

    if (imagem && imagem.complete && imagem.naturalHeight > 0 && this.sheet && this.sheet.numColunas > 0 && this.sheet.numLinhas > 0) {
        this.largura = imagem.width / this.sheet.numColunas;
        this.altura = imagem.height / this.sheet.numLinhas;
    } else {
        this.largura = 40; this.altura = 50;
    }

    // << MUDANÇA PARA POSICIONAR O JOGADOR NO CHÃO COM EFEITO DE PROFUNDIDADE >>
    const alturaChao = 200; // Deve ser o mesmo valor usado em animacao.js para desenhar o chão
    const overlap3D = 10;   // Quantos pixels o jogador "afunda" no chão para dar o efeito 3D

    // A superfície do chão está em: this.canvas.height - alturaChao
    // Posicionamos o jogador para que seus pés fiquem NESSA linha, menos sua altura, e então somamos o overlap.
    this.posicaoChao = (this.canvas.height - alturaChao - this.altura) + overlap3D;
    
    this.y = this.posicaoChao; // Define a posição Y inicial com base no cálculo acima
    this.alturaPulo = 100;
    this.duracaoPuloMs = 500;
    this.estaPulando = false;
    this.velocidade = 1.8;

    this.invencivel = false;
    this.duracaoInvencibilidade = 1000; 
    this.tempoInvencivelRestante = 0;

    this.maxVidas = 5;
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    this.andando = false;
    this.direcao = JC_DIREITA;

    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - 10;
    this.hitboxAltura = this.altura - 10;
}

JC.prototype = {
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

        // Lógica de movimento e animação
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
                    this.sheet.linha = 0;
                    if (this.direcao == JC_DIREITA) this.sheet.coluna = 0;
                    else if (this.direcao == JC_ESQUERDA) this.sheet.coluna = 1;
                }
            }
            this.andando = false;
        }
        
        // Lógica da barreira condicional
        const BARRIER_X_COORD = 4000;
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

        // Atualiza a flag de que passou o portão
        if (this.animacao && this.animacao.condicaoPortao4000Liberado && !this.animacao.jogadorPassouPortao4000) {
            if (this.x >= BARRIER_X_COORD) {
                this.animacao.jogadorPassouPortao4000 = true;
                console.log("JC: Oficialmente na Área 2 (4000-5000px). Não pode mais voltar.");
            }
        }
        
        // Limites do mundo
        if (this.animacao && typeof this.animacao.mundoLargura !== 'undefined') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.largura > this.animacao.mundoLargura) {
                this.x = this.animacao.mundoLargura - this.largura;
            }
        }
    },

    desenhar: function() {
        if (this.estaMorto) return;

        let deveDesenharSprite = true;
        if (this.invencivel) {
            deveDesenharSprite = Math.floor(Date.now() / 100) % 2 === 0;
        }

        if (deveDesenharSprite && this.sheet) {
            this.sheet.desenhar(this.x, this.y);
        } else if (deveDesenharSprite && !this.sheet) {
            this.context.fillStyle = "blue";
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
        }
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
        this.inicioPulo = null; // Reseta o tempo de início do pulo
        let yInicialPulo = this.y;

        const animarPulo = (timestamp) => {
            if (!this.estaPulando) return; // Garante que a animação pare se o estado mudar

            if (!this.inicioPulo) this.inicioPulo = timestamp;
            let tempoPuloDecorrido = timestamp - this.inicioPulo;

            if (tempoPuloDecorrido < this.duracaoPuloMs) {
                // Parábola simples para subida e descida
                let progresso = tempoPuloDecorrido / this.duracaoPuloMs; // 0 a 1
                // Fórmula: 4 * h * (x - x^2), onde x é o progresso e h é a altura máxima
                let alturaAtual = 4 * this.alturaPulo * (progresso - (progresso * progresso));
                this.y = this.posicaoChao - alturaAtual;
            } else {
                // Fim do pulo
                this.y = this.posicaoChao;
                this.estaPulando = false;
                return;
            }
            requestAnimationFrame(animarPulo);
        };
        requestAnimationFrame(animarPulo);
    },
    
    atirar: function() {
        if (this.estaMorto) return;
        var xBola, yBola, direcaoTiro;
        yBola = this.y + (this.altura / 3) - 3;

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

    aumentarVidaMaxima: function(quantidade) {
        if (this.estaMorto) return; // Não faz nada se já estiver morto

        this.maxVidas += quantidade; // Aumenta o total de corações que ele pode ter
        this.vidas = this.maxVidas;  // Recupera toda a vida para o novo máximo

        console.log(`[JC] PODER AUMENTADO! Vida máxima agora é ${this.maxVidas}. Vida totalmente recuperada!`);
        // Aqui seria um ótimo lugar para tocar um som de "power-up"!
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
        this.estaMorto = true; 
        this.andando = false;
        console.log("[JC.JS - morrer] JC Morreu! Vidas:", this.vidas);

        // << ADIÇÃO: Notificar a animação que o jogo acabou >>
        if (this.animacao && typeof this.animacao.gameOver === 'function') {
            this.animacao.gameOver();
        }
    },

    restaurarVidas: function() {
        this.vidas = this.maxVidas;
        this.estaMorto = false;
        this.invencivel = false;
        this.tempoInvencivelRestante = 0;
        if(this.sheet) { this.sheet.linha = 0; this.sheet.coluna = 0; }
        this.y = this.posicaoChao;
        console.log("[JC.JS - restaurarVidas] JC vidas restauradas! Vidas:", this.vidas);
    }
};
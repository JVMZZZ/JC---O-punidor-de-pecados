var JC_DIREITA = 1;
var JC_ESQUERDA = 2;
// Constantes das teclas já devem estar em teclado.js

// Modifique o Construtor para receber 'animacao' e 'canvas'
function JC(context, teclado, imagem, animacao, canvas) { // <--- ADICIONADO animacao, canvas
    this.context = context;
    this.teclado = teclado;
    this.imagem = imagem; 
    this.animacao = animacao; 
    this.canvas = canvas;     

    this.x = 50; // Posição X inicial (exemplo)
    this.posicaoChao = 300;
    this.y = this.posicaoChao;
    this.alturaPulo = 80;
    this.duracaoPuloMs = 500;
    this.estaPulando = false;
    this.velocidade = 2; // define a velocidade do JC

    // --- PROPRIEDADES DE VIDA ---
    this.maxVidas = 5; // Número máximo de vidas
    this.vidas = this.maxVidas; // JC começa com o máximo de vidas
    this.estaMorto = false; // Flag para indicar se o JC morreu

    this.sheet = new Spritesheet(context, imagem, 3, 8);
    this.sheet.intervalo = 120; // Intervalo da animação

    this.andando = false;
    this.direcao = JC_DIREITA; // JC_DIREITA (1), JC_ESQUERDA (2)

    // Ajustes para o tiro
    if (imagem.complete && imagem.naturalHeight > 0) { // Verifica se a imagem carregou
        this.largura = imagem.width / this.sheet.numColunas;
        this.altura = imagem.height / this.sheet.numLinhas;
    } else {
        this.largura = 90; 
        this.altura = 90;  
        console.warn("JC: Imagem não carregada no momento da criação, usando dimensões estimadas para largura/altura.");
    }
    console.log("JC criado com largura:", this.largura, "altura:", this.altura);
    // ...
}


JC.prototype = {
    atualizar: function() {
        // ... (seu código de atualizar para movimento e pulo continua igual)
        if (this.teclado.pressionada(SETA_DIREITA) || this.teclado.pressionada(TECLA_D)) {
            if (!this.andando || this.direcao != JC_DIREITA) {
                this.sheet.linha = 1;
                this.sheet.coluna = 0;
            }
            this.andando = true;
            this.direcao = JC_DIREITA;
            this.sheet.proximoQuadro();
            this.x += this.velocidade;
        } else if (this.teclado.pressionada(SETA_ESQUERDA) || this.teclado.pressionada(TECLA_A)) {
            if (!this.andando || this.direcao != JC_ESQUERDA) {
                this.sheet.linha = 2;
                this.sheet.coluna = 0;
            }
            this.andando = true;
            this.direcao = JC_ESQUERDA;
            this.sheet.proximoQuadro();
            this.x -= this.velocidade;
        } else {
            if (this.andando) {
                this.sheet.linha = 0;
                if (this.direcao == JC_DIREITA) {
                    this.sheet.coluna = 0;
                } else if (this.direcao == JC_ESQUERDA) {
                    this.sheet.coluna = 1; // Verifique sua spritesheet
                }
            }
            this.andando = false;
        }

        if (this.x < 0) {
        this.x = 0;
        }
        // Limite direito do mundo
        // this.largura é a largura do sprite do JC, calculada no construtor
        if (this.x + this.largura > this.animacao.mundoLargura) {
            this.x = this.animacao.mundoLargura - this.largura;
        }


    },

    desenhar: function() {
        this.sheet.desenhar(this.x, this.y);
    },

    pular: function() {
        // ... (seu código de pular continua igual)
        if (!this.estaPulando) {
            console.log("JC pulou!");
            this.estaPulando = true;
            this.y -= this.alturaPulo;
            setTimeout(() => {
                this.y = this.posicaoChao;
                this.estaPulando = false;
                console.log("JC aterrissou!");
            }, this.duracaoPuloMs);
        }
    },

    // MÉTODO: ATIRAR ---
    atirar: function() {
        console.log("JC Atirou!"); // Log para depuração

        // Define a posição inicial da bola (ex: na frente e no meio do JC)
        var xBola, yBola;
        var direcaoTiro;

        // Ajustar yBola para sair aproximadamente do meio do personagem
        // Usamos this.altura (calculado no construtor)
        yBola = this.y + (this.altura / 3) - 3; // O -3 é um pequeno ajuste para centralizar melhor o raio da bola

        if (this.direcao == JC_DIREITA) {
            // Se JC está virado para a direita, a bola sai da frente direita
            xBola = this.x + this.largura; // this.largura é a largura do sprite do JC
            direcaoTiro = 1; // Direção para a direita
        } else { // JC_ESQUERDA
            // Se JC está virado para a esquerda, a bola sai da frente esquerda
            xBola = this.x; // A bola sai da borda esquerda do JC
            direcaoTiro = -1; // Direção para a esquerda
        }

        // Cria uma nova bola azul
        var bola = new AguaBenta(this.context, xBola, yBola, direcaoTiro, this.canvas);

        // Adiciona a bola ao sistema de animação para que ela seja atualizada e desenhada
        this.animacao.novoSprite(bola);
    },

    // Estar vivo
    estaVivo : function() {
        return !this.estaMorto; // ou return this.vidas > 0;
    }
    ,
    // MÉTODO Sofrer Dano
    sofrerDano : function(quantidade) {
    // --- NOVO LOG AQUI ---
        console.log('[JC.JS - sofrerDano INÍCIO] Vidas ANTES do dano:', this.vidas, 'Esta Morto:', this.estaMorto);
        // ---------------------

        if (this.estaMorto) {
            console.log('[JC.JS - sofrerDano] Tentou sofrer dano, mas já está morto.');
            return;
        }

        this.vidas -= quantidade;
        console.log('[JC.JS - sofrerDano MEIO] Vidas DEPOIS de subtrair:', this.vidas);

        if (this.vidas <= 0) {
            this.vidas = 0;
            this.morrer();
        }
    },
    // MÉTODO Morrer
    morrer : function() {
        this.estaMorto = true;
        console.log("[JC.JS - morrer] JC Morreu! (estaMorto agora é true, Vidas:", this.vidas + ")");
    }
};
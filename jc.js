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
    this.posicaoChao = 300;
    this.y = this.posicaoChao;
    this.alturaPulo = 80;
    this.duracaoPuloMs = 500;
    this.estaPulando = false;
    this.velocidade = 2;

    this.invencivel = false;
    this.duracaoInvencibilidade = 1000; // 1 segundo de invencibilidade
    this.tempoInvencivelRestante = 0;

    this.maxVidas = 5;
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    this.sheet = new Spritesheet(context, imagem, 3, 8);
    this.sheet.intervalo = 120;

    this.andando = false;
    this.direcao = JC_DIREITA;

    if (imagem.complete && imagem.naturalHeight > 0 && this.sheet.numColunas > 0 && this.sheet.numLinhas > 0) {
        this.largura = imagem.width / this.sheet.numColunas;
        this.altura = imagem.height / this.sheet.numLinhas;
    } else {
        this.largura = 40; this.altura = 50;
        console.warn("JC: Usando dimensões de fallback.");
    }

    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - 10;
    this.hitboxAltura = this.altura - 10;

    console.log("JC criado. L:", this.largura, "A:", this.altura, "Vidas:", this.vidas);
}

JC.prototype = {
    atualizar: function(deltaTime) {
        if (this.estaMorto) return;

        // Lógica de invencibilidade
        if (this.invencivel) {
            this.tempoInvencivelRestante -= deltaTime * 1000; // deltaTime geralmente é em segundos
            if (this.tempoInvencivelRestante <= 0) {
                this.invencivel = false;
                this.tempoInvencivelRestante = 0;
                // console.log("[JC.JS - atualizar] JC NÃO está mais invencível");
            }
        }

        // Lógica de movimento (como antes)
        if (this.teclado.pressionada(SETA_DIREITA) || this.teclado.pressionada(TECLA_D)) {
            if (!this.andando || this.direcao != JC_DIREITA) {
                this.sheet.linha = 1;
                this.sheet.coluna = 0;
            }
            this.andando = true; this.direcao = JC_DIREITA;
            this.sheet.proximoQuadro();
            this.x += this.velocidade;
        } else if (this.teclado.pressionada(SETA_ESQUERDA) || this.teclado.pressionada(TECLA_A)) {
            if (!this.andando || this.direcao != JC_ESQUERDA) {
                this.sheet.linha = 2;
                this.sheet.coluna = 0;
            }
            this.andando = true; this.direcao = JC_ESQUERDA;
            this.sheet.proximoQuadro();
            this.x -= this.velocidade;
        } else {
            if (this.andando) {
                this.sheet.linha = 0;
                if (this.direcao == JC_DIREITA) {
                    this.sheet.coluna = 0;
                } else if (this.direcao == JC_ESQUERDA) {
                    this.sheet.coluna = 1;
                }
            }
            this.andando = false;
        }
        
        // Limites do mundo
        if (this.animacao && typeof this.animacao.mundoLargura !== 'undefined') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.largura > this.animacao.mundoLargura) {
                this.x = this.animacao.mundoLargura - this.largura;
            }
        }
    },

    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX, y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura, altura: this.hitboxAltura
        };
    },

    desenharHitbox: function() {
        var hitbox = this.getHitboxMundo(); var ctx = this.context;
        ctx.save(); ctx.strokeStyle = 'lime'; ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    },

    desenhar: function() {
        if (this.estaMorto && this.sheet.linha !== 2 && this.sheet.coluna !==7) { // Adicionar condição para animação de morte se tiver uma específica.
             // Exemplo: this.sheet.linha = X; this.sheet.coluna = Y; // Sprite de morte
             // Por enquanto, se estiver morto, não desenha nada após a lógica de invencibilidade.
             // Se você quiser uma animação de morte, ela seria tratada aqui ou no atualizar.
             // Se a morte for instantânea e sem sprite específico, pode apenas retornar:
             // return; // Ou desenhar um sprite de "game over" ou túmulo.
        }

        let deveDesenharSprite = true;
        if (this.invencivel) {
            // Lógica de piscar quando invencível
            deveDesenharSprite = Math.floor(Date.now() / 100) % 2 === 0;
        }

        if (deveDesenharSprite) {
            this.sheet.desenhar(this.x, this.y);
        }
        
        // this.desenharHitbox(); // Descomente para ver a hitbox
    },

    pular: function() {
        if (this.estaMorto || this.estaPulando) return;
        // console.log("JC pulou!");
        this.estaPulando = true;
        this.y -= this.alturaPulo; // Pulo simples, pode ser melhorado com gravidade
        setTimeout(() => {
            this.y = this.posicaoChao; this.estaPulando = false; // console.log("JC aterrissou!");
        }, this.duracaoPuloMs);
    },

    atirar: function() {
        if (this.estaMorto) {
            // console.log("[JC.JS atirar] JC está morto, não pode atirar.");
            return;
        }
        // console.log("[JC.JS atirar] >>> Método atirar INICIADO. estaMorto:", this.estaMorto, "Vidas:", this.vidas);

        var xBola, yBola;
        var direcaoTiro;

        yBola = this.y + (this.altura / 3) - (6/2); // Raio da AguaBenta é 6 (assumindo)

        if (this.direcao == JC_DIREITA) {
            xBola = this.x + this.largura;
            direcaoTiro = 1;
        } else { 
            xBola = this.x;
            direcaoTiro = -1;
        }

        try {
            if (typeof AguaBenta !== 'undefined' && this.animacao && typeof this.animacao.novoSprite === 'function') {
                var agua = new AguaBenta(this.context, xBola, yBola, direcaoTiro, this.canvas);
                this.animacao.novoSprite(agua);
                // console.log("[JC.JS atirar] AguaBenta adicionada à animação com sucesso.");
            } else {
                console.error("[JC.JS atirar] ERRO: Classe AguaBenta não definida ou this.animacao.novoSprite não é uma função.");
            }
        } catch (e) {
            console.error("[JC.JS atirar] ERRO CRÍTICO ao criar ou adicionar AguaBenta:", e);
        }
        // console.log("[JC.JS atirar] <<< Método atirar FINALIZADO.");
    },

    // NOVA FUNÇÃO ADICIONADA:
    receberDano: function(danoInfo) { // danoInfo pode ser um objeto com {dano: 1, tipo: 'laser'} ou apenas a quantidade de dano. Por ora, vamos assumir dano de 1.
        // 1. Se já estiver invencível ou morto, não faz nada.
        if (this.invencivel || this.estaMorto) {
            return;
        }

        console.log("[JC.JS - receberDano] Jogador recebeu dano!");

        // 2. Diminui uma vida
        this.vidas--;
        console.log("[JC.JS - receberDano] Vidas restantes:", this.vidas);

        // 3. Ativa a invencibilidade
        this.invencivel = true;
        this.tempoInvencivelRestante = this.duracaoInvencibilidade;
        // console.log("[JC.JS - receberDano] Jogador ficou invencível por", this.duracaoInvencibilidade, "ms");

        // Efeito sonoro de dano (opcional)
        // var somDano = new Audio('snd/dano_jogador.mp3'); // Exemplo
        // somDano.play();

        // 4. Verifica se o jogador morreu
        if (this.vidas <= 0) {
            this.vidas = 0; // Garante que não fique negativo
            this.morrer(); // Chama a função que define estaMorto = true
        }
    },

    morrer: function() {
        if (this.estaMorto) return; // Evita chamar múltiplas vezes

        this.estaMorto = true;
        this.andando = false; // Para qualquer animação de movimento
        console.log("[JC.JS - morrer] JC Morreu! Vidas:", this.vidas);
        // Aqui você pode adicionar lógica para uma animação de morte, som, etc.
        // Ex: this.sheet.linha = 2; this.sheet.coluna = 7; // Supondo que este é o sprite de morte
        // this.sheet.intervalo = 0; // Para parar a animação no sprite de morte, se for um único quadro

        // Poderia também notificar o sistema de animação ou o jogo principal que o jogador morreu
        // if (this.animacao && typeof this.animacao.jogadorMorreu === 'function') {
        // this.animacao.jogadorMorreu();
        // }
    },

    restaurarVidas: function() {
        this.vidas = this.maxVidas;
        this.estaMorto = false;
        this.invencivel = false;
        this.tempoInvencivelRestante = 0;
        // Resetar sprite para o inicial parado
        this.sheet.linha = 0;
        this.sheet.coluna = 0;
        console.log("[JC.JS - restaurarVidas] JC vidas restauradas! Vidas:", this.vidas);
    }
};
// jc.js
var JC_DIREITA = 1;
var JC_ESQUERDA = 2;

function JC(context, teclado, imagem, animacao, canvas) {
    this.context = context;
    this.teclado = teclado;
    this.imagem = imagem;
    this.animacao = animacao;
    this.canvas = canvas;
    this.tipo = 'jogador'; // <<--- MUDANÇA/CORREÇÃO: Tipo para colisões

    this.x = 50;
    this.posicaoChao = 300;
    this.y = this.posicaoChao;
    this.alturaPulo = 80;
    this.duracaoPuloMs = 500;
    this.estaPulando = false;
    this.velocidade = 2;

    this.invencivel = false;
    this.duracaoInvencibilidade = 1000;
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

        if (this.invencivel) {
            this.tempoInvencivelRestante -= deltaTime * 1000;
            if (this.tempoInvencivelRestante <= 0) {
                this.invencivel = false;
                this.tempoInvencivelRestante = 0;
                // console.log("[JC.JS - atualizar] JC NÃO está mais invencível");
            }
        }

        if (this.teclado.pressionada(SETA_DIREITA) || this.teclado.pressionada(TECLA_D)) {
            if (!this.andando || this.direcao != JC_DIREITA) {
                this.sheet.linha = 1; // Andando para direita
                this.sheet.coluna = 0;
            }
            this.andando = true; this.direcao = JC_DIREITA;
            this.sheet.proximoQuadro();
            this.x += this.velocidade;
        } else if (this.teclado.pressionada(SETA_ESQUERDA) || this.teclado.pressionada(TECLA_A)) {
            if (!this.andando || this.direcao != JC_ESQUERDA) {
                this.sheet.linha = 2; // Andando para esquerda
                this.sheet.coluna = 0; // <<--- MUDANÇA/CORREÇÃO: Animações geralmente começam na coluna 0
                                      // Se sua animação de andar para esquerda na linha 2 realmente começa no quadro 1, mantenha 1.
                                      // Mas o padrão é começar em 0.
            }
            this.andando = true; this.direcao = JC_ESQUERDA;
            this.sheet.proximoQuadro();
            this.x -= this.velocidade;
        } else { // Parado
            if (this.andando) {
                // console.log("[JC Parado] Direção anterior:", (this.direcao === JC_DIREITA ? "DIREITA" : "ESQUERDA"));
                this.sheet.linha = 0; // Linha para JC parado
                if (this.direcao == JC_DIREITA) {
                    this.sheet.coluna = 0;
                    // console.log("[JC Parado] Sprite: Parado Direita (L0, C0)");
                } else if (this.direcao == JC_ESQUERDA) {
                    this.sheet.coluna = 1; // Assumindo que sua linha 0, coluna 1 é "parado esquerda"
                    // console.log("[JC Parado] Sprite: Parado Esquerda (L0, C1)");
                }
            }
            this.andando = false;
        }
        
        if (this.animacao && typeof this.animacao.mundoLargura !== 'undefined') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.largura > this.animacao.mundoLargura) {
                this.x = this.animacao.mundoLargura - this.largura;
            }
        }
    },

    getHitboxMundo: function() { /* ... como antes ... */ 
        return {
            x: this.x + this.hitboxOffsetX, y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura, altura: this.hitboxAltura
        };
    },
    desenharHitbox: function() { /* ... como antes ... */ 
        var hitbox = this.getHitboxMundo(); var ctx = this.context;
        ctx.save(); ctx.strokeStyle = 'lime'; ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    },
    desenhar: function() { /* ... como antes, com a lógica de piscar ... */
        if (this.estaMorto) return;
        let deveDesenharSprite = true;
        if (this.invencivel) {
            deveDesenharSprite = Math.floor(Date.now() / 100) % 2 === 0;
        }
        if (deveDesenharSprite) {
            this.sheet.desenhar(this.x, this.y);
        }
        // this.desenharHitbox(); 
    },
    pular: function() { /* ... como antes, com a verificação if (this.estaMorto || this.estaPulando) return; ... */
        if (this.estaMorto || this.estaPulando) return;
        console.log("JC pulou!"); this.estaPulando = true; this.y -= this.alturaPulo;
        setTimeout(() => {
            this.y = this.posicaoChao; this.estaPulando = false; console.log("JC aterrissou!");
        }, this.duracaoPuloMs);
    },
    atirar: function() { /* ... como antes, com if (this.estaMorto) return; ... */
        console.log("[JC.JS atirar] >>> Método atirar INICIADO. estaMorto:", this.estaMorto, "Vidas:", this.vidas); // Log 4
    if (this.estaMorto) {
        console.log("[JC.JS atirar] JC está morto, não pode atirar."); // Log 5
        return;
    }

    var xBola, yBola;
    var direcaoTiro;

    // Logs para verificar as variáveis usadas no cálculo da posição do tiro
    console.log("[JC.JS atirar] this.y:", this.y, "this.altura:", this.altura, "this.x:", this.x, "this.largura:", this.largura, "this.direcao:", this.direcao); // Log 6

    yBola = this.y + (this.altura / 3) - (6/2); // Raio da AguaBenta é 6

    if (this.direcao == JC_DIREITA) {
        xBola = this.x + this.largura;
        direcaoTiro = 1;
    } else { 
        xBola = this.x;
        direcaoTiro = -1;
    }
    console.log("[JC.JS atirar] Posição calculada do tiro: xBola=", xBola, "yBola=", yBola, "direcaoTiro=", direcaoTiro); // Log 7

    try {
        // Certifique-se que a classe AguaBenta está definida e o arquivo aguabenta.js carregado
        var agua = new AguaBenta(this.context, xBola, yBola, direcaoTiro, this.canvas);
        console.log("[JC.JS atirar] Instância de AguaBenta criada:", agua); // Log 8

        if (this.animacao && typeof this.animacao.novoSprite === 'function') {
            this.animacao.novoSprite(agua);
            console.log("[JC.JS atirar] AguaBenta adicionada à animação com sucesso."); // Log 9
        } else {
            console.error("[JC.JS atirar] ERRO: this.animacao ou this.animacao.novoSprite não está definido!", this.animacao); // Log 10
        }
    } catch (e) {
        console.error("[JC.JS atirar] ERRO CRÍTICO ao criar ou adicionar AguaBenta:", e); // Log 11
    }
    console.log("[JC.JS atirar] <<< Método atirar FINALIZADO."); // Log 12
},
    morrer: function() { /* ... como antes ... */
        this.estaMorto = true;
        console.log("[JC.JS - morrer] JC Morreu! Vidas:", this.vidas);
    },
    restaurarVidas: function() { /* ... como antes ... */
        this.vidas = this.maxVidas; this.estaMorto = false;
        console.log("JC vidas restauradas! Vidas:", this.vidas);
    }
};
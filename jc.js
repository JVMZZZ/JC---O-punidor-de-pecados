// jc.js
// Este arquivo define a classe 'JC', que representa o personagem principal
// controlado pelo jogador. Gerencia seu estado, movimento, animações e interações.

// --- Constantes para Direção ---
// Usadas para legibilidade do código ao verificar e definir a direção do personagem.
var JC_DIREITA = 1;
var JC_ESQUERDA = 2;

/**
 * Construtor para a entidade JC (o jogador).
 */
function JC(context, teclado, imagem, animacao, canvas) {
    // --- Referências e Configurações Básicas ---
    this.context = context;
    this.teclado = teclado;
    this.imagem = imagem;
    this.animacao = animacao; // Referência ao motor do jogo para comunicação.
    this.canvas = canvas;
    this.tipo = 'jogador'; // Identificador para o sistema de colisões.

    this.x = 50; // Posição inicial no eixo X.
    
    // --- Configuração da Spritesheet para Animação ---
    if (typeof Spritesheet !== 'undefined') {
        // Inicializa o controlador da spritesheet com 3 linhas e 8 colunas.
        // Linha 0: Parado (direita/esquerda)
        // Linha 1: Andando para a direita
        // Linha 2: Andando para a esquerda
        this.sheet = new Spritesheet(context, imagem, 3, 8);
        this.sheet.intervalo = 120; // Tempo (em ms) entre cada quadro da animação.
    } else {
        console.error("JC: Classe Spritesheet não definida!");
        this.sheet = null;
    }

    // Calcula a largura e altura de um único quadro do personagem.
    if (imagem && imagem.complete && imagem.naturalHeight > 0 && this.sheet && this.sheet.numColunas > 0 && this.sheet.numLinhas > 0) {
        this.largura = imagem.width / this.sheet.numColunas;
        this.altura = imagem.height / this.sheet.numLinhas;
    } else {
        this.largura = 40; this.altura = 50; // Valores de fallback caso a imagem falhe.
    }

    // --- Posicionamento e Física ---
    // Calcula a posição Y para que os pés do jogador fiquem alinhados com o chão.
    const alturaChao = 200; // Deve ser o mesmo valor do motor de animação.
    const overlap3D = 10;   // Pixels que o jogador "afunda" no chão para um efeito 2.5D.
    // A posição Y é calculada como: (linha do chão - altura do jogador) + sobreposição.
    this.posicaoChao = (this.canvas.height - alturaChao - this.altura) + overlap3D;
    
    this.y = this.posicaoChao; // Posição inicial no eixo Y.
    this.alturaPulo = 100; // Altura máxima que o pulo alcança.
    this.duracaoPuloMs = 500; // Duração total do pulo em milissegundos.
    this.estaPulando = false; // Flag que controla se o jogador está no ar.
    this.velocidade = 1.8; // Velocidade de movimento horizontal.

    // --- Estado de Combate e Vidas ---
    this.invencivel = false; // Flag para controlar se o jogador pode levar dano.
    this.duracaoInvencibilidade = 1000; // Tempo (em ms) de invencibilidade após sofrer dano.
    this.tempoInvencivelRestante = 0; // Contador regressivo para a invencibilidade.
    this.maxVidas = 5; // Vida máxima.
    this.vidas = this.maxVidas; // Vida atual.
    this.estaMorto = false; // Flag que controla se o jogador foi derrotado.

    // --- Estado de Animação ---
    this.andando = false; // Flag para controlar se o jogador está se movendo.
    this.direcao = JC_DIREITA; // Direção para a qual o jogador está virado.

    // --- Configuração da Hitbox (Caixa de Colisão) ---
    this.hitboxOffsetX = 5;
    this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - 10;
    this.hitboxAltura = this.altura - 10;

    // propriedade para rastrear o dano durante a batalha final.
    this.sofreuDanoNaBatalhaFinal = false;
}

JC.prototype = {
    /**
     * Aumenta a vida do jogador, sem ultrapassar o máximo.
     */
    ganharVida: function(quantidade) {
        if (this.estaMorto) return;
        if (this.vidas < this.maxVidas) {
            this.vidas += quantidade;
            // Garante que a vida não ultrapasse o valor máximo.
            if (this.vidas > this.maxVidas) {
                this.vidas = this.maxVidas;
            }
            console.log(`[JC] Vida aumentada! Vidas: ${this.vidas}/${this.maxVidas}`);
        } else {
            console.log(`[JC] Tentou ganhar vida, mas já está com vidas no máximo (${this.vidas}/${this.maxVidas}).`);
        }
    },

    // método para ser chamado quando a batalha do boss começa.
    iniciarContagemDanoBoss: function() {
        this.sofreuDanoNaBatalhaFinal = false;
        console.log("[JC] Contagem de dano na batalha final iniciada.");
    },

    /**
     * Atualiza a lógica do jogador a cada quadro (input, movimento, estado).
     */
    atualizar: function(deltaTime) {
        // Se o jogador está morto, interrompe todas as atualizações.
        if (this.estaMorto) return;

        // --- Lógica de Invencibilidade ---
        if (this.invencivel) {
            // Decrementa o tempo de invencibilidade restante.
            this.tempoInvencivelRestante -= deltaTime * 1000;
            // Se o tempo acabar, desativa a invencibilidade.
            if (this.tempoInvencivelRestante <= 0) {
                this.invencivel = false;
                this.tempoInvencivelRestante = 0;
            }
        }

        let newX = this.x; // Posição X proposta para este quadro.
        let direcaoMovimentoIntent = 0; // Direção do movimento (-1, 0, 1).

        // --- Lógica de Movimento e Animação baseada no Input do Teclado ---
        if (this.teclado.pressionada(SETA_DIREITA) || this.teclado.pressionada(TECLA_D)) {
            // Se não estava andando ou estava virado para outra direção, muda a animação.
            if (!this.andando || this.direcao != JC_DIREITA) {
                if(this.sheet) { this.sheet.linha = 1; this.sheet.coluna = 0; } // Linha 1: Andando para direita.
            }
            this.andando = true; this.direcao = JC_DIREITA;
            if(this.sheet) this.sheet.proximoQuadro(); // Avança o quadro da animação de andar.
            newX += this.velocidade;
            direcaoMovimentoIntent = 1;
        } else if (this.teclado.pressionada(SETA_ESQUERDA) || this.teclado.pressionada(TECLA_A)) {
            // Lógica similar para o movimento à esquerda.
            if (!this.andando || this.direcao != JC_ESQUERDA) {
                if(this.sheet) { this.sheet.linha = 2; this.sheet.coluna = 0; } // Linha 2: Andando para esquerda.
            }
            this.andando = true; this.direcao = JC_ESQUERDA;
            if(this.sheet) this.sheet.proximoQuadro();
            newX -= this.velocidade;
            direcaoMovimentoIntent = -1;
        } else {
            // Se nenhuma tecla de movimento está pressionada, volta para a animação de "parado".
            if (this.andando) {
                if(this.sheet) {
                    this.sheet.linha = 0; // Linha 0: Parado.
                    // A coluna da spritesheet de "parado" depende da última direção.
                    if (this.direcao == JC_DIREITA) this.sheet.coluna = 0;
                    else if (this.direcao == JC_ESQUERDA) this.sheet.coluna = 1;
                }
            }
            this.andando = false;
        }
        
        // --- Lógica da Barreira Condicional (Portão em X=4000) ---
        const BARRIER_X_COORD = 4000;
        if (this.animacao) {
            // Se está se movendo para a direita em direção à barreira...
            if (this.x < BARRIER_X_COORD && direcaoMovimentoIntent === 1) {
                // ...e a nova posição ultrapassaria a barreira...
                if (newX + this.largura > BARRIER_X_COORD) {
                    // ...se o portão NÃO estiver liberado, bloqueia o movimento.
                    if (!this.animacao.condicaoPortao4000Liberado) {
                        newX = BARRIER_X_COORD - this.largura;
                    }
                }
            }
            // Se está na arena do boss e tentando voltar para a esquerda...
            else if (this.x >= BARRIER_X_COORD && this.animacao.jogadorPassouPortao4000 && direcaoMovimentoIntent === -1) {
                // ...bloqueia o movimento para não deixar o jogador sair da arena.
                if (newX < BARRIER_X_COORD) {
                    newX = BARRIER_X_COORD;
                }
            }
        }
        this.x = newX; // Aplica a posição X final.

        // Atualiza a flag de que o jogador passou pelo portão e entrou na arena.
        if (this.animacao && this.animacao.condicaoPortao4000Liberado && !this.animacao.jogadorPassouPortao4000) {
            if (this.x >= BARRIER_X_COORD) {
                this.animacao.jogadorPassouPortao4000 = true;
                console.log("JC: Oficialmente na Área 2 (4000-5000px). Não pode mais voltar.");
            }
        }
        
        // --- Limites do Mundo ---
        // Garante que o jogador não saia dos limites do cenário.
        if (this.animacao && typeof this.animacao.mundoLargura !== 'undefined') {
            if (this.x < 0) this.x = 0; // Limite esquerdo.
            if (this.x + this.largura > this.animacao.mundoLargura) {
                this.x = this.animacao.mundoLargura - this.largura; // Limite direito.
            }
        }
    },

    /**
     * Desenha o jogador no canvas.
     */
    desenhar: function() {
        if (this.estaMorto) return;

        // --- Lógica de "Piscar" durante a Invencibilidade ---
        let deveDesenharSprite = true;
        if (this.invencivel) {
            // Alterna entre desenhar e não desenhar a cada 100ms para criar o efeito de piscar.
            deveDesenharSprite = Math.floor(Date.now() / 100) % 2 === 0;
        }

        if (deveDesenharSprite && this.sheet) {
            this.sheet.desenhar(this.x, this.y); // Desenha o quadro atual da spritesheet.
        } else if (deveDesenharSprite && !this.sheet) {
            // Fallback: desenha um retângulo azul se a spritesheet não estiver disponível.
            this.context.fillStyle = "blue";
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
        }
    },

    /**
     * Retorna a caixa de colisão (hitbox) do jogador em coordenadas do mundo.
     */
    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX, y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura, altura: this.hitboxAltura
        };
    },

    /**
     * Inicia a animação de pulo.
     */
    pular: function() {
        if (this.estaMorto || this.estaPulando) return;
        this.estaPulando = true;
        this.inicioPulo = null; // Reseta o tempo de início para a nova animação.

        // Usa 'requestAnimationFrame' para uma animação de pulo suave, em vez de um cálculo de física por frame.
        const animarPulo = (timestamp) => {
            if (!this.estaPulando) return; // Para a animação se o estado mudar.

            if (!this.inicioPulo) this.inicioPulo = timestamp;
            let tempoPuloDecorrido = timestamp - this.inicioPulo;

            if (tempoPuloDecorrido < this.duracaoPuloMs) {
                // Calcula o progresso do pulo (de 0 a 1).
                let progresso = tempoPuloDecorrido / this.duracaoPuloMs;
                // Usa uma fórmula de parábola para calcular a altura atual do pulo.
                // Fórmula: 4 * h * (x - x^2), onde x é o progresso e h é a altura máxima.
                let alturaAtual = 4 * this.alturaPulo * (progresso - (progresso * progresso));
                this.y = this.posicaoChao - alturaAtual;
            } else {
                // Fim do pulo: retorna ao chão e reseta o estado.
                this.y = this.posicaoChao;
                this.estaPulando = false;
                return;
            }
            // Continua a animação no próximo quadro.
            requestAnimationFrame(animarPulo);
        };
        // Inicia o loop da animação de pulo.
        requestAnimationFrame(animarPulo);
    },
    
    /**
     * Cria e dispara um projétil (AguaBenta).
     */
    atirar: function() {
        if (this.estaMorto) return;
        var xBola, yBola, direcaoTiro;
        // Define a altura do tiro.
        yBola = this.y + (this.altura / 3) - 3;

        // Define a posição e direção do tiro com base na direção do jogador.
        if (this.direcao == JC_DIREITA) {
            xBola = this.x + this.largura; direcaoTiro = 1;
        } else {
            xBola = this.x; direcaoTiro = -1;
        }
        // Cria a nova instância do projétil e a adiciona ao motor do jogo.
        if (typeof AguaBenta !== 'undefined' && this.animacao && this.animacao.novoSprite) {
            var agua = new AguaBenta(this.context, xBola, yBola, direcaoTiro, this.canvas);
            this.animacao.novoSprite(agua);
        }
    },

    /**
     * Aumenta a vida máxima do jogador (power-up).
     */
    aumentarVidaMaxima: function(quantidade) {
        if (this.estaMorto) return;

        this.maxVidas += quantidade; // Aumenta o total de corações.
        this.vidas = this.maxVidas; // Recupera toda a vida para o novo máximo.

        console.log(`[JC] PODER AUMENTADO! Vida máxima agora é ${this.maxVidas}. Vida totalmente recuperada!`);
        // Um som de "power-up" poderia ser tocado aqui.
    },

    /**
     * Processa o dano recebido pelo jogador.
     */
    receberDano: function() {
        if (this.invencivel || this.estaMorto) return; // Ignora o dano se estiver invencível.
        
        // Registra que o jogador sofreu dano durante este período.
        if (this.animacao && this.animacao.bossInstancia) {
            this.sofreuDanoNaBatalhaFinal = true;
            console.log("[JC] Dano recebido durante a batalha do boss!");
        }
        
        this.vidas--;
        // Ativa a invencibilidade temporária.
        this.invencivel = true;
        this.tempoInvencivelRestante = this.duracaoInvencibilidade;
        // Se a vida chegar a zero, chama o método 'morrer'.
        if (this.vidas <= 0) {
            this.vidas = 0; this.morrer();
        }
    },

    /**
     * Inicia o processo de morte do jogador.
     */
    morrer: function() {
        if (this.estaMorto) return;
        this.estaMorto = true;
        this.andando = false;
        console.log("[JC.JS - morrer] JC Morreu! Vidas:", this.vidas);

        // Notifica o motor de animação que o jogo acabou (Game Over).
        if (this.animacao && typeof this.animacao.gameOver === 'function') {
            this.animacao.gameOver();
        }
    },

    /**
     * Restaura o estado do jogador para um novo jogo ou retry.
     */
    restaurarVidas: function() {
        this.vidas = this.maxVidas;
        this.estaMorto = false;
        this.invencivel = false;
        this.tempoInvencivelRestante = 0;
        if(this.sheet) { this.sheet.linha = 0; this.sheet.coluna = 0; } // Volta para a animação de parado.
        this.y = this.posicaoChao; // Reposiciona no chão.
        console.log("[JC.JS - restaurarVidas] JC vidas restauradas! Vidas:", this.vidas);
    }
};

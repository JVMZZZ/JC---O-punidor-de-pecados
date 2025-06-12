// boss.js
// Este arquivo define a classe 'Boss', responsável por toda a lógica,
// comportamento e renderização do chefe final do jogo.
function Boss(context, x, y, imagemBoss, animacao, jogadorAlvo, canvas) {
    // --- Referências e Configurações Básicas ---
    this.context = context;
    this.x = x;
    this.y = y;
    this.imagem = imagemBoss;
    this.animacao = animacao; // Referência ao motor do jogo para comunicação.
    this.jogadorAlvo = jogadorAlvo; // O alvo a ser seguido e atacado.
    this.canvas = canvas;
    this.tipo = 'boss'; // Identificador para o sistema de colisões.
    this.removivel = false; // Flag que sinaliza para o motor do jogo remover este objeto.

    // --- Propriedades de Estado do Boss ---
    this.largura = 120; // Largura padrão (será sobrescrita pela spritesheet se disponível).
    this.altura = 120; // Altura padrão.
    this.maxVidas = 60; // Vida máxima do Boss.
    this.vidas = this.maxVidas; // Vida atual, começa no máximo.
    this.estaMorto = false; // Flag que controla se o Boss foi derrotado.

    // --- Propriedades de Movimento ---
    this.velocidadeMovimento = 25; // Velocidade com que o Boss se move na tela.
    this.raioDeteccao = 9999; // Raio para "enxergar" o jogador
    this.distanciaMinima = 150; // Distância que o Boss tenta manter do jogador.

    // --- Propriedades de Ataque ---
    this.velocidadeLaser = 3.0; // Velocidade dos projéteis disparados.
    this.cooldownTiro = 2800; // Tempo de espera (em ms) entre as sequências de ataque.
    this.ultimoTiroTempo = 0; // Registra quando o último ataque ocorreu.

    // --- Propriedades para a Janela de Vulnerabilidade (Mecânica Principal) ---
    this.vulneravel = false; // O Boss começa invulnerável. Só pode levar dano quando 'true'.
    this.tempoFimVulnerabilidade = 0; // Armazena o timestamp de quando a vulnerabilidade termina.
    this.duracaoVulnerabilidade = 2000; // Duração (em ms) da janela de vulnerabilidade.

    // --- Configuração da Spritesheet para Animação ---
    this.sheet = null; // Objeto que controlará a animação dos quadros.
    // Verifica se a imagem do Boss foi carregada corretamente.
    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0) {
        let linhas = 2;
        let colunas = 4;

        // Cria uma nova instância do controlador de spritesheet.
        this.sheet = new Spritesheet(this.context, this.imagem, linhas, colunas);
        this.sheet.intervalo = 250; // Tempo (em ms) entre cada quadro da animação.
        
        // Calcula a largura e altura real de um único quadro do Boss.
        this.largura = this.imagem.width / colunas;
        this.altura = this.imagem.height / linhas;
    } else {
        // Alerta no console se a imagem não estiver pronta, o que pode causar erros.
        console.warn("Boss: Imagem não carregada ou spritesheet não configurada.");
    }

    // --- Configuração da Hitbox (Caixa de Colisão) ---
    // Ajustes para tornar a hitbox um pouco menor que o sprite visual
    this.hitboxOffsetX = 15; // Deslocamento da hitbox em X em relação ao canto do sprite.
    this.hitboxOffsetY = 15; // Deslocamento da hitbox em Y.
    this.hitboxLargura = this.largura - 30; // Largura da hitbox.
    this.hitboxAltura = this.altura - 30; // Altura da hitbox.
}

Boss.prototype = {
    /**
     * Atualiza a lógica do Boss a cada quadro do jogo (movimento, IA, ataque).
     * @param {number} deltaTime - O tempo em segundos desde o último quadro.
     */
    atualizar: function(deltaTime) {
        // Se o Boss já morreu, não faz mais nada.
        if (this.estaMorto) return;

        // Verifica se a janela de tempo de vulnerabilidade já terminou.
        if (this.vulneravel && Date.now() > this.tempoFimVulnerabilidade) {
            // Se sim, o Boss volta a ser invulnerável.
            this.vulneravel = false;
        }

        // Se o jogador não existe ou já foi derrotado, o Boss para.
        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) return;

        // --- Lógica de Movimento ---
        // Calcula a distância entre o centro do Boss e o centro do jogador.
        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroBossX = this.x + this.largura / 2;
        let distancia = Math.hypot(
            centroJogadorX - centroBossX,
            (this.jogadorAlvo.y + (this.jogadorAlvo.altura / 2)) - (this.y + this.altura / 2)
        );

        // Se a distância for maior que a distância mínima que ele quer manter...
        if (distancia > this.distanciaMinima) {
            // ...ele se move em direção ao jogador.
            // Calcula o vetor de direção normalizado (um vetor de comprimento 1).
            let dx = centroJogadorX - centroBossX;
            let dy = (this.jogadorAlvo.y + (this.jogadorAlvo.altura / 2)) - (this.y + this.altura / 2);
            let normDx = dx / distancia;
            let normDy = dy / distancia;
            // Aplica o movimento, ponderado pela velocidade e pelo deltaTime.
            this.x += normDx * this.velocidadeMovimento * deltaTime;
            this.y += normDy * this.velocidadeMovimento * deltaTime;
        }
        
        // --- Lógica de Ataque ---
        let agora = Date.now();
        // Verifica se o tempo desde o último tiro é maior que o cooldown.
        if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
            // Se sim, inicia uma nova sequência de ataque.
            this.atirar();
            // Registra o tempo deste ataque para reiniciar o cooldown.
            this.ultimoTiroTempo = agora;
        }
        
        // --- Lógica de Limites da Arena ---
        // Garante que o Boss não saia da área de batalha designada.
        const ARENA_MIN_X = 4000; // Onde a arena do Boss começa.
        const ARENA_MAX_X = this.animacao.mundoLargura - this.largura;
        const ARENA_MIN_Y = 0;
        const ARENA_MAX_Y = this.canvas.height - this.altura;
        // Usa Math.max e Math.min para "prender" o Boss dentro dos limites.
        this.x = Math.max(ARENA_MIN_X, Math.min(this.x, ARENA_MAX_X));
        this.y = Math.max(ARENA_MIN_Y, Math.min(this.y, ARENA_MAX_Y));

        // Se houver uma spritesheet configurada, avança para o próximo quadro da animação.
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }
    },
    
    /**
     * Inicia a sequência de ataque do Boss.
     */
    atirar: function() {
        // Não atira se o alvo não existe ou se o Boss já está morto.
        if (!this.jogadorAlvo || this.estaMorto) return;

        // MECÂNICA CHAVE: Ao atirar, o Boss se torna vulnerável.
        this.vulneravel = true;
        // Define o timestamp em que a vulnerabilidade terminará.
        this.tempoFimVulnerabilidade = Date.now() + this.duracaoVulnerabilidade;

        // Determina a direção do tiro baseado na posição do jogador.
        let direcaoX = (this.jogadorAlvo.x > this.x) ? 1 : -1;
        // Define quantos tiros serão disparados em uma rajada.
        const numTiros = 2;
        // Define o intervalo de tempo entre cada tiro da rajada.
        const intervaloEntreTiros = 200;

        // Usa um loop com setTimeout para disparar os tiros em sequência, não todos de uma vez.
        for (let i = 0; i < numTiros; i++) {
            setTimeout(() => {
                this.spawnLaser(direcaoX);
            }, i * intervaloEntreTiros);
        }
    },

    /**
     * Cria e adiciona um projétil (Laser) ao jogo.
     */
    spawnLaser: function(direcaoX) {
        // Não cria laser se o Boss já estiver morto.
        if (this.estaMorto) return;

        // Define a origem do laser como o centro do Boss.
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        const direcaoY = 0; // O laser se move apenas horizontalmente.

        // Verifica se a classe Laser e o motor de animação estão disponíveis.
        if (typeof Laser !== 'undefined' && this.animacao && this.animacao.novoSprite) {
            // Cria uma nova instância do Laser.
            var laser = new Laser(this.context, origemX, origemY, direcaoX, direcaoY, this.velocidadeLaser, this.canvas, this.animacao);
            // Adiciona o laser ao motor do jogo para que ele seja atualizado e desenhado.
            this.animacao.novoSprite(laser);
        }
    },

    /**
     * Desenha o Boss no canvas.
     */
    desenhar: function() {
        // Se o Boss está morto mas ainda não foi removido (esperando animação), não desenha.
        if (this.estaMorto && !this.removivel) return;

        // Salva o estado atual do contexto (cores, transformações, etc.).
        this.context.save();

        // Aplica um feedback visual de brilho vermelho quando o Boss está vulnerável.
        if (this.vulneravel) {
            this.context.shadowColor = 'red';
            this.context.shadowBlur = 25;
        }

        // Determina se o sprite deve ser virado para "olhar" para o jogador.
        let deveVirar = (this.jogadorAlvo && (this.jogadorAlvo.x + (this.jogadorAlvo.largura / 2)) > (this.x + this.largura / 2));
        
        // Se o jogador está à direita do Boss...
        if (deveVirar) {
            // ...espelha o canvas horizontalmente.
            this.context.scale(-1, 1);
            // A coordenada X precisa ser invertida para compensar o espelhamento.
            var xInvertido = -this.x - this.largura;

            // Desenha o quadro da animação na posição invertida.
            if (this.sheet) this.sheet.desenhar(xInvertido, this.y);
            // Fallback: se não houver sheet, desenha a imagem inteira ou um retângulo.
            else if (this.imagem && this.imagem.complete) this.context.drawImage(this.imagem, xInvertido, this.y, this.largura, this.altura);
            else this.context.fillRect(xInvertido, this.y, this.largura, this.altura);
        } else {
            // Se não precisar virar, desenha normalmente.
            if (this.sheet) this.sheet.desenhar(this.x, this.y);
            else if (this.imagem && this.imagem.complete) this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
            else this.context.fillRect(this.x, this.y, this.largura, this.altura);
        }

        // Restaura o contexto ao seu estado original, removendo o brilho e o espelhamento.
        this.context.restore();

        // Descomente a linha abaixo para ver a hitbox durante o desenvolvimento e debug.
        // this.desenharHitbox();
    },

    /**
     * Processa o dano recebido pelo Boss.
     * @param {number} quantidade - A quantidade de dano a ser subtraída da vida.
     */
    receberDano: function(quantidade) {
        // Se o Boss não estiver vulnerável, o dano é ignorado.
        if (!this.vulneravel) {
            // Um som de "dano bloqueado" poderia ser tocado aqui.
            return;
        }
        // Se já estiver morto, não pode receber mais dano.
        if (this.estaMorto) return;

        // Subtrai o dano da vida atual.
        this.vidas -= quantidade;
        
        // Se a vida chegar a zero ou menos...
        if (this.vidas <= 0) {
            this.vidas = 0; // Garante que a vida não fique negativa.
            // ...inicia o processo de morte.
            this.morrer();
        }
    },

    /**
     * Retorna a caixa de colisão (hitbox) do Boss em coordenadas do mundo.
     * @returns {{x: number, y: number, largura: number, altura: number}} Um objeto representando o retângulo da hitbox.
     */
    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura,
            altura: this.hitboxAltura
        };
    },
    
    /**
     * Função de debug para desenhar a hitbox na tela.
     */
    desenharHitbox: function() {
        var hitbox = this.getHitboxMundo();
        this.context.save();
        this.context.strokeStyle = 'lime'; // Cor verde para fácil visualização.
        this.context.lineWidth = 2;
        this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        this.context.restore();
    },

    /**
     * Inicia o processo de morte do Boss.
     */
    morrer: function() {
        // Garante que este processo só aconteça uma vez.
        if (this.estaMorto) return;
        this.estaMorto = true;
        this.vulneravel = false; // Garante que não possa mais levar dano enquanto morre.
        console.log("BOSS DERROTADO!");
        
        // Usa um setTimeout para atrasar a remoção do objeto do jogo.
        // Isso dá tempo para uma animação de morte ou efeito de explosão ser exibido.
        setTimeout(() => {
            this.removivel = true; // Sinaliza ao motor do jogo que pode remover este objeto.
        }, 1500); // Delay de 1.5 segundos.

        // Notifica o motor de animação que o Boss foi derrotado para disparar o evento de vitória.
        if (this.animacao && typeof this.animacao.eventoBossDerrotado === 'function') {
            this.animacao.eventoBossDerrotado();
        }
    }
};

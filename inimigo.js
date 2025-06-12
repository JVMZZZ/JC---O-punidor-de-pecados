// inimigo.js
// Este arquivo define a classe 'Inimigo', que representa os adversários
// comuns no jogo. Eles têm a capacidade de seguir o jogador e atirar.

/**
 * Construtor para a entidade Inimigo.
 */
function Inimigo(context, x, y, jogadorAlvo, animacao, canvas, imagemInimigo, linhasSheet, colunasSheet) {
    // --- Referências e Configurações Básicas ---
    this.context = context;
    this.x = x;
    this.y = y;
    this.jogadorAlvo = jogadorAlvo; // O alvo a ser seguido e atacado.
    this.animacao = animacao; // Referência ao motor do jogo para comunicação.
    this.canvas = canvas;
    this.tipo = 'inimigo'; // Identificador para o sistema de colisões.
    this.removivel = false; // Flag que sinaliza para o motor do jogo remover este objeto.

    // --- Propriedades de Comportamento (IA) ---
    this.velocidadeMovimento = 50; // Velocidade com que o inimigo se move na tela.
    this.raioDeteccao = 1000; // Distância máxima em que o inimigo "enxerga" e persegue o jogador.
    this.distanciaMinima = 300; // Distância que o inimigo tenta manter do jogador.

    // --- Propriedades de Ataque ---
    this.velocidadeLaser = 1.7; // Velocidade dos projéteis disparados.
    this.cooldownTiro = 3000; // Tempo de espera (em ms) entre os ataques.
    this.ultimoTiroTempo = 0; // Registra quando o último ataque ocorreu.

    // --- Propriedades de Animação e Aparência ---
    this.imagem = imagemInimigo;
    this.sheet = null; // Objeto que controlará a animação dos quadros.
    this.largura = 50; // Largura padrão (será sobrescrita pela spritesheet).
    this.altura = 50; // Altura padrão.

    // Validação dos parâmetros da spritesheet para evitar erros.
    const lSheetValida = (typeof linhasSheet === 'number' && linhasSheet > 0) ? linhasSheet : 1;
    const cSheetValida = (typeof colunasSheet === 'number' && colunasSheet > 0) ? colunasSheet : 1;

    // Tenta configurar a spritesheet se a imagem estiver carregada e pronta.
    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0 && this.imagem.naturalWidth > 0) {
        try {
            // Cria uma nova instância do controlador de spritesheet.
            this.sheet = new Spritesheet(this.context, this.imagem, lSheetValida, cSheetValida);
            this.sheet.intervalo = 150; // Tempo (em ms) entre cada quadro da animação.
            
            // Calcula a largura e altura real de um único quadro do inimigo.
            this.largura = this.imagem.width / cSheetValida;
            this.altura = this.imagem.height / lSheetValida;
            
            // Verificação de segurança: se o cálculo resultar em um valor inválido (ex: NaN), usa o fallback.
            if (isNaN(this.largura) || isNaN(this.altura) || this.largura <= 0 || this.altura <= 0) {
                console.warn("Inimigo: Cálculo de largura/altura da spritesheet inválido. Usando fallback.");
                this.largura = 50; this.altura = 50; this.sheet = null;
            } else {
                this.sheet.linha = 0; // Define a linha inicial da animação na spritesheet.
            }
        } catch (e) {
            // Captura qualquer erro que possa ocorrer durante a criação da Spritesheet.
            console.error("Inimigo: ERRO ao criar Spritesheet.", e);
            this.sheet = null; this.largura = 50; this.altura = 50;
        }
    }

    // --- Configuração da Hitbox (Caixa de Colisão) ---
    // Ajustes para tornar a hitbox um pouco menor que o sprite, sendo mais justo para o jogador.
    this.hitboxOffsetX = 4;
    this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - (this.hitboxOffsetX * 2);
    this.hitboxAltura = this.altura - (this.hitboxOffsetY * 2);
    // Validação para garantir que a hitbox não tenha tamanho zero ou negativo.
    if (this.hitboxLargura <= 0) this.hitboxLargura = Math.max(10, this.largura * 0.5);
    if (this.hitboxAltura <= 0) this.hitboxAltura = Math.max(10, this.altura * 0.5);
}

Inimigo.prototype = {
    /**
     * Atualiza a lógica do inimigo a cada quadro (movimento, IA, ataque).
     */
    atualizar: function(deltaTime) {
        // Se houver uma spritesheet, avança para o próximo quadro da animação.
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }

        // Se o jogador não existe ou já foi derrotado, o inimigo para de se mover e atacar.
        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) {
            return;
        }

        // --- Lógica de Perseguição ---
        // Calcula a posição do centro do jogador e do inimigo.
        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroJogadorY = this.jogadorAlvo.y + (this.jogadorAlvo.altura || 0) / 2;
        let centroInimigoX = this.x + this.largura / 2;
        let centroInimigoY = this.y + this.altura / 2;

        // Calcula o vetor (diferença) entre o inimigo e o jogador.
        let dx = centroJogadorX - centroInimigoX;
        let dy = centroJogadorY - centroInimigoY;
        // Calcula a distância real usando a hipotenusa, que é mais preciso que apenas em um eixo.
        let distancia = Math.hypot(dx, dy);

        // Verificação de segurança para evitar erros matemáticos se a distância for inválida.
        if (isNaN(distancia)) {
            console.error("[Inimigo.atualizar] ERRO: Distância calculada é NaN!");
            return;
        }

        // Se o jogador estiver dentro do raio de detecção do inimigo...
        if (distancia <= this.raioDeteccao) {
            // ...e se o inimigo ainda não estiver na sua distância mínima de ataque...
            if (distancia > this.distanciaMinima) {
                // ...ele se move em direção ao jogador.
                // Calcula o vetor de direção normalizado (um vetor de comprimento 1).
                let normDx = dx / distancia;
                let normDy = dy / distancia;
                // Aplica o movimento, ponderado pela velocidade e pelo deltaTime para consistência.
                this.x += normDx * this.velocidadeMovimento * deltaTime;
                this.y += normDy * this.velocidadeMovimento * deltaTime;
            }
            
            // --- Lógica de Ataque ---
            let agora = Date.now();
            // Verifica se o tempo desde o último tiro é maior que o cooldown.
            if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
                // Se sim, atira em direção ao jogador.
                this.atirarLaser(dx, dy, distancia);
                // Registra o tempo deste ataque para reiniciar o cooldown.
                this.ultimoTiroTempo = agora;
            }
        }
    },

    /**
     * Cria e adiciona um projétil (Laser) ao jogo.
     */
    atirarLaser: function(dxParaJogador, dyParaJogador, distanciaAteJogador) {
        // Define a origem do laser como o centro do inimigo.
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        
        // Define que o laser sempre se moverá na horizontal.
        const dirY = 0;
        let dirX = 1; // Direção padrão para a direita.

        // Determina a direção X do tiro baseado na posição do jogador.
        if (this.jogadorAlvo) {
            let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
            let enemyCenterX = this.x + this.largura / 2;
            if (playerCenterX < enemyCenterX) dirX = -1; // Jogador está à esquerda.
            else if (playerCenterX > enemyCenterX) dirX = 1; // Jogador está à direita.
            else dirX = -1; // Padrão se estiverem perfeitamente alinhados.
        }

        try {
            // Verifica se as dependências (classe Laser e método do motor) existem.
            if (typeof Laser !== 'undefined' && this.animacao && typeof this.animacao.novoSprite === 'function') {
                // Cria uma nova instância do Laser.
                var laser = new Laser(this.context, origemX, origemY, dirX, dirY, this.velocidadeLaser, this.canvas, this.animacao);
                // Adiciona o laser ao motor do jogo para que ele seja processado.
                this.animacao.novoSprite(laser);
            } else {
                console.error("[Inimigo.atirarLaser] ERRO: Dependências não encontradas (Laser ou animacao.novoSprite).");
            }
        } catch (e) {
            console.error("[Inimigo.atirarLaser] ERRO CRÍTICO ao criar Laser:", e);
        }
    },

    /**
     * Desenha o inimigo no canvas.
     */
    desenhar: function() {
        var ctx = this.context;
        // Salva o estado atual do contexto (cores, transformações, etc.).
        ctx.save();

        // Determina se o sprite deve ser virado para "olhar" para o jogador.
        let deveVirar = false;
        if (this.jogadorAlvo) {
            let playerCenterX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
            let enemyCenterX = this.x + this.largura / 2;
            // Se o centro do jogador estiver à direita do centro do inimigo...
            if (playerCenterX > enemyCenterX) {
                deveVirar = true; // ...o sprite deve ser virado (se a imagem original olha para a esquerda).
            }
        }

        // Se a spritesheet estiver pronta para uso...
        if (this.sheet && this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0) {
            // ...desenha usando o controlador da spritesheet.
            if (deveVirar) {
                ctx.scale(-1, 1); // Espelha o canvas horizontalmente.
                // A coordenada X precisa ser invertida para compensar o espelhamento.
                this.sheet.desenhar(-this.x - this.largura, this.y);
            } else {
                this.sheet.desenhar(this.x, this.y); // Desenha normalmente.
            }
        } else {
            // Fallback: Se não houver spritesheet, desenha uma forma geométrica roxa.
            if (deveVirar) {
                ctx.scale(-1, 1);
                ctx.fillStyle = 'purple';
                ctx.fillRect(-this.x - this.largura, this.y, this.largura, this.altura);
            } else {
                ctx.fillStyle = 'purple';
                ctx.fillRect(this.x, this.y, this.largura, this.altura);
            }
        }
        // Restaura o contexto ao seu estado original, removendo o espelhamento.
        ctx.restore();
    },

    /**
     * Retorna a caixa de colisão (hitbox) do inimigo em coordenadas do mundo.
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
     
    desenharHitbox: function() { // Para debug
        var hitbox = this.getHitboxMundo();
        var ctx = this.context;
        ctx.save();
        ctx.strokeStyle = 'red'; // Cor vermelha para fácil visualização.
        ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    }
    */
};

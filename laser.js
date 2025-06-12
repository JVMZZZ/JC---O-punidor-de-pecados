// laser.js
// Este arquivo define a classe 'Laser', que representa um projétil
// disparado pelos inimigos.

/**
 * Construtor para a entidade Laser.
 */
function Laser(context, x, y, dirX, dirY, velocidade, canvas, animacao) {
    // Log de debug para confirmar a criação e os parâmetros do novo laser.
    console.log("[Laser.JS Construtor] Criando Laser. x:", x.toFixed(1), "y:", y.toFixed(1), "dirX:", dirX.toFixed(2), "dirY:", dirY.toFixed(2), "vel:", velocidade); // LOG 8
    
    // --- Referências e Configurações Básicas ---
    this.context = context;
    this.canvas = canvas;
    this.animacao = animacao; // Armazena a referência ao motor do jogo.
    this.x = x;
    this.y = y;
    this.dirX = dirX; // Direção horizontal.
    this.dirY = dirY; // Direção vertical.
    this.velocidade = velocidade;
    
    // --- Propriedades Visuais e de Colisão ---
    this.largura = 15; // Largura do retângulo do laser.
    this.altura = 3;   // Altura do retângulo do laser.
    this.cor = 'purple'; // Cor do laser.

    this.removivel = false; // Flag que sinaliza para o motor do jogo remover este objeto.
    this.tipo = 'laserInimigo'; // Identificador para o sistema de colisões.
    
    // --- Controle do Ciclo de Vida ---
    this.distanciaMaxima = 1000; // Distância máxima que o laser pode percorrer antes de ser removido.
    this.distanciaPercorrida = 0; // Acumulador para registrar a distância que já foi percorrida.
}

Laser.prototype = {
    /**
     * Atualiza a lógica do laser a cada quadro (movimento e verificação de remoção).
     */
    atualizar: function(deltaTime) {
        // Calcula o deslocamento a ser aplicado neste quadro.
        let movimentoX = this.dirX * this.velocidade;
        let movimentoY = this.dirY * this.velocidade; // Como this.dirY é 0, movimentoY também será 0.

        // Aplica o movimento à posição do laser.
        this.x += movimentoX;
        this.y += movimentoY; // Efetivamente, não há mudança na posição Y.
        
        // Acumula a distância percorrida para controlar o alcance máximo.
        // Usa a fórmula da hipotenusa para calcular a distância percorrida no quadro.
        this.distanciaPercorrida += Math.sqrt(movimentoX * movimentoX + movimentoY * movimentoY);

        // --- Lógica de Remoção ---
        // Pega a largura do mundo do jogo a partir do motor de animação, se disponível.
        let mundoLarguraAtual = (this.animacao && this.animacao.mundoLargura) ? this.animacao.mundoLargura : this.canvas.width;
        
        // Marca o laser como 'removivel' se uma das seguintes condições for atendida:
        // 1. Atingiu sua distância máxima de percurso.
        // 2. Saiu completamente dos limites do mundo do jogo.
        if (this.distanciaPercorrida > this.distanciaMaxima ||
            this.x < -this.largura || this.x > mundoLarguraAtual + this.largura ||
            this.y < -this.altura || this.y > this.canvas.height + this.altura) {
            
            this.removivel = true; // Sinaliza para o motor do jogo que este objeto pode ser deletado.
            // Log de debug para confirmar a remoção.
            console.log("[Laser.atualizar] Laser marcado para remoção. x:", this.x.toFixed(1) , "DistPerc:", this.distanciaPercorrida.toFixed(1)); // LOG 10
        }
        // Nota: A colisão do Laser com o jogador é tratada no arquivo 'animacao.js'.
    },

    /**
     * Desenha o laser no canvas.
     */
    desenhar: function() {
        var ctx = this.context;
        // Salva o estado atual do contexto (cores, etc.).
        ctx.save();
        // Define a cor de preenchimento do laser.
        ctx.fillStyle = this.cor;
        // Desenha um retângulo na posição do laser. O cálculo subtrai metade da largura/altura
        // para que a posição (x, y) do laser seja o seu centro, e não o canto superior esquerdo.
        ctx.fillRect(this.x - this.largura / 2, this.y - this.altura / 2, this.largura, this.altura);
        // Restaura o contexto para o estado anterior.
        ctx.restore();
    },

    /**
     * Retorna a caixa de colisão (hitbox) do laser em coordenadas do mundo.
     */
    getHitboxMundo: function() {
        return {
            x: this.x - this.largura / 2,
            y: this.y - this.altura / 2,
            largura: this.largura,
            altura: this.altura
        };
    }
};

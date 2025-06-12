// aguabenta.js
function AguaBenta(context, x, y, direcaoTiro, canvas) { // Removido mundoLarguraRef não utilizado
    this.context = context;
    this.canvas = canvas; // Pode ser útil para verificar limites da tela ou aplicar efeitos.
    this.x = x;
    this.y = y;
    this.raio = 6; // O raio do projétil, afeta seu tamanho visual e a hitbox.
    this.cor = 'deepskyblue'; // Cor de preenchimento do projétil.
    this.velocidade = 6; // Velocidade de movimento em pixels por atualização.
    this.direcao = direcaoTiro; // Armazena a direção do movimento.
    this.removivel = false; // Flag que sinaliza ao motor do jogo para remover este objeto.
    this.tipo = 'aguaBenta'; // Identificador usado pelo sistema de colisões.

    // Propriedades para controlar o alcance do projétil
    this.xInicial = x; // Posição X inicial, guardada para referência (não usada atualmente).
    this.distanciaMaxima = 400; // Distância máxima em pixels que o projétil pode percorrer.
    this.distanciaPercorrida = 0; // Acumulador para registrar a distância que já foi percorrida.
}

// Define os métodos da classe AguaBenta no prototype para otimizar o uso de memória.
AguaBenta.prototype = {

    /**
     * Atualiza a lógica do projétil a cada quadro (frame) do jogo.
     * Controla o movimento e verifica se o projétil deve ser removido.
     */
    atualizar: function(deltaTime) {
        // Calcula o deslocamento a ser aplicado neste quadro.
        let movimento = this.velocidade * this.direcao;

        // Aplica o movimento à posição X do projétil.
        this.x += movimento;

        // Acumula a distância percorrida. Usamos Math.abs para que a distância seja sempre
        // positiva, não importando a direção do movimento.
        this.distanciaPercorrida += Math.abs(movimento); // <<--- MUDANÇA: Usar o movimento real

        // Verifica se o projétil já viajou além do seu alcance máximo.
        if (this.distanciaPercorrida > this.distanciaMaxima) {
            // Se sim, marca o projétil como 'removível'. O motor do jogo irá deletá-lo.
            this.removivel = true;
        }
    },

    /**
     * Desenha o projétil na tela usando o contexto do canvas.
     */
    desenhar: function() {
        var ctx = this.context;

        // Salva o estado atual do contexto (cores, linhas, etc.).
        // para garantir que o desenho deste objeto não afete os outros.
        ctx.save();

        // Inicia um novo "caminho" de desenho.
        ctx.beginPath();

        // Define o caminho como um círculo na posição e raio atuais do projétil.
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);

        // Preenche o interior do círculo com a cor definida.
        ctx.fillStyle = this.cor;
        ctx.fill();

        // Adiciona uma borda para dar destaque.
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fecha o caminho de desenho.
        ctx.closePath();

        // Restaura o contexto para o estado em que estava antes desta função.
        ctx.restore();
    },

    getHitboxMundo: function() { // hitbox para projéteis
        // Retornar um retângulo é comum para simplificar e otimizar os cálculos de colisão.
        return {
            x: this.x - this.raio,       // O canto esquerdo do retângulo é o centro X menos o raio.
            y: this.y - this.raio,       // O canto superior do retângulo é o centro Y menos o raio.
            largura: this.raio * 2,      // A largura é o diâmetro do círculo.
            altura: this.raio * 2        // A altura é o diâmetro do círculo.
        };
    }
};

function AguaBenta(context, x, y, direcaoJC, canvas) {
    this.context = context;
    this.canvas = canvas; // Referência ao canvas para obter largura/altura
    this.x = x;
    this.y = y; // Geralmente um pouco acima ou abaixo do centro do JC
    this.raio = 6;
    this.cor = 'deepskyblue'; // Um azul bonito
    this.velocidade = 6;  // Velocidade da bola

    // A direção da bola será a mesma que o JC está olhando
    // Se direcaoJC for JC_DIREITA (1), velocidade positiva. Se JC_ESQUERDA (2), poderia ser -1.
    // Vamos ajustar isso: assumimos que direcaoJC em jc.atirar() passará 1 para direita, -1 para esquerda.
    this.direcao = direcaoJC;

    this.removivel = false; // Flag para marcar para remoção pela classe Animacao
}

AguaBenta.prototype = {
    atualizar: function() {
        // Move a bola na direção definida
        this.x += this.velocidade * this.direcao;

        // Marcar para remoção se sair da tela (esquerda ou direita)
        if (this.x + this.raio < 0 || this.x - this.raio > this.canvas.width) {
            this.removivel = true;
            // console.log("Bola marcada para remoção"); // Log para depuração
        }
    },

    desenhar: function() {
        var ctx = this.context;
        ctx.save(); // Salva o estado atual do contexto

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = this.cor;
        ctx.fill();
        
        // Opcional: Adicionar uma borda ou brilho
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.closePath();
        ctx.restore(); // Restaura o estado do contexto
    }
};

function AguaBenta(context, x, y, direcaoTiro, canvas, mundoLarguraRef) {
    this.context = context;
    // this.canvas = canvas; // Pode não ser mais necessário se usarmos mundoLarguraRef ou tempo de vida
    this.x = x;
    this.y = y;
    this.raio = 6;
    this.cor = 'deepskyblue';
    this.velocidade = 6;
    this.direcao = direcaoTiro;
    this.removivel = false;

    // --- NOVO: Para remoção baseada em distância ou limites do mundo ---
    this.xInicial = x; // Guarda a posição x inicial
    this.distanciaMaxima = 800; // Bola será removida após viajar esta distância (ajuste!)
    // Alternativa: this.mundoLargura = mundoLarguraRef;
}

AguaBenta.prototype = {
    atualizar: function(deltaTime) { // deltaTime vindo da Animacao
        this.x += this.velocidade * this.direcao;

        // Marcar para remoção se viajar além da distância máxima
        if (Math.abs(this.x - this.xInicial) > this.distanciaMaxima) {
            this.removivel = true;
        }

        // OU Marcar para remoção se sair dos limites do MUNDO (se passou mundoLarguraRef)
        // if (this.mundoLargura && (this.x < 0 || this.x > this.mundoLargura)) {
        //     this.removivel = true;
        // }
    },
    desenhar: function() {
        // O método desenhar continua o mesmo, pois desenha em this.x, this.y (mundo)
        // e o translate da Animacao cuida do resto.
        var ctx = this.context;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fillStyle = this.cor;
        ctx.fill();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }
};
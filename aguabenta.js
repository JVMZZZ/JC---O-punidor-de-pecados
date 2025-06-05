// aguabenta.js
function AguaBenta(context, x, y, direcaoTiro, canvas) { // Removido mundoLarguraRef não utilizado
    this.context = context;
    this.canvas = canvas; // Pode ser útil para limites ou efeitos
    this.x = x;
    this.y = y;
    this.raio = 6;
    this.cor = 'deepskyblue';
    this.velocidade = 6;
    this.direcao = direcaoTiro;
    this.removivel = false;
    this.tipo = 'aguaBenta'; // <<--- MUDANÇA/CORREÇÃO: Tipo para colisões

    this.xInicial = x;
    this.distanciaMaxima = 400;
    this.distanciaPercorrida = 0; // <<--- ADICIONADO: Inicializar distanciaPercorrida
}

AguaBenta.prototype = {
    atualizar: function(deltaTime) {
        let movimento = this.velocidade * this.direcao; // Movimento neste frame
        // Se quiser movimento baseado em deltaTime:
        // let movimento = this.velocidade * this.direcao * (deltaTime * 60); // Ajuste 60 conforme sua base de velocidade

        this.x += movimento;
        this.distanciaPercorrida += Math.abs(movimento); // <<--- MUDANÇA: Usar o movimento real

        if (this.distanciaPercorrida > this.distanciaMaxima) {
            this.removivel = true;
        }
    },
    desenhar: function() {
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
    },
    // Adicionar método getHitboxMundo para AguaBenta
    getHitboxMundo: function() { // <<--- MUDANÇA/CORREÇÃO: Adicionado hitbox para projéteis
        return {
            x: this.x - this.raio,
            y: this.y - this.raio,
            largura: this.raio * 2,
            altura: this.raio * 2
        };
    }
};
// laser.js
// Adicionado 'animacao' ao construtor para que o laser possa conhecer o mundoLargura
function Laser(context, x, y, dirX, dirY, velocidade, canvas, animacao) { // <<--- ADICIONADO animacao
    console.log("[Laser.JS Construtor] Criando Laser. x:", x.toFixed(1), "y:", y.toFixed(1), "dirX:", dirX.toFixed(2), "dirY:", dirY.toFixed(2), "vel:", velocidade); // LOG 8
    this.context = context;
    this.canvas = canvas;
    this.animacao = animacao; // <<--- ARMAZENANDO animacao
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.velocidade = velocidade;
    
    this.largura = 15;
    this.altura = 3;
    this.cor = 'purple';

    this.removivel = false;
    this.tipo = 'laserInimigo';
    
    this.distanciaMaxima = 1000;
    this.distanciaPercorrida = 0;
}

Laser.prototype = {
    atualizar: function(deltaTime) {
        let movimentoX = this.dirX * this.velocidade;
        let movimentoY = this.dirY * this.velocidade; // Como this.dirY será 0, movimentoY será 0

        this.x += movimentoX;
        this.y += movimentoY; // Efetivamente, this.y += 0; não haverá mudança em Y.
        // ... (resto da lógica de atualização) ...
        this.distanciaPercorrida += Math.sqrt(movimentoX * movimentoX + movimentoY * movimentoY);

        // Descomente este log se quiser ver o laser se movendo (pode ser MUITO verboso)
        // console.log("[Laser.atualizar] Posição Laser: (", this.x.toFixed(1), ",", this.y.toFixed(1), ") Dist Percorrida:", this.distanciaPercorrida.toFixed(1)); // LOG 9

        // Lógica de remoção
        let mundoLarguraAtual = (this.animacao && this.animacao.mundoLargura) ? this.animacao.mundoLargura : this.canvas.width;
        if (this.distanciaPercorrida > this.distanciaMaxima ||
            this.x < -this.largura || this.x > mundoLarguraAtual + this.largura || // Usa mundoLargura se disponível
            this.y < -this.altura || this.y > this.canvas.height + this.altura) {
            this.removivel = true;
            console.log("[Laser.atualizar] Laser marcado para remoção. x:", this.x.toFixed(1) , "DistPerc:", this.distanciaPercorrida.toFixed(1)); // LOG 10
        }
        // A colisão do Laser com o JC é verificada em animacao.js
    },

    desenhar: function() {
        // Descomente este log se quiser ver o laser sendo desenhado (pode ser MUITO verboso)
        // console.log("[Laser.desenhar] Desenhando Laser em x:", this.x.toFixed(1), "y:", this.y.toFixed(1)); // LOG 11
        var ctx = this.context;
        ctx.save();
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.x - this.largura / 2, this.y - this.altura / 2, this.largura, this.altura);
        ctx.restore();
    },
    getHitboxMundo: function() {
        return {
            x: this.x - this.largura / 2,
            y: this.y - this.altura / 2,
            largura: this.largura,
            altura: this.altura
        };
    }
};
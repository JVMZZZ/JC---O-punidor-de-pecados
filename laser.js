// Laser.js
function Laser(context, x, y, dirX, dirY, velocidade, canvas) {
    this.context = context;
    this.canvas = canvas; // Para verificar limites do mundo/tela
    this.x = x;       // Posição X inicial
    this.y = y;       // Posição Y inicial
    this.dirX = dirX; // Componente X da direção normalizada do movimento
    this.dirY = dirY; // Componente Y da direção normalizada do movimento
    this.velocidade = velocidade;
    
    this.largura = 15; // Largura do laser
    this.altura = 3;  // Altura do laser
    this.cor = 'orange';

    this.removivel = false; // Para ser removido pela classe Animacao
    
    // Para remoção após certa distância ou tempo (opcional)
    this.distanciaMax = 1000; // Ex: Laser se autodestrói após 1000 pixels
    this.distanciaPercorrida = 0;
}

Laser.prototype = {
    atualizar: function(deltaTime) {
        // Move o laser
        let movimentoX = this.dirX * this.velocidade; // * deltaTime se quiser movimento baseado em tempo real
        let movimentoY = this.dirY * this.velocidade; // * deltaTime
        
        this.x += movimentoX;
        this.y += movimentoY;
        this.distanciaPercorrida += Math.sqrt(movimentoX*movimentoX + movimentoY*movimentoY);

        // Marcar para remoção se sair muito da tela ou atingir distância máxima
        // (Verificação simples de limites, pode ser melhorada com os limites do MUNDO da Animacao)
        if (this.distanciaPercorrida > this.distanciaMax ||
            this.x < -this.largura || this.x > this.canvas.width + this.largura || // Uma verificação básica de tela
            this.y < -this.altura || this.y > this.canvas.height + this.altura) {
            this.removivel = true;
            // console.log("Laser marcado para remoção");
        }

        // --- LÓGICA DE COLISÃO COM O JOGADOR (JC) ---
        // Precisamos de uma referência ao jogador. A forma mais fácil é se a classe Animacao
        // passar o jogador para o método atualizar dos sprites, ou se o Laser tiver acesso global ao jogador.
        // Por enquanto, vamos deixar um placeholder. A colisão será o próximo passo.
        // if (this.colidiuCom(this.animacao.jogadorPrincipal)) { // Se tiver acesso ao jogador via animacao
        //    this.animacao.jogadorPrincipal.sofrerDano(1);
        //    this.removivel = true;
        // }
    },

    desenhar: function() {
        var ctx = this.context;
        ctx.save();
        ctx.fillStyle = this.cor;
        
        // Desenha um retângulo simples para o laser
        // Para um laser que rotaciona com a direção, seria mais complexo (usando ctx.rotate)
        ctx.fillRect(this.x - this.largura/2, this.y - this.altura/2, this.largura, this.altura);
        
        ctx.restore();
    }

    // Método de colisão (exemplo simples de colisão retangular)
    // colidiuCom: function(outroSprite) {
    //     return (this.x < outroSprite.x + outroSprite.largura &&
    //             this.x + this.largura > outroSprite.x &&
    //             this.y < outroSprite.y + outroSprite.altura &&
    //             this.y + this.altura > outroSprite.y);
    // }
};
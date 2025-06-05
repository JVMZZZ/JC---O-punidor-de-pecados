// coracaodropado.js
function CoracaoDropado(context, x, y, imagem, animacao) {
    this.context = context;
    this.x = x;
    this.yOriginal = y; // Guarda o Y inicial para a flutuação
    this.y = y;
    this.imagem = imagem; // A imagem pré-carregada de 'img/vida-coracao.png'
    this.animacao = animacao; 
    this.tipo = 'coracaoDropado';
    this.removivel = false;

    if (this.imagem && this.imagem.complete && this.imagem.naturalWidth > 0) {
        this.largura = this.imagem.naturalWidth;
        this.altura = this.imagem.naturalHeight;
    } else {
        this.largura = 20; 
        this.altura = 20;
        console.warn("DEBUG CORAÇÃO (CoracaoDropado): Imagem do coração não disponível ou dimensões inválidas no construtor, usando fallback."); // Log 12
    }
    
    this.amplitudeFlutuacao = 4; 
    this.velocidadeFlutuacao = 0.08; 
    this.anguloFlutuacao = Math.random() * Math.PI * 2;

    console.log("DEBUG CORAÇÃO (CoracaoDropado): Novo CoracaoDropado criado. X:", this.x.toFixed(0), "Y:", this.y.toFixed(0), "Largura:", this.largura, "Altura:", this.altura, "Imagem src:", this.imagem ? this.imagem.src : "N/A"); // Log 11
}

CoracaoDropado.prototype = {
    atualizar: function(deltaTime) {
        this.anguloFlutuacao += this.velocidadeFlutuacao; 
        this.y = this.yOriginal + Math.sin(this.anguloFlutuacao) * this.amplitudeFlutuacao;
    },

    desenhar: function() {
        console.log("DEBUG CORAÇÃO (CoracaoDropado): Tentando desenhar em X:", this.x.toFixed(0), "Y:", this.y.toFixed(0)); // Log 13
        
        if (this.animacao && this.animacao.cameraX !== undefined) {
            let naTelaX = (this.x + this.largura > this.animacao.cameraX) && (this.x < this.animacao.cameraX + this.animacao.canvas.width);
            let naTelaY = (this.y + this.altura > this.animacao.cameraY) && (this.y < this.animacao.cameraY + this.animacao.canvas.height);
            if (!naTelaX || !naTelaY) {
                console.log("DEBUG CORAÇÃO (CoracaoDropado): CoracaoDropado FORA DA TELA. Coords:", this.x.toFixed(0), ",", this.y.toFixed(0), "CamX:", this.animacao.cameraX.toFixed(0)); // Log 14
            }
        }

        if (this.imagem && this.imagem.complete && this.imagem.naturalWidth > 0) {
            this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
        } else {
            this.context.fillStyle = 'deeppink';
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
            this.context.fillStyle = 'red';
            this.context.font = 'bold 12px Arial';
            this.context.textAlign = 'center';
            this.context.fillText('❤', this.x + this.largura / 2, this.y + this.altura * 0.75);
            console.log("DEBUG CORAÇÃO (CoracaoDropado): Desenhando fallback para CoracaoDropado (imagem não carregada)."); // Log 15
        }
        // this.desenharHitbox(); 
    },

    getHitboxMundo: function() {
        return {
            x: this.x,
            y: this.y,
            largura: this.largura,
            altura: this.altura
        };
    },

    // // Para debug da hitbox:
    // desenharHitbox: function() { 
    //     var hitbox = this.getHitboxMundo();
    //     this.context.save();
    //     this.context.strokeStyle = 'yellow';
    //     this.context.lineWidth = 1;
    //     this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
    //     this.context.restore();
    // }
};
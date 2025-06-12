// coracaodropado.js
// Este arquivo define a classe 'CoracaoDropado', que representa um item de cura
// que aparece no mapa para o jogador coletar.

function CoracaoDropado(context, x, y, imagem, animacao) {
    // --- Referências e Configurações Básicas ---
    this.context = context;
    this.x = x;
    this.yOriginal = y; // Guarda a posição Y inicial como pivô para o efeito de flutuação.
    this.y = y; // A posição Y atual, que será alterada a cada quadro.
    this.imagem = imagem; // A imagem do coração (ex: 'img/vida-coracao.png').
    this.animacao = animacao; // Referência ao motor do jogo.
    this.tipo = 'coracaoDropado'; // Identificador para o sistema de colisões.
    this.removivel = false; // Flag que sinaliza para o motor do jogo remover este objeto após ser coletado.

    // --- Dimensões ---
    // Verifica se a imagem do coração está carregada e pronta para uso.
    if (this.imagem && this.imagem.complete && this.imagem.naturalWidth > 0) {
        // Se sim, usa as dimensões da própria imagem.
        this.largura = this.imagem.naturalWidth;
        this.altura = this.imagem.naturalHeight;
    } else {
        // Se a imagem não estiver disponível, usa dimensões padrão como fallback.
        this.largura = 20;
        this.altura = 20;
        // Log de aviso para o desenvolvedor saber que a imagem falhou ao carregar.
        console.warn("DEBUG CORAÇÃO (CoracaoDropado): Imagem do coração não disponível ou dimensões inválidas no construtor, usando fallback."); // Log 12
    }
    
    // --- Efeito de Flutuação ---
    this.amplitudeFlutuacao = 4; // O quão "alto" e "baixo" o coração se moverá em relação à sua posição original.
    this.velocidadeFlutuacao = 0.08; // A velocidade com que o coração sobe e desce.
    // Inicia o ângulo em um valor aleatório para que múltiplos corações na tela não flutuem em perfeita sincronia.
    this.anguloFlutuacao = Math.random() * Math.PI * 2;

    // Log de debug para confirmar a criação e as propriedades do novo coração.
    console.log("DEBUG CORAÇÃO (CoracaoDropado): Novo CoracaoDropado criado. X:", this.x.toFixed(0), "Y:", this.y.toFixed(0), "Largura:", this.largura, "Altura:", this.altura, "Imagem src:", this.imagem ? this.imagem.src : "N/A"); // Log 11
}

CoracaoDropado.prototype = {
    /**
     * Atualiza a lógica do coração a cada quadro, principalmente para o efeito de flutuação.
     */
    atualizar: function(deltaTime) {
        // Incrementa o ângulo para continuar o movimento senoidal.
        this.anguloFlutuacao += this.velocidadeFlutuacao;
        // Usa a função seno para criar um movimento suave de subida e descida.
        // A posição Y atual é a posição original mais o resultado da função seno multiplicado pela amplitude.
        this.y = this.yOriginal + Math.sin(this.anguloFlutuacao) * this.amplitudeFlutuacao;
    },

    /**
     * Desenha o coração no canvas.
     */
    desenhar: function() {
        // Log de debug para rastrear a tentativa de desenho e as coordenadas.
        console.log("DEBUG CORAÇÃO (CoracaoDropado): Tentando desenhar em X:", this.x.toFixed(0), "Y:", this.y.toFixed(0)); // Log 13
        
        // --- Otimização de Renderização (Culling) ---
        // Verifica se o coração está dentro da área visível da câmera antes de tentar desenhar.
        if (this.animacao && this.animacao.cameraX !== undefined) {
            let naTelaX = (this.x + this.largura > this.animacao.cameraX) && (this.x < this.animacao.cameraX + this.animacao.canvas.width);
            let naTelaY = (this.y + this.altura > this.animacao.cameraY) && (this.y < this.animacao.cameraY + this.animacao.canvas.height);
            // Se não estiver na tela, exibe um log e não continua o processo de desenho.
            if (!naTelaX || !naTelaY) {
                console.log("DEBUG CORAÇÃO (CoracaoDropado): CoracaoDropado FORA DA TELA. Coords:", this.x.toFixed(0), ",", this.y.toFixed(0), "CamX:", this.animacao.cameraX.toFixed(0)); // Log 14
            }
        }

        // --- Lógica de Desenho ---
        // Verifica se a imagem está carregada e pronta.
        if (this.imagem && this.imagem.complete && this.imagem.naturalWidth > 0) {
            // Desenha a imagem do coração no canvas.
            this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
        } else {
            // Se a imagem não estiver disponível, desenha uma representação visual de fallback.
            // Desenha um quadrado rosa.
            this.context.fillStyle = 'deeppink';
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
            // Desenha um emoji de coração sobre o quadrado.
            this.context.fillStyle = 'red';
            this.context.font = 'bold 12px Arial';
            this.context.textAlign = 'center';
            this.context.fillText('❤', this.x + this.largura / 2, this.y + this.altura * 0.75);
            // Log para informar que o fallback está sendo usado.
            console.log("DEBUG CORAÇÃO (CoracaoDropado): Desenhando fallback para CoracaoDropado (imagem não carregada)."); // Log 15
        }
        // A linha abaixo pode ser descomentada para desenhar a hitbox para fins de debug.
        // this.desenharHitbox();
    },

    /**
     * Retorna a caixa de colisão (hitbox) do coração em coordenadas do mundo.
     */
    getHitboxMundo: function() {
        return {
            x: this.x,
            y: this.y,
            largura: this.largura,
            altura: this.altura
        };
    },

    /**
     * Função de debug para desenhar visualmente a hitbox na tela.
     */
    // // Para debug da hitbox:
    // desenharHitbox: function() { 
    //     var hitbox = this.getHitboxMundo();
    //     this.context.save();
    //     this.context.strokeStyle = 'yellow'; // Cor amarela para fácil visualização.
    //     this.context.lineWidth = 1;
    //     this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
    //     this.context.restore();
    // }
};

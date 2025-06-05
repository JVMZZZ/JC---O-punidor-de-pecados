function Animacao(context, canvas) { // Precisa do canvas para obter a largura da tela
    this.context = context;
    this.canvas = canvas; // Guardamos a referência do canvas
    this.sprites = [];    // Lista de todos os objetos a serem animados no mundo
    this.ligado = false;
    this.ultimoTempo = 0; // Para cálculo do deltaTime

    // --- Propriedades da Câmera e do Mundo ---
    this.cameraX = 0;
    this.cameraY = 0;     // Para rolagem vertical futura, por enquanto mantemos em 0
    this.mundoLargura = 5000; // Largura total do seu mundo/nível
    
    this.jogadorPrincipal = null; // O sprite que a câmera deve seguir (o JC)

    // Fator de suavização da câmera
    // Valores menores = mais suave e mais "atraso" da câmera.
    // Valores maiores (perto de 1) = mais rápido, menos suave.
    this.cameraSuavizacao = 0.8; // Experimente ajustar este valor!
    this.imgCoracaoHUD = null;
}

Animacao.prototype = {
    
    //Adiciona um novo sprite para ser gerenciado pela animação.
    novoSprite: function(sprite, ehJogadorPrincipal = false) {
        this.sprites.push(sprite);
        if (ehJogadorPrincipal) {
            this.jogadorPrincipal = sprite;
        }
    },

    ligar: function() {
        this.ultimoTempo = new Date().getTime(); // Inicializa o tempo para o primeiro frame
        this.ligado = true;
        this.proximoFrame();
    },

    desligar: function() {
        this.ligado = false;
    },

    atualizarCamera: function() {
        if (!this.jogadorPrincipal) return; // Se não há jogador principal, não faz nada

        // Calcular a posição X ideal da câmera para centralizar o jogador
        let alvoCameraX = this.jogadorPrincipal.x - (this.canvas.width / 2);

        // Interpolar suavemente a posição atual da câmera em direção ao alvo
        let novaCameraX = this.cameraX + (alvoCameraX - this.cameraX) * this.cameraSuavizacao;

        // "Snap" opcional para a posição final se estiver muito perto (evita micro-movimentos)
        if (Math.abs(alvoCameraX - novaCameraX) < 0.5) {
            novaCameraX = alvoCameraX;
        }
        
        this.cameraX = novaCameraX;

        // Garantir que a câmera não ultrapasse os limites do mundo
        // Limite esquerdo (0) e limite direito (mundoLargura - larguraDoCanvas)
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.mundoLargura - this.canvas.width));
        
    },

    proximoFrame: function() {
    if (!this.ligado) return;

    var agora = new Date().getTime();
    var deltaTime = (agora - this.ultimoTempo) / 1000.0;

    this.atualizarCamera();
    this.limparTela();

    this.context.save();
    this.context.translate(-this.cameraX, -this.cameraY);

    // Atualiza e remove sprites do mundo
    for (var i = 0; i < this.sprites.length; i++) {
        if (this.sprites[i].atualizar) {
             this.sprites[i].atualizar(deltaTime);
        }
    }
    this.sprites = this.sprites.filter(function(sprite) {
        return !sprite.removivel;
    });

    // Desenha sprites do mundo
    for (var i = 0; i < this.sprites.length; i++) {
        if (this.sprites[i].desenhar) {
            this.sprites[i].desenhar();
        }
    }

    this.context.restore(); // Restaura o contexto para desenhar o HUD

    if (this.jogadorPrincipal && typeof this.jogadorPrincipal.vidas !== 'undefined') {
    var ctx = this.context;
    ctx.save();

    console.log('[HUD] Desenhando HUD. Vidas JC:', this.jogadorPrincipal.vidas); 

    // Desenhar IMAGENS de Coração
    if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
        
        var xInicialCoracao = 10;
        var yCoracao = 10;
        var larguraCoracao = this.imgCoracaoHUD.width;
        var alturaCoracao = this.imgCoracaoHUD.height;
        var espacamentoCoracao = 5;

        if (larguraCoracao === 0 || alturaCoracao === 0) {
            console.error("[HUD] Largura ou altura da imagem do coração é 0. A imagem pode não ter carregado corretamente.");
        } else {
            for (var i = 0; i < this.jogadorPrincipal.vidas; i++) {
                var xPos = xInicialCoracao + (i * (larguraCoracao + espacamentoCoracao));
                    try {
                        ctx.drawImage(this.imgCoracaoHUD, xPos, yCoracao, larguraCoracao, alturaCoracao);
                    } catch (e) {
                        console.error("[HUD] Erro ao tentar desenhar a imagem do coração:", e);
                    }
                }
        }
    } else {
        // Imagem do coração NÃO está pronta ou não foi definida. Desenhando fallback de texto.
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        var coracoesTexto = "";
        for (var c = 0; c < this.jogadorPrincipal.vidas; c++) { coracoesTexto += "❤ "; }
        ctx.fillText(coracoesTexto, 10, 10);
    }

    if (this.imgCoracaoHUD && this.imgCoracaoHUD.complete && this.imgCoracaoHUD.naturalHeight !== 0) {
        var xInicialCoracao = 10;
        var yCoracao = 10;
        var larguraCoracao = this.imgCoracaoHUD.width;
        var alturaCoracao = this.imgCoracaoHUD.height;
        var espacamentoCoracao = 5;

        // LOOP DA IMPLEMENTAÇÃO DOS CORAÇÕES
        for (var i = 0; i < this.jogadorPrincipal.vidas; i++) {
            var xPos = xInicialCoracao + (i * (larguraCoracao + espacamentoCoracao));
            ctx.drawImage(this.imgCoracaoHUD, xPos, yCoracao, larguraCoracao, alturaCoracao);
        }
    }

    ctx.restore();
}
    // --- FIM DA SEÇÃO DO HUD ---

    this.ultimoTempo = agora;

    var animacao = this;
    requestAnimationFrame(function() {
        animacao.proximoFrame();
    });

    },

    limparTela: function() {
        var ctx = this.context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
};
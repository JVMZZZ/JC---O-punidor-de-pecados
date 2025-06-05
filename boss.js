// boss.js
function Boss(context, x, y, imagemBoss, animacao) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.imagem = imagemBoss; // A imagem pré-carregada do chefe
    this.animacao = animacao;
    this.tipo = 'boss';       // Importante para colisões e lógica
    this.removivel = false;   // O Boss não será removido até ser derrotado

    // Propriedades do Boss (ajuste conforme sua necessidade e imagem)
    this.largura = 120; // Largura do sprite/hitbox do Boss
    this.altura = 120; // Altura do sprite/hitbox do Boss
    this.maxVidas = 30; // Boss com mais vida que inimigos normais
    this.vidas = this.maxVidas;
    this.estaMorto = false;

    // Se o seu Boss usar uma spritesheet para animações:
    this.sheet = null;
    // 
    if (this.imagem && this.imagem.complete && this.imagem.naturalWidth > 0) {
        // Supondo uma spritesheet de 1 linha e 3 colunas para o Boss
        this.sheet = new Spritesheet(this.context, this.imagem, 2, 4);
        this.sheet.intervalo = 250; // Velocidade da animação do Boss
        this.largura = this.imagem.width / 3; // Largura de um frame
        this.altura = this.imagem.height / 1; // Altura de um frame
     } else {
         console.warn("Boss: Imagem não carregada ou spritesheet não configurada. Usando dimensões de fallback.");
     }


    // Ajuste a hitbox para corresponder ao seu sprite de Boss
    this.hitboxOffsetX = 15; 
    this.hitboxOffsetY = 15;
    this.hitboxLargura = this.largura - (this.hitboxOffsetX * 2);
    this.hitboxAltura = this.altura - (this.hitboxOffsetY * 2);

    console.log(`Boss CRIADO em (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) com ${this.vidas} vidas.`);
}

Boss.prototype = {
    atualizar: function(deltaTime) {
        if (this.estaMorto) {
            // Se tiver uma animação de morte longa, pode ser controlada aqui antes do this.removivel = true
            return;
        }

        // --- Lógica de Comportamento do Boss (Movimento, Ataques) ---
        // Por enquanto, o Boss ficará parado.
        // Futuramente, você pode adicionar padrões de movimento ou ataque aqui.
        // Ex: this.x += this.velocidadeX * deltaTime;

        // Atualizar animação da spritesheet (se houver)
        if (this.sheet) {
            // Ex: Mudar a linha da spritesheet se a vida estiver baixa
            // if (this.vidas <= this.maxVidas / 2 && this.sheet.linha === 0) {
            //     this.sheet.linha = 1; // Animação de "enfurecido" ou "danificado"
            //     this.sheet.coluna = 0;
            // }
            this.sheet.proximoQuadro();
        }
    },

    desenhar: function() {
        // Se tiver uma animação de morte e this.estaMorto for true, desenhe essa animação.
        // if (this.estaMorto) { /* ... desenhar explosão/morte ... */ return; }

        if (this.sheet && this.imagem && this.imagem.complete) {
            this.sheet.desenhar(this.x, this.y);
        } else if (this.imagem && this.imagem.complete) {
            // Desenha imagem estática se não houver spritesheet configurada
            this.context.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
        } else {
            // Desenho de fallback se a imagem do Boss não carregar
            this.context.fillStyle = 'purple'; // Cor distinta para o Boss
            this.context.fillRect(this.x, this.y, this.largura, this.altura);
            this.context.fillStyle = 'white';
            this.context.font = 'bold 20px Arial';
            this.context.textAlign = 'center';
            this.context.fillText('BOSS', this.x + this.largura / 2, this.y + this.altura / 2 + 7);
        }

        // Desenhar barra de vida do Boss
        if (!this.estaMorto) {
            this.desenharBarraDeVida();
        }

        // Para depuração da hitbox:
        // this.desenharHitbox();
    },

    desenharBarraDeVida: function() {
        const xBarra = this.x; // Barra de vida alinhada com a esquerda do Boss
        const yBarra = this.y - 15;  // Um pouco acima do Boss
        const larguraBarraTotal = this.largura; // Largura da barra igual à do Boss
        const alturaBarra = 8;
        const percentualVida = Math.max(0, this.vidas / this.maxVidas); // Garante que não seja negativo

        this.context.save();
        // Fundo cinza da barra
        this.context.fillStyle = '#555';
        this.context.fillRect(xBarra, yBarra, larguraBarraTotal, alturaBarra);
        // Parte vermelha (vida atual)
        this.context.fillStyle = 'red';
        this.context.fillRect(xBarra, yBarra, larguraBarraTotal * percentualVida, alturaBarra);
        // Contorno da barra
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 1;
        this.context.strokeRect(xBarra, yBarra, larguraBarraTotal, alturaBarra);
        this.context.restore();
    },

    getHitboxMundo: function() {
        return {
            x: this.x + this.hitboxOffsetX,
            y: this.y + this.hitboxOffsetY,
            largura: this.hitboxLargura,
            altura: this.hitboxAltura
        };
    },

    receberDano: function(quantidade) {
        if (this.estaMorto) return; // Não pode receber dano se já estiver morto

        this.vidas -= quantidade;
        console.log(`Boss recebeu ${quantidade} de dano. Vidas restantes: ${this.vidas}/${this.maxVidas}`);

        // Adicionar feedback visual de dano (ex: piscar o sprite do Boss)
        // this.animacao.adicionarEfeitoPiscar(this, 300); // (Precisaria criar essa função em animacao.js)

        if (this.vidas <= 0) {
            this.vidas = 0;
            this.morrer();
        }
    },

    morrer: function() {
        if (this.estaMorto) return; // Evita chamadas múltiplas

        this.estaMorto = true;
        console.log("BOSS DERROTADO!");

        // Adicionar lógica para quando o Boss morre:
        // - Iniciar uma animação de explosão/morte.
        // - Após a animação, marcar como 'removivel'.
        // - Dropar itens especiais, pontuação, etc.
        // - Notificar 'animacao.js' que o Boss foi derrotado para, por exemplo, mostrar uma tela de vitória.

        // Exemplo simples: marcar para remoção após um pequeno delay (simulando animação de morte)
        setTimeout(() => {
            this.removivel = true;
            console.log("Boss marcado para remoção do jogo.");
        }, 1500); // Remove após 1.5 segundos

        if (this.animacao && typeof this.animacao.eventoBossDerrotado === 'function') {
            this.animacao.eventoBossDerrotado(); // Chama uma função em animacao.js
        }
    }

    // Para desenhar a hitbox (descomente no método desenhar)
    /*
    desenharHitbox: function() { 
        var hitbox = this.getHitboxMundo();
        this.context.save();
        this.context.strokeStyle = 'orange'; 
        this.context.lineWidth = 2;
        this.context.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        this.context.restore();
    }
    */
};
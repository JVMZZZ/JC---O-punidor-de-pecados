// animacao.js
function Animacao(context) {
    this.context = context;
    this.sprites = [];
    this.ligado = false;
    this.ultimoTempo = 0; // Adicionado para o deltaTime, se precisar no futuro
}
Animacao.prototype = {
    novoSprite: function(sprite) {
        this.sprites.push(sprite);
    },
    ligar: function() {
        this.ultimoTempo = new Date().getTime(); // Inicializa o tempo para o primeiro frame
        this.ligado = true;
        this.proximoFrame();
    },
    desligar: function() {
        this.ligado = false;
    },
    proximoFrame: function() {
        if (!this.ligado) return;

        var agora = new Date().getTime();
        var deltaTime = (agora - this.ultimoTempo) / 1000.0; // Delta time em segundos (opcional para física)

        this.limparTela();

        // Atualizamos o estado dos sprites
        for (var i in this.sprites) {
            this.sprites[i].atualizar(deltaTime); // Passa deltaTime se os sprites o usarem
        }

        // --- NOVO: Remover sprites marcados como "removivel" ---
        // Filtra o array, mantendo apenas os sprites que NÃO estão marcados para remoção.
        this.sprites = this.sprites.filter(function(sprite) {
            return !sprite.removivel;
        });
        // -------------------------------------------------------

        // Desenhamos os sprites restantes
        for (var i in this.sprites) {
            this.sprites[i].desenhar();
        }

        this.ultimoTempo = agora; // Atualiza o tempo para o próximo ciclo

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
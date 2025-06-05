// Inimigo.js
function Inimigo(context, x, y, jogadorAlvo, animacao, canvas, imagemInimigo, linhasSheet, colunasSheet) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.jogadorAlvo = jogadorAlvo;
    this.animacao = animacao; // <<--- Inimigo precisa desta referência para adicionar lasers e para o laser acessar mundoLargura
    this.canvas = canvas;
    this.tipo = 'inimigo';

    this.raioDeteccao = 1000;
    this.velocidadeLaser = 5;
    this.cooldownTiro = 2000; // 2 segundos
    this.ultimoTiroTempo = 0;
    this.removivel = false;

    this.imagem = imagemInimigo;
    this.sheet = null;
    this.largura = 50;
    this.altura = 50;

    const lSheetValida = (typeof linhasSheet === 'number' && linhasSheet > 0) ? linhasSheet : 1;
    const cSheetValida = (typeof colunasSheet === 'number' && colunasSheet > 0) ? colunasSheet : 1;

    if (this.imagem && this.imagem.complete && this.imagem.naturalHeight > 0 && this.imagem.naturalWidth > 0) {
        try {
            this.sheet = new Spritesheet(this.context, this.imagem, lSheetValida, cSheetValida);
            this.sheet.intervalo = 150;
            this.largura = this.imagem.width / cSheetValida;
            this.altura = this.imagem.height / lSheetValida;
            if (isNaN(this.largura) || isNaN(this.altura) || this.largura <= 0 || this.altura <= 0) {
                console.warn("Inimigo: Cálculo de largura/altura da spritesheet resultou em valor inválido. Usando fallback.", {imgW: this.imagem.width, imgH: this.imagem.height, cS: cSheetValida, lS: lSheetValida});
                this.largura = 50; this.altura = 50; this.sheet = null;
            } else { this.sheet.linha = 0; }
        } catch (e) {
            console.error("Inimigo: ERRO ao criar Spritesheet.", e);
            this.sheet = null; this.largura = 50; this.altura = 50;
        }
    } else {
        console.warn("Inimigo: Imagem não carregada. Usando dimensões de fallback.");
    }
    
    this.hitboxOffsetX = 4; this.hitboxOffsetY = 5;
    this.hitboxLargura = this.largura - (this.hitboxOffsetX * 2);
    this.hitboxAltura = this.altura - (this.hitboxOffsetY * 2);
    if (this.hitboxLargura <= 0) this.hitboxLargura = Math.max(10, this.largura * 0.5);
    if (this.hitboxAltura <= 0) this.hitboxAltura = Math.max(10, this.altura * 0.5);

    console.log("Inimigo criado. L:", this.largura, "A:", this.altura + (this.sheet ? " (Com Spritesheet)" : " (SEM Spritesheet)"));
}

Inimigo.prototype = {
    atualizar: function(deltaTime) {
        if (this.sheet) {
            this.sheet.proximoQuadro();
        }

        if (!this.jogadorAlvo || !this.jogadorAlvo.estaVivo || (typeof this.jogadorAlvo.estaVivo === 'function' && !this.jogadorAlvo.estaVivo())) {
            // console.log("[Inimigo.atualizar] Jogador alvo não existe ou está morto.");
            return;
        }

        let centroInimigoX = this.x + this.largura / 2;
        let centroInimigoY = this.y + this.altura / 2;
        let centroJogadorX = this.jogadorAlvo.x + (this.jogadorAlvo.largura || 0) / 2;
        let centroJogadorY = this.jogadorAlvo.y + (this.jogadorAlvo.altura || 0) / 2;

        let dx = centroJogadorX - centroInimigoX;
        let dy = centroJogadorY - centroInimigoY;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        // console.log("[Inimigo.atualizar] Distância para o jogador:", distancia.toFixed(1), "Raio de Detecção:", this.raioDeteccao);

        if (distancia <= this.raioDeteccao) {
            console.log("[Inimigo.atualizar] Jogador DENTRO do raio de detecção!"); // LOG 1
            let agora = new Date().getTime();
            let tempoDesdeUltimoTiro = agora - this.ultimoTiroTempo;
            // console.log("[Inimigo.atualizar] Cooldown check: Tempo desde último tiro:", tempoDesdeUltimoTiro, "Cooldown necessário:", this.cooldownTiro);

            if (tempoDesdeUltimoTiro > this.cooldownTiro) {
                console.log("[Inimigo.atualizar] Cooldown PERMITE tiro! Chamando atirarLaser..."); // LOG 2
                this.atirarLaser(dx, dy, distancia);
                this.ultimoTiroTempo = agora;
            } else {
                // console.log("[Inimigo.atualizar] Cooldown AINDA ATIVO. Esperando para atirar.");
            }
        } else {
            // console.log("[Inimigo.atualizar] Jogador FORA do raio de detecção.");
        }
    },

    atirarLaser: function(dxParaJogador, dyParaJogador, distanciaAteJogador) {
        console.log("[Inimigo.atirarLaser] >>> MÉTODO ATIRAR LASER CHAMADO!"); // LOG 3
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;
        let dirX = 0; // Inicializa dirX
        let dirY = 0; // Inicializa dirY

        if (distanciaAteJogador > 0) { // Evita divisão por zero se a distância for 0
            dirX = dxParaJogador / distanciaAteJogador;
            dirY = dyParaJogador / distanciaAteJogador;
        }
        
        console.log("[Inimigo.atirarLaser] Origem do Laser: (", origemX.toFixed(1), ",", origemY.toFixed(1), ") Direção Vetor: (", dxParaJogador.toFixed(2), ",", dyParaJogador.toFixed(2) ,") Dist:", distanciaAteJogador.toFixed(2) , " DirNormalizada: (", dirX.toFixed(2), ",", dirY.toFixed(2), ")"); // LOG 4

        try {
            // Passa a referência da animação para o Laser, para que ele possa acessar mundoLargura
            var laser = new Laser(this.context, origemX, origemY, dirX, dirY, this.velocidadeLaser, this.canvas, this.animacao); // <<--- PASSANDO this.animacao
            console.log("[Inimigo.atirarLaser] Instância de Laser criada:", laser); // LOG 5
            if (this.animacao && typeof this.animacao.novoSprite === 'function') {
                this.animacao.novoSprite(laser); // O Laser já tem this.tipo = 'laserInimigo'
                console.log("[Inimigo.atirarLaser] Laser adicionado à animação."); // LOG 6
            } else {
                console.error("[Inimigo.atirarLaser] ERRO: this.animacao ou this.animacao.novoSprite não está definido!", this.animacao);
            }
        } catch (e) {
            console.error("[Inimigo.atirarLaser] ERRO CRÍTICO ao criar ou adicionar Laser:", e);
        }
        console.log("[Inimigo.atirarLaser] <<< MÉTODO ATIRAR LASER FINALIZADO."); // LOG 7
    },

    desenhar: function() { /* ... como na sua última versão, com this.desenharHitbox() ainda descomentado se quiser ... */
        var ctx = this.context; ctx.save();
        if (this.sheet) { this.sheet.desenhar(this.x, this.y); }
        else { ctx.fillStyle = 'purple'; ctx.fillRect(this.x, this.y, this.largura, this.altura); }
        this.desenharHitbox(); // Mantendo como você tinha, para depuração
        ctx.restore();
    },
    getHitboxMundo: function() { /* ... como antes ... */ 
        return { x: this.x + this.hitboxOffsetX, y: this.y + this.hitboxOffsetY, largura: this.hitboxLargura, altura: this.hitboxAltura };
    },
    desenharHitbox: function() { /* ... como antes ... */
        var hitbox = this.getHitboxMundo(); var ctx = this.context;
        ctx.save(); ctx.strokeStyle = 'red'; ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.largura, hitbox.altura);
        ctx.restore();
    }
};
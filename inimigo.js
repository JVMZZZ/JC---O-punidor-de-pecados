// Inimigo.js
function Inimigo(context, x, y, jogadorAlvo, animacao, canvas) {
    this.context = context;
    this.x = x; // Posição X do inimigo no mundo
    this.y = y; // Posição Y do inimigo no mundo
    this.largura = 50; // Largura do inimigo para desenho e colisão
    this.altura = 50; // Altura do inimigo
    this.cor = 'purple'; // Cor para desenhar o inimigo (temporário)

    this.jogadorAlvo = jogadorAlvo; // Referência ao objeto JC
    this.animacao = animacao;     // Referência ao sistema de animação (para adicionar lasers)
    this.canvas = canvas;         // Referência ao canvas (para limites, etc.)

    this.raioDeteccao = 800; // Raio em pixels para detectar o jogador
    
    this.velocidadeLaser = 5; // Velocidade do laser que será disparado
    this.cooldownTiro = 2000; // Intervalo entre os tiros em milissegundos (2 segundos)
    this.ultimoTiroTempo = 0; // Para controlar o cooldown

    this.removivel = false; // Inimigos geralmente não são removidos a menos que derrotados
    
    console.log("Inimigo criado em x:" + this.x + ", y:" + this.y);
}

Inimigo.prototype = {
    atualizar: function(deltaTime) {
        if (!this.jogadorAlvo || this.jogadorAlvo.estaMorto) {
            // Se não há jogador ou o jogador está morto, o inimigo pode ficar parado ou patrulhar
            return;
        }

        // Calcular a distância até o jogador
        // (Centro do inimigo para centro do jogador)
        let centroInimigoX = this.x + this.largura / 2;
        let centroInimigoY = this.y + this.altura / 2;
        let centroJogadorX = this.jogadorAlvo.x + this.jogadorAlvo.largura / 2;
        let centroJogadorY = this.jogadorAlvo.y + this.jogadorAlvo.altura / 2;

        let dx = centroJogadorX - centroInimigoX;
        let dy = centroJogadorY - centroInimigoY;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        // Verificar se o jogador está dentro do raio de detecção
        if (distancia <= this.raioDeteccao) {
            // console.log('JC detectado pelo inimigo! Distância:', distancia.toFixed(2)); // Log para depuração
            
            // Tentar atirar (respeitando o cooldown)
            let agora = new Date().getTime();
            if (agora - this.ultimoTiroTempo > this.cooldownTiro) {
                this.atirarLaser(dx, dy, distancia); // Passa o vetor e a distância para o tiro
                this.ultimoTiroTempo = agora; // Reseta o tempo do último tiro
            }
        }
        // Lógica de movimento do inimigo pode ser adicionada aqui no futuro
    },

    desenhar: function() {
        // Desenha um simples retângulo vermelho para o inimigo
        var ctx = this.context;
        ctx.save();
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.x, this.y, this.largura, this.altura);
        
        // Opcional: Desenhar o raio de detecção (para depuração)
        // ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        // ctx.beginPath();
        // ctx.arc(this.x + this.largura / 2, this.y + this.altura / 2, this.raioDeteccao, 0, Math.PI * 2);
        // ctx.stroke();
        
        ctx.restore();
    },

    atirarLaser: function(dxParaJogador, dyParaJogador, distanciaAteJogador) {
        console.log("Inimigo ATIRANDO LASER!");

        // Calcular ponto de origem do laser (ex: centro do inimigo)
        let origemX = this.x + this.largura / 2;
        let origemY = this.y + this.altura / 2;

        // Calcular componentes normalizados do vetor direção para o jogador
        // Isso garante que a velocidade do laser seja constante, independentemente da distância.
        let dirX = dxParaJogador / distanciaAteJogador;
        let dirY = dyParaJogador / distanciaAteJogador;

        // Criar o laser
        var laser = new Laser(this.context, origemX, origemY, dirX, dirY, this.velocidadeLaser, this.canvas);
        
        // Adicionar o laser ao sistema de animação
        this.animacao.novoSprite(laser);
    }
};
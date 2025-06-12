// teclado.js
// Este arquivo define a classe 'Teclado', um gerenciador de input

// --- Constantes de Teclas ---
// Mapeia os 'keyCodes' (códigos numéricos das teclas) para nomes legíveis.
// Isso torna o código que usa este módulo muito mais fácil de entender.
var SETA_ESQUERDA = 37;
var SETA_DIREITA = 39;
var SETA_CIMA = 38;
var ESPACO = 32;

var TECLA_A = 65; // Tecla A
var TECLA_D = 68; // Tecla D
var TECLA_W = 87; // Tecla W
var TECLA_P = 80; // Tecla P (para dano de teste)
var TECLA_R = 82; // Tecla R (para restaurar vidas)

/**
 * Construtor para o gerenciador de Teclado.
 */
function Teclado(elemento) {
    this.elemento = elemento; // Armazena o elemento que dispara os eventos.

    // --- Arrays de Estado ---
    // Mantém o estado de quais teclas estão sendo pressionadas em tempo real.
    // Ex: this.pressionadas[37] será 'true' enquanto a seta esquerda estiver pressionada.
    this.pressionadas = [];

    // Array para controlar ações de "disparo único" (como pular ou atirar).
    // Garante que a ação não se repita continuamente se a tecla for mantida pressionada.
    this.disparadas = [];

    // Array que armazena as funções (callbacks) a serem executadas para cada ação de disparo único.
    this.funcoesDisparo = [];

    // Variável para guardar a referência do 'this' da classe Teclado.
    // Necessário porque dentro das funções de evento, o 'this' se refere ao 'elemento' (ex: document).
    var teclado_self = this;

    // --- Adiciona os 'Ouvintes' de Eventos ---
    // Evento 'keydown': disparado quando uma tecla é pressionada.
    elemento.addEventListener('keydown', function(evento) {
        var tecla = evento.keyCode; // Obtém o código numérico da tecla pressionada.
        teclado_self.pressionadas[tecla] = true; // Marca a tecla como "pressionada".

        // Lógica para Ações de Disparo Único:
        // Verifica se:
        // 1. Existe uma função de disparo associada a esta tecla.
        // 2. A ação para esta tecla ainda NÃO foi disparada nesta sessão de "pressionar".
        if (teclado_self.funcoesDisparo[tecla] && !teclado_self.disparadas[tecla]) {
            // Se as condições forem atendidas...
            teclado_self.disparadas[tecla] = true; // ...marca a ação como "já disparada".
            teclado_self.funcoesDisparo[tecla](); // ...executa a função associada (ex: jc.pular()).
        }
    });

    // Evento 'keyup': disparado quando uma tecla é solta.
    elemento.addEventListener('keyup', function(evento) {
        var tecla = evento.keyCode; // Obtém o código da tecla solta.
        teclado_self.pressionadas[tecla] = false; // Marca a tecla como "não pressionada".
        teclado_self.disparadas[tecla] = false; // "Reseta" o controle de disparo, permitindo que a ação possa ser disparada novamente na próxima vez que a tecla for pressionada.
    });
}

Teclado.prototype = {
    /**
     * Verifica se uma tecla está atualmente pressionada.
     * Ideal para ações contínuas, como andar.
     */
    pressionada: function(tecla) {
        return this.pressionadas[tecla];
    },

    /**
     * Associa uma função (callback) a uma tecla para uma ação de "disparo único".
     * Ideal para ações que devem acontecer apenas uma vez por pressionamento, como pular ou atirar.
     */
    disparou: function(tecla, callback) {
        // Armazena a função no array, na posição correspondente ao código da tecla.
        this.funcoesDisparo[tecla] = callback;
    }
};

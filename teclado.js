// teclado.js
var SETA_ESQUERDA = 37;
var SETA_DIREITA = 39;
var SETA_CIMA = 38;
var ESPACO = 32;

var TECLA_A = 65; // Tecla A
var TECLA_D = 68; // Tecla D
var TECLA_W = 87; // Tecla W
var TECLA_P = 80; // Tecla P (para dano de teste)
var TECLA_R = 82; // <<--- ADICIONADO: Tecla R (para restaurar vidas)

function Teclado(elemento) {
    this.elemento = elemento;
    this.pressionadas = [];
    this.disparadas = [];
    this.funcoesDisparo = [];

    var teclado_self = this;

    elemento.addEventListener('keydown', function(evento) {
        var tecla = evento.keyCode;
        teclado_self.pressionadas[tecla] = true;

        if (teclado_self.funcoesDisparo[tecla] && !teclado_self.disparadas[tecla]) {
            teclado_self.disparadas[tecla] = true;
            teclado_self.funcoesDisparo[tecla]();
        }
        // <<--- CORREÇÃO: Bloco 'if' duplicado removido daqui.
    });

    elemento.addEventListener('keyup', function(evento) {
        var tecla = evento.keyCode;
        teclado_self.pressionadas[tecla] = false;
        teclado_self.disparadas[tecla] = false;
    });
}

Teclado.prototype = {
    pressionada: function(tecla) {
        return this.pressionadas[tecla];
    },
    disparou: function(tecla, callback) {
        this.funcoesDisparo[tecla] = callback;
    }
};
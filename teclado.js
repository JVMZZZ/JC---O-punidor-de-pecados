// arquivo teclado.js (mantido como você forneceu, parece OK)
var SETA_ESQUERDA = 37;
var SETA_DIREITA = 39;
var SETA_CIMA = 38;
var ESPACO = 32; 

var TECLA_A = 65; // Tecla A
var TECLA_D = 68; // Tecla D
var TECLA_W = 87; // Tecla W

function Teclado(elemento) {
    this.elemento = elemento;
    this.pressionadas = [];
    this.disparadas = [];
    this.funcoesDisparo = [];

    var teclado_self = this; // Renomeado para evitar confusão com nome da classe

    elemento.addEventListener('keydown', function(evento) {
        var tecla = evento.keyCode;
        teclado_self.pressionadas[tecla] = true;

        if (teclado_self.funcoesDisparo[tecla] && !teclado_self.disparadas[tecla]) {
            teclado_self.disparadas[tecla] = true;
            teclado_self.funcoesDisparo[tecla](); 
        }

        if (teclado_self.funcoesDisparo[tecla] && !teclado_self.disparadas[tecla]) {
            teclado_self.disparadas[tecla] = true;
            teclado_self.funcoesDisparo[tecla]();

    }
    });

    elemento.addEventListener('keyup', function(evento) {
        var tecla = evento.keyCode; // Adicionado para consistência
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

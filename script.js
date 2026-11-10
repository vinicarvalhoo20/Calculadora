// Pegando os elementos da página
const campoNum1 = document.getElementById("num1");
const campoNum2 = document.getElementById("num2");
const campoOperacao = document.getElementById("operation");
const botaoCalcular = document.getElementById("calculate");
const botaoLimpar = document.getElementById("clear");
const areaResultado = document.getElementById("result");

// Na raiz quadrada só o primeiro número é usado,
// então o segundo campo fica desativado nessa opção
campoOperacao.addEventListener("change", function () {
    const ehRaiz = campoOperacao.value === "sqrt";
    campoNum2.disabled = ehRaiz;
    if (ehRaiz) {
        campoNum2.value = "";
    }
});

// Mostra uma mensagem na área do resultado
function mostrarResultado(texto, ehErro) {
    areaResultado.textContent = texto;
    areaResultado.style.color = ehErro ? "#b91c1c" : "#1f2933";
}

// Converte o texto digitado (ex.: "1.5", "-2", "1e3") em fração exata com BigInt
function textoParaFracao(texto) {
    texto = texto.trim().toLowerCase();
    const partes = texto.split("e");
    const expoente = partes[1] ? parseInt(partes[1], 10) : 0;
    if (Math.abs(expoente) > 300) {
        return null;
    }
    let mantissa = partes[0];
    const negativo = mantissa.startsWith("-");
    mantissa = mantissa.replace(/^[+-]/, "");
    const pedacos = mantissa.split(".");
    const inteira = pedacos[0] || "0";
    const decimal = pedacos[1] || "";
    let numerador = BigInt(inteira + decimal);
    if (negativo) {
        numerador = -numerador;
    }
    const casas = decimal.length - expoente;
    if (casas >= 0) {
        return { n: numerador, d: 10n ** BigInt(casas) };
    }
    return { n: numerador * 10n ** BigInt(-casas), d: 1n };
}

function mdc(a, b) {
    while (b !== 0n) {
        const resto = a % b;
        a = b;
        b = resto;
    }
    return a;
}

// Se a divisão for uma dízima periódica, devolve o texto com "..."
// (10 casas, sem arredondar). Se for exata, devolve null.
function dizimaPeriodica(texto1, texto2) {
    try {
        const f1 = textoParaFracao(texto1);
        const f2 = textoParaFracao(texto2);
        if (!f1 || !f2 || f2.n === 0n) {
            return null;
        }

        let numerador = f1.n * f2.d;
        let denominador = f1.d * f2.n;
        const negativo = (numerador < 0n) !== (denominador < 0n);
        if (numerador < 0n) numerador = -numerador;
        if (denominador < 0n) denominador = -denominador;

        // Simplifica a fração
        const divisor = mdc(numerador, denominador);
        if (divisor > 0n) {
            numerador = numerador / divisor;
            denominador = denominador / divisor;
        }

        // Só termina se o denominador tiver apenas os fatores 2 e 5
        let resto = denominador;
        while (resto % 2n === 0n) resto = resto / 2n;
        while (resto % 5n === 0n) resto = resto / 5n;
        if (resto === 1n) {
            return null; // divisão exata
        }

        // Divisão longa exata: 10 casas decimais, cortando (sem arredondar)
        const escala = 10n ** 10n;
        const valor = (numerador * escala) / denominador;
        const parteInteira = (valor / escala).toLocaleString("pt-BR");
        const parteDecimal = (valor % escala).toString().padStart(10, "0");
        return (negativo ? "-" : "") + parteInteira + "," + parteDecimal + "...";
    } catch (erro) {
        return null;
    }
}

function calcular() {
    const operacao = campoOperacao.value;
    const num1 = parseFloat(campoNum1.value);
    const num2 = parseFloat(campoNum2.value);

    // Validação: precisa escolher uma operação
    if (operacao === "") {
        mostrarResultado("Alerta: Selecione uma operação", true);
        return;
    }

    // Validação: o primeiro número é sempre obrigatório
    if (isNaN(num1)) {
        mostrarResultado("Preencha todos os campos...", true);
        return;
    }

    // O segundo número é obrigatório, exceto na raiz quadrada
    if (operacao !== "sqrt" && isNaN(num2)) {
        mostrarResultado("Preencha todos os campos...", true);
        return;
    }

    let resultado;
    let textoDizima = null;

    switch (operacao) {
        case "add":
            resultado = num1 + num2;
            break;
        case "subtract":
            resultado = num1 - num2;
            break;
        case "multiply":
            resultado = num1 * num2;
            break;
        case "divide":
            if (num2 === 0) {
                mostrarResultado("Erro: Divisão por zero", true);
                return;
            }
            resultado = num1 / num2;
            textoDizima = dizimaPeriodica(campoNum1.value, campoNum2.value);
            break;
        case "power":
            resultado = Math.pow(num1, num2);
            break;
        case "sqrt":
            if (num1 < 0) {
                mostrarResultado("Não existe raiz quadrada real de número negativo.", true);
                return;
            }
            resultado = Math.sqrt(num1);
            break;
    }

    // Casos como potência negativa com expoente decimal ou números gigantes
    if (!isFinite(resultado)) {
        mostrarResultado("O resultado não pôde ser calculado.", true);
        return;
    }

    // Divisão com dízima periódica: mostra as casas seguidas de "..."
    if (textoDizima) {
        mostrarResultado("Resultado: " + textoDizima, false);
        return;
    }

    // Evita resultados como 0.30000000000000004 (0.1 + 0.2)
    resultado = parseFloat(resultado.toFixed(10));

    mostrarResultado("Resultado: " + resultado.toLocaleString("pt-BR", { maximumFractionDigits: 10 }), false);
}

botaoCalcular.addEventListener("click", calcular);

// Limpa os números, a operação e o resultado
function limpar() {
    campoNum1.value = "";
    campoNum2.value = "";
    campoNum2.disabled = false;
    campoOperacao.value = "";
    areaResultado.textContent = "";
    areaResultado.style.color = "#1f2933";
    campoNum1.focus();
}

botaoLimpar.addEventListener("click", limpar);
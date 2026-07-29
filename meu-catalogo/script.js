// Pegando os elementos do HTML que vamos usar
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');

// Função principal: Cria o elemento visual na tela (Manipulação do DOM)
function adicionarFilmeNaTela(nome) {
    // Cria um novo 'cartão' de filme
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    // Define o conteúdo dentro do cartão
    novoCartao.innerHTML = `
        <div class="poster-placeholder">Pôster Genérico</div>
        <h2>${nome}</h2>
        <span class="ano">2024</span>
        <button class="btn-remover" style="margin-top: 10px; padding: 5px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Remover</button>
    `;

    // Adiciona o evento de 'clique' no botão de remover
    const btnRemover = novoCartao.querySelector('.btn-remover');
    btnRemover.addEventListener('click', function() {
        novoCartao.remove(); // Remove o filme da tela
        salvarLista(); // Atualiza o armazenamento local para não voltar quando recarregar
    });

    // Adiciona o novo cartão na nossa grade de filmes
    gridCatalogo.appendChild(novoCartao);
}

// Evento de 'clique' no botão "Adicionar à Lista"
btnAdicionar.addEventListener('click', function() {
    const nomeDoFilme = inputFilme.value; // Pega o que o usuário digitou
    
    // Verifica se o campo não está vazio
    if (nomeDoFilme.trim() !== '') {
        adicionarFilmeNaTela(nomeDoFilme);
        salvarLista(); // Salva a alteração
        inputFilme.value = ''; // Limpa o campo de texto
    }
});

// --- SISTEMA DE SALVAMENTO (localStorage) --- //

// Função para salvar a lista no navegador para que não desapareça 
function salvarLista() {
    const titulos = [];
    // Pega todos os títulos (h2) que estão na tela atualmente
    document.querySelectorAll('.cartao-filme h2').forEach(function(titulo) {
        titulos.push(titulo.innerText);
    });
    // Salva no localStorage como texto (JSON)
    localStorage.setItem('meusFilmes', JSON.stringify(titulos));
}

// Função para carregar a lista quando a página for aberta/recarregada
function carregarLista() {
    // Pega os dados salvos ou cria uma lista vazia se for a primeira vez
    const filmesSalvos = JSON.parse(localStorage.getItem('meusFilmes') || '[]');
    
    // Para cada filme salvo, adiciona na tela
    filmesSalvos.forEach(function(filme) {
        adicionarFilmeNaTela(filme);
    });
}

// Inicia o carregamento assim que o script roda
carregarLista();

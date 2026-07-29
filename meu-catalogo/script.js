// Pegando os elementos do HTML que vamos usar
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');

// COLOQUE SUA CHAVE DE API ABAIXO (Mantenha as aspas)
const API_KEY = '8bc7947d8c4434f647948194c998adbf'; 

// --- 1. FUNÇÃO QUE CONVERSA COM A API DO TMDB --- //
async function buscarFilmeNaAPI(nome) {
    // Monta a URL de busca em português
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nome)}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        // Verifica se a API encontrou algum resultado
        if (dados.results && dados.results.length > 0) {
            const filme = dados.results[0]; // Pega o primeiro filme da lista
            
            // Retorna um objeto organizando os dados que precisamos
            return {
                titulo: filme.title,
                ano: filme.release_date ? filme.release_date.substring(0, 4) : 'Ano desconhecido',
                sinopse: filme.overview || 'Sinopse não disponível em português.',
                // Monta o link da imagem oficial (w500 é o tamanho da imagem)
                poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null
            };
        } else {
            alert('Filme não encontrado no banco de dados!');
            return null;
        }
    } catch (erro) {
        console.error('Erro ao buscar o filme:', erro);
        alert('Ocorreu um erro ao buscar o filme. Verifique sua conexão ou a Chave da API.');
        return null;
    }
}

// --- 2. FUNÇÃO QUE CRIA O VISUAL NA TELA --- //
function adicionarFilmeNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    // Verifica se o filme tem pôster, se não tiver, usa um texto alternativo
    const imagemPoster = dadosFilme.poster 
        ? `<img src="${dadosFilme.poster}" alt="Pôster de ${dadosFilme.titulo}" style="width: 100%; border-radius: 4px; margin-bottom: 15px;">`
        : `<div class="poster-placeholder" style="height: 350px; background: #ddd; display: flex; align-items: center; justify-content: center;">Sem Pôster</div>`;

    // Preenche o HTML do cartão com os dados reais da API
    novoCartao.innerHTML = `
        ${imagemPoster}
        <h2>${dadosFilme.titulo}</h2>
        <span class="ano" style="color: #007bff; font-weight: bold; display: block; margin-bottom: 10px;">${dadosFilme.ano}</span>
        <p style="font-size: 0.9rem; color: #555; text-align: left; margin-bottom: 15px;">${dadosFilme.sinopse}</p>
        <button class="btn-remover" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Remover</button>
    `;

    // Função de remover
    const btnRemover = novoCartao.querySelector('.btn-remover');
    btnRemover.addEventListener('click', function() {
        novoCartao.remove(); 
        salvarLista(); 
    });

    gridCatalogo.appendChild(novoCartao);
}

// --- 3. EVENTO DO BOTÃO ADICIONAR --- //
btnAdicionar.addEventListener('click', async function() {
    const nomeDoFilme = inputFilme.value; 
    
    if (nomeDoFilme.trim() !== '') {
        btnAdicionar.innerText = 'Buscando...'; // Feedback visual
        btnAdicionar.disabled = true; // Impede duplo clique

        // Espera a resposta da API
        const dadosFilme = await buscarFilmeNaAPI(nomeDoFilme);
        
        // Se a API retornou dados válidos, coloca na tela
        if (dadosFilme) {
            adicionarFilmeNaTela(dadosFilme);
            salvarLista(); 
            inputFilme.value = ''; 
        }

        btnAdicionar.innerText = 'Adicionar à Lista';
        btnAdicionar.disabled = false;
    }
});

// --- 4. SISTEMA DE SALVAMENTO (localStorage) --- //
function salvarLista() {
    const filmes = [];
    // Varre todos os cartões na tela e extrai os dados para salvar
    document.querySelectorAll('.cartao-filme').forEach(function(cartao) {
        filmes.push({
            titulo: cartao.querySelector('h2').innerText,
            ano: cartao.querySelector('.ano').innerText,
            sinopse: cartao.querySelector('p').innerText,
            poster: cartao.querySelector('img') ? cartao.querySelector('img').src : null
        });
    });
    // Mudamos o nome da chave para 'meusFilmesAPICatalogo' para começar uma lista limpa
    localStorage.setItem('meusFilmesAPICatalogo', JSON.stringify(filmes));
}

function carregarLista() {
    const filmesSalvos = JSON.parse(localStorage.getItem('meusFilmesAPICatalogo') || '[]');
    filmesSalvos.forEach(function(filme) {
        adicionarFilmeNaTela(filme);
    });
}

// Inicia o carregamento assim que o script roda
carregarLista();

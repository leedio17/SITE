// Pegando os elementos do HTML
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');

// COLOQUE SUA CHAVE DE API DO TMDB ABAIXO
const API_KEY = '8bc7947d8c4434f647948194c998adbf'; 

// --- 1. FUNÇÃO QUE CONVERSA COM O TMDB (Busca os pôsteres) --- //
async function buscarFilmeNaAPI(nome) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nome)}`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (dados.results && dados.results.length > 0) {
            const filme = dados.results[0];
            return {
                titulo: filme.title,
                ano: filme.release_date ? filme.release_date.substring(0, 4) : 'Ano desconhecido',
                sinopse: filme.overview || 'Sinopse não disponível em português.',
                poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null
            };
        } else {
            alert('Filme não encontrado!');
            return null;
        }
    } catch (erro) {
        console.error('Erro ao buscar o filme no TMDB:', erro);
        return null;
    }
}

// --- 2. FUNÇÃO QUE CRIA O VISUAL NA TELA --- //
function adicionarFilmeNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster 
        ? `<img src="${dadosFilme.poster}" alt="Pôster de ${dadosFilme.titulo}" style="width: 100%; border-radius: 4px; margin-bottom: 15px;">`
        : `<div class="poster-placeholder" style="height: 350px; background: #ddd; display: flex; align-items: center; justify-content: center;">Sem Pôster</div>`;

    novoCartao.innerHTML = `
        ${imagemPoster}
        <h2>${dadosFilme.titulo}</h2>
        <span class="ano" style="color: #007bff; font-weight: bold; display: block; margin-bottom: 10px;">${dadosFilme.ano}</span>
        <p style="font-size: 0.9rem; color: #555; text-align: left; margin-bottom: 15px;">${dadosFilme.sinopse}</p>
        <button class="btn-remover" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Remover</button>
    `;

    // Função de remover integrada com o Back-end
    const btnRemover = novoCartao.querySelector('.btn-remover');
    btnRemover.addEventListener('click', async function() {
        try {
            // USANDO O LINK REAL DA SUA RENDER AQUI:
            await fetch(`https://api-meu-catalogo.onrender.com/filmes/${dadosFilme._id}`, {
                method: 'DELETE'
            });
            
            novoCartao.remove(); // Remove da tela visualmente
        } catch (erro) {
            console.error("Erro ao excluir o filme:", erro);
        }
    });

// --- 3. EVENTO DO BOTÃO ADICIONAR --- //
btnAdicionar.addEventListener('click', async function() {
    const nomeDoFilme = inputFilme.value; 
    
    if (nomeDoFilme.trim() !== '') {
        btnAdicionar.innerText = 'Buscando...'; 
        btnAdicionar.disabled = true; 

        const dadosFilme = await buscarFilmeNaAPI(nomeDoFilme);
        
        if (dadosFilme) {
            try {
                // 1º: Envia para o back-end salvar e AGORA guardamos a resposta que vem dele
                const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosFilme)
                });
                
                const filmeSalvoNoBanco = await resposta.json();
                
                // 2º: Mostra na tela usando o objeto que já vem com o _id gerado pelo MongoDB
                adicionarFilmeNaTela(filmeSalvoNoBanco);

            } catch (erro) {
                console.error("Erro ao salvar no back-end:", erro);
            }

            inputFilme.value = ''; 
        }

        btnAdicionar.innerText = 'Adicionar à Lista';
        btnAdicionar.disabled = false;
    }
});
// --- 4. CARREGAR DO BACK-END (Substitui o localStorage) --- //
async function carregarListaDoServidor() {
    try {
        // Pede a lista para o nosso servidor (Rota GET)
        const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes');
        const filmesSalvos = await resposta.json();
        
        // Coloca cada filme retornado pelo servidor na tela
        filmesSalvos.forEach(function(filme) {
            adicionarFilmeNaTela(filme);
        });
    } catch (erro) {
        console.error('Erro ao conectar com o servidor. O back-end está rodando?', erro);
    }
}

// Inicia a busca no servidor assim que o site abre
carregarListaDoServidor();

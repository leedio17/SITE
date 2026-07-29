// Pegando os elementos do HTML
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');

// SUA CHAVE DE API DO TMDB
const API_KEY = '8bc7947d8c4434f647948194c998adbf'; 

// Criação dinâmica da caixa de sugestões (Autocomplete)
const containerInput = inputFilme.parentNode;
containerInput.style.position = 'relative'; // Garante o posicionamento correto da lista

const listaSugestoes = document.createElement('div');
listaSugestoes.id = 'sugestoes-autocomplete';
listaSugestoes.style.position = 'absolute';
listaSugestoes.style.top = '100%';
listaSugestoes.style.left = '0';
listaSugestoes.style.right = '0';
listaSugestoes.style.zIndex = '1000';
listaSugestoes.style.background = '#1f1f1f';
listaSugestoes.style.border = '1px solid #374151';
listaSugestoes.style.borderRadius = '0 0 6px 6px';
listaSugestoes.style.maxHeight = '200px';
listaSugestoes.style.overflowY = 'auto';
containerInput.appendChild(listaSugestoes);

// --- 1. BUSCAR SUGESTÕES EM TEMPO REAL (AUTOCOMPLETE) --- //
inputFilme.addEventListener('input', async function() {
    const termo = inputFilme.value.trim();
    
    if (termo.length < 2) {
        listaSugestoes.innerHTML = '';
        return;
    }

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(termo)}`;
    
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        listaSugestoes.innerHTML = '';
        
        if (dados.results && dados.results.length > 0) {
            // Exibe até 5 opções semelhantes
            dados.results.slice(0, 5).forEach(filme => {
                const item = document.createElement('div');
                const ano = filme.release_date ? filme.release_date.substring(0, 4) : 'N/A';
                item.style.padding = '10px 15px';
                item.style.cursor = 'pointer';
                item.style.borderBottom = '1px solid #2d2d2d';
                item.style.color = '#f3f4f6';
                item.style.fontSize = '0.9rem';
                item.innerHTML = `<strong>${filme.title}</strong> (${ano})`;
                
                // Efeito hover na sugestão
                item.addEventListener('mouseenter', () => item.style.background = '#374151');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                
                // Ao clicar na sugestão, preenche o input e salva direto
                item.addEventListener('click', async () => {
                    inputFilme.value = filme.title;
                    listaSugestoes.innerHTML = '';
                    await adicionarFilmeSelecionado({
                        titulo: filme.title,
                        ano: ano,
                        sinopse: filme.overview || 'Sinopse não disponível em português.',
                        poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null
                    });
                });
                
                listaSugestoes.appendChild(item);
            });
        }
    } catch (erro) {
        console.error('Erro ao buscar sugestões:', erro);
    }
});

// Fecha as sugestões se clicar fora
document.addEventListener('click', (e) => {
    if (!containerInput.contains(e.target)) {
        listaSugestoes.innerHTML = '';
    }
});

// --- 2. FUNÇÃO AUXILIAR PARA SALVAR O FILME ESCOLHIDO --- //
async function adicionarFilmeSelecionado(dadosFilme) {
    try {
        const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFilme)
        });
        
        const filmeSalvoNoBanco = await resposta.json();
        adicionarFilmeNaTela(filmeSalvoNoBanco);
    } catch (erro) {
        console.error("Erro ao salvar no back-end:", erro);
    }
    inputFilme.value = '';
}

// --- 3. FUNÇÃO QUE CRIA O VISUAL NA TELA --- //
function adicionarFilmeNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster 
        ? `<img src="${dadosFilme.poster}" alt="Pôster de ${dadosFilme.titulo}">`
        : `<div class="poster-placeholder" style="height: 320px; background: #2d2d2d; display: flex; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 12px; border-radius: 4px;">Sem Pôster</div>`;

    novoCartao.innerHTML = `
        ${imagemPoster}
        <h2>${dadosFilme.titulo}</h2>
        <span class="ano">${dadosFilme.ano}</span>
        <p>${dadosFilme.sinopse}</p>
        <button class="btn-remover">Remover</button>
    `;

    const btnRemover = novoCartao.querySelector('.btn-remover');
    btnRemover.addEventListener('click', async function() {
        try {
            await fetch(`https://api-meu-catalogo.onrender.com/filmes/${dadosFilme._id}`, {
                method: 'DELETE'
            });
            novoCartao.remove();
        } catch (erro) {
            console.error("Erro ao excluir o filme:", erro);
        }
    });

    gridCatalogo.appendChild(novoCartao);
}

// --- 4. EVENTO DO BOTÃO ADICIONAR (Caso queira digitar e apertar o botão direto) --- //
btnAdicionar.addEventListener('click', async function() {
    const nomeDoFilme = inputFilme.value; 
    
    if (nomeDoFilme.trim() !== '') {
        btnAdicionar.innerText = 'Buscando...'; 
        btnAdicionar.disabled = true; 

        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(nomeDoFilme)}`;
        try {
            const resposta = await fetch(url);
            const dados = await resposta.json();
            if (dados.results && dados.results.length > 0) {
                const filme = dados.results[0];
                await adicionarFilmeSelecionado({
                    titulo: filme.title,
                    ano: filme.release_date ? filme.release_date.substring(0, 4) : 'Ano desconhecido',
                    sinopse: filme.overview || 'Sinopse não disponível em português.',
                    poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null
                });
            } else {
                alert('Filme não encontrado!');
            }
        } catch (erro) {
            console.error('Erro ao buscar o filme:', erro);
        }

        btnAdicionar.innerText = 'Adicionar à Lista';
        btnAdicionar.disabled = false;
        listaSugestoes.innerHTML = '';
    }
});

// --- 5. CARREGAR DO BACK-END --- //
async function carregarListaDoServidor() {
    try {
        const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes');
        const filmesSalvos = await resposta.json();
        
        if (Array.isArray(filmesSalvos)) {
            filmesSalvos.forEach(function(filme) {
                adicionarFilmeNaTela(filme);
            });
        }
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
    }
}

carregarListaDoServidor();

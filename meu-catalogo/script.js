// Pegando os elementos do HTML
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');
const painelNavegacao = document.getElementById('painel-navegacion');
const btnVoltar = document.getElementById('btn-voltar');

// SUA CHAVE DE API DO TMDB
const API_KEY = '8bc7947d8c4434f647948194c998adbf'; 

// --- CRIAÇÃO DINÂMICA DA CAIXA DE SUGESTÕES (AUTOCOMPLETE) --- //
const containerInput = inputFilme.parentNode;
containerInput.style.position = 'relative'; 

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
            dados.results.slice(0, 5).forEach(filme => {
                const item = document.createElement('div');
                const ano = filme.release_date ? filme.release_date.substring(0, 4) : 'N/A';
                item.style.padding = '10px 15px';
                item.style.cursor = 'pointer';
                item.style.borderBottom = '1px solid #2d2d2d';
                item.style.color = '#f3f4f6';
                item.style.fontSize = '0.9rem';
                item.innerHTML = `<strong>${filme.title}</strong> (${ano})`;
                
                item.addEventListener('mouseenter', () => item.style.background = '#374151');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                
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

// --- 2. FUNÇÃO AUXILIAR PARA SALVAR O FILME ESCOLHIDO (POST) --- //
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

// --- 3. FUNÇÃO QUE CRIA O VISUAL NA TELA (MEUS SALVOS) --- //
function adicionarFilmeNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster 
        ? `<img src="${dadosFilme.poster}" alt="Pôster de ${dadosFilme.titulo}">`
        : `<div class="poster-placeholder" style="height: 320px; background: #2d2d2d; display: flex; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 12px; border-radius: 4px;">Sem Pôster</div>`;

    const corFavorito = dadosFilme.favorito ? '#ef4444' : '#9ca3af';

    novoCartao.innerHTML = `
        ${imagemPoster}
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>${dadosFilme.titulo}</h2>
            <button class="btn-favorito" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: ${corFavorito};">❤️</button>
        </div>
        <span class="ano">${dadosFilme.ano}</span>
        <p>${dadosFilme.sinopse}</p>
        <button class="btn-remover">Remover</button>
    `;

    // Ação do Botão de Favorito (PATCH)
    const btnFavorito = novoCartao.querySelector('.btn-favorito');
    btnFavorito.addEventListener('click', async function() {
        try {
            const novoStatus = !dadosFilme.favorito;
            const resposta = await fetch(`https://api-meu-catalogo.onrender.com/filmes/${dadosFilme._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favorito: novoStatus })
            });
            
            if (resposta.ok) {
                dadosFilme.favorito = novoStatus;
                btnFavorito.style.color = novoStatus ? '#ef4444' : '#9ca3af';
            }
        } catch (erro) {
            console.error("Erro ao atualizar favorito:", erro);
        }
    });

    // Ação do Botão de Remover (DELETE)
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

// --- 4. FUNÇÃO VISUAL PARA OS FILMES DE EXPLORAÇÃO E RECOMENDAÇÃO --- //
function adicionarFilmeExploracaoNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster 
        ? `<img src="${dadosFilme.poster}" alt="Pôster de ${dadosFilme.titulo}">`
        : `<div class="poster-placeholder" style="height: 320px; background: #2d2d2d; display: flex; align-items: center; justify-content: center; color: #9ca3af; margin-bottom: 12px; border-radius: 4px;">Sem Pôster</div>`;

    novoCartao.innerHTML = `
        ${imagemPoster}
        <h2>${dadosFilme.titulo}</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="ano">${dadosFilme.ano}</span>
            <span style="color: #f5c518; font-weight: bold; font-size: 0.85rem;">⭐ ${dadosFilme.nota}</span>
        </div>
        <p>${dadosFilme.sinopse}</p>
        <span style="font-size: 0.75rem; color: #9ca3af; text-align: center; display: block; padding: 4px;">Modo Exploração</span>
    `;

    gridCatalogo.appendChild(novoCartao);
}

// --- 5. BUSCA DE TOP 20 POR CATEGORIA --- //
async function carregarTop20PorCategoria(genreId) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=vote_average.desc&vote_count.gte=1000&with_genres=${genreId}`;
    
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        if (dados.results && dados.results.length > 0) {
            dados.results.slice(0, 20).forEach(filme => {
                const dadosFilme = {
                    titulo: filme.title,
                    ano: filme.release_date ? filme.release_date.substring(0, 4) : 'N/A',
                    sinopse: filme.overview || 'Sinopse não disponível.',
                    poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null,
                    nota: filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'
                };
                adicionarFilmeExploracaoNaTela(dadosFilme);
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar top 20 da categoria:', erro);
    }
}

// --- 6. FUNÇÃO EXCLUSIVA PARA RECOMENDAÇÕES (5 FILMES ALEATÓRIOS E BONS) --- //
async function carregarRecomendacoes() {
    // Sorteia uma página de 1 a 15 para trazer resultados diferentes a cada clique
    const paginaAleatoria = Math.floor(Math.random() * 15) + 1;
    
    // Filtros: Filmes recentes (2022+), nota maior que 7.0, e um número bom de votos (mínimo 500)
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&primary_release_date.gte=2022-01-01&vote_average.gte=7.0&vote_count.gte=500&page=${paginaAleatoria}`;
    
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        
        if (dados.results && dados.results.length > 0) {
            // O TMDB devolve 20 filmes por página. Vamos embaralhar essa lista...
            const filmesEmbaralhados = dados.results.sort(() => 0.5 - Math.random());
            
            // ...e cortar apenas os 5 primeiros!
            const cincoRecomendacoes = filmesEmbaralhados.slice(0, 5);
            
            cincoRecomendacoes.forEach(filme => {
                const dadosFilme = {
                    titulo: filme.title,
                    ano: filme.release_date ? filme.release_date.substring(0, 4) : 'N/A',
                    sinopse: filme.overview || 'Sinopse não disponível.',
                    poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null,
                    nota: filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'
                };
                
                // Reaproveitamos a função visual do "Modo Exploração" para exibi-los
                adicionarFilmeExploracaoNaTela(dadosFilme);
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar recomendações:', erro);
    }
}

// --- 7. EVENTO DO BOTÃO ADICIONAR (Busca e Salva direto) --- //
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

// --- 8. CARREGAR DO BACK-END --- //
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

// --- 9. GERENCIAMENTO DE CATEGORIAS E BOTÃO DE VOLTAR --- //
const botoesCategoria = document.querySelectorAll('.btn-categoria');

botoesCategoria.forEach(botao => {
    botao.addEventListener('click', async function() {
        // Atualiza o visual dos botões de categoria
        botoesCategoria.forEach(b => {
            b.style.background = '#1f1f1f';
            b.style.color = '#f3f4f6';
            b.style.border = '1px solid #374151';
        });
        
        this.style.background = '#f5c518';
        this.style.color = '#121212';
        this.style.border = 'none';

        const genreId = this.getAttribute('data-genre');
        gridCatalogo.innerHTML = ''; // Limpa a tela

        if (genreId === 'all') {
            // Se for "Meus Salvos", esconde o botão de voltar e puxa do banco
            painelNavegacao.style.display = 'none';
            carregarListaDoServidor();
        } else if (genreId === 'recomendacao') {
            // Se for "Recomendação", mostra o botão de voltar e carrega as sugestões aleatórias
            painelNavegacao.style.display = 'block';
            await carregarRecomendacoes();
        } else {
            // Se escolher uma categoria Top 20, mostra o botão de voltar
            painelNavegacao.style.display = 'block';
            await carregarTop20PorCategoria(genreId);
        }
    });
});

// Ação do Botão de Retorno
if (btnVoltar) {
    btnVoltar.addEventListener('click', function() {
        // Esconde o painel de navegação
        painelNavegacao.style.display = 'none';
        
        // Reseta o estilo visual dos botões para focar em "Meus Salvos"
        botoesCategoria.forEach(b => {
            if (b.getAttribute('data-genre') === 'all') {
                b.style.background = '#f5c518';
                b.style.color = '#121212';
                b.style.border = 'none';
            } else {
                b.style.background = '#1f1f1f';
                b.style.color = '#f3f4f6';
                b.style.border = '1px solid #374151';
            }
        });

        // Limpa a grade e recarrega os filmes salvos do usuário
        gridCatalogo.innerHTML = '';
        carregarListaDoServidor();
    });
}

// --- EFEITO PREMIUM: TRAILER NO HOVER --- //
function aplicarEfeitoTrailer(cartao, tmdbId) {
    let temporizador;
    const containerMidia = cartao.querySelector('.midia-container');
    const imagem = containerMidia.querySelector('img');
    let iframeCriado = containerMidia.querySelector('iframe');

    cartao.addEventListener('mouseenter', () => {
        // Inicia o cronômetro de 1.5 segundos
        temporizador = setTimeout(async () => {
            // Se o iframe ainda não foi criado, busca na API
            if (!iframeCriado && tmdbId) {
                try {
                    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${API_KEY}&language=pt-BR`;
                    const resposta = await fetch(url);
                    const dados = await resposta.json();
                    
                    // Procura o trailer oficial no YouTube
                    const trailer = dados.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
                    
                    if (trailer) {
                        iframeCriado = document.createElement('iframe');
                        // Autoplay, mudo, sem controles e em loop
                        iframeCriado.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}`;
                        containerMidia.appendChild(iframeCriado);
                    }
                } catch (erro) {
                    console.error("Erro ao carregar trailer:", erro);
                }
            }
            
            // Faz a transição suave da imagem para o vídeo
            if (iframeCriado) {
                imagem.style.opacity = '0';
                iframeCriado.style.opacity = '1';
            }
        }, 1500);
    });

    cartao.addEventListener('mouseleave', () => {
        // Se tirou o mouse, cancela o cronômetro imediatamente
        clearTimeout(temporizador);
        
        // Volta para a imagem do pôster
        if (iframeCriado) {
            iframeCriado.style.opacity = '0';
            imagem.style.opacity = '1';
        }
    });
}
// Inicializa carregando os salvos ao abrir a página
carregarListaDoServidor();

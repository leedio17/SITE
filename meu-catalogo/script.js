// Pegando os elementos do HTML
const inputFilme = document.getElementById('novo-filme');
const btnAdicionar = document.getElementById('btn-adicionar');
const gridCatalogo = document.querySelector('.grid-catalogo');
const painelNavegacao = document.getElementById('painel-navegacion');
const btnVoltar = document.getElementById('btn-voltar');

// SUA CHAVE DE API DO TMDB
const API_KEY = '8bc7947d8c4434f647948194c998adbf'; 

// --- SISTEMA DE NOTIFICAÇÕES TOAST --- //
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    
    // Escolhe o ícone baseado no tipo
    let icone = '✅';
    if (tipo === 'erro') icone = '❌';
    if (tipo === 'info') icone = 'ℹ️';

    toast.innerHTML = `<span>${icone}</span> <span>${mensagem}</span>`;
    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => toast.classList.add('mostrar'), 10);

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 400); // Aguarda a animação de saída terminar
    }, 3000);
}

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

// --- FUNÇÃO AUXILIAR DE CARREGAMENTO --- //
function mostrarCarregamento(mensagem, submensagem = "") {
    gridCatalogo.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-texto">${mensagem}</p>
            ${submensagem ? `<p class="loading-subtexto">${submensagem}</p>` : ''}
        </div>
    `;
}

// --- 1. BUSCAR SUGESTÕES EM TEMPO REAL --- //
inputFilme.addEventListener('input', async function() {
    const termo = inputFilme.value.trim();
    if (termo.length < 2) { listaSugestoes.innerHTML = ''; return; }

    try {
        const resposta = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(termo)}`);
        const dados = await resposta.json();
        listaSugestoes.innerHTML = '';
        
        if (dados.results && dados.results.length > 0) {
            dados.results.slice(0, 5).forEach(filme => {
                const item = document.createElement('div');
                const ano = filme.release_date ? filme.release_date.substring(0, 4) : 'N/A';
                item.style.padding = '10px 15px'; item.style.cursor = 'pointer'; item.style.borderBottom = '1px solid #2d2d2d';
                item.style.color = '#f3f4f6'; item.style.fontSize = '0.9rem';
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
                        poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null,
                        tmdbId: filme.id
                    });
                });
                listaSugestoes.appendChild(item);
            });
        }
    } catch (erro) { console.error('Erro sugestões:', erro); }
});

document.addEventListener('click', (e) => {
    if (!containerInput.contains(e.target)) listaSugestoes.innerHTML = '';
});

// --- 2. SALVAR FILME (POST) --- //
async function adicionarFilmeSelecionado(dadosFilme) {
    try {
        const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFilme)
        });
        const filmeSalvoNoBanco = await resposta.json();
        
        // Se for o primeiro filme adicionado (a tela estava vazia), limpa a grade
        if (gridCatalogo.querySelector('.empty-state')) {
            gridCatalogo.innerHTML = '';
        }
        
        adicionarFilmeNaTela(filmeSalvoNoBanco);
        
        // Dispara o Toast de Sucesso!
        mostrarToast(`${dadosFilme.titulo} adicionado aos salvos!`, 'sucesso');
        
    } catch (erro) { console.error("Erro ao salvar:", erro); }
    inputFilme.value = '';
}

// --- 3. VISUAL: MEUS SALVOS --- //
function adicionarFilmeNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster ? `<img src="${dadosFilme.poster}" style="cursor: pointer;">` : `<div style="height: 300px; background: #2d2d2d; cursor: pointer;"></div>`;
    const corFavorito = dadosFilme.favorito ? '#ef4444' : '#9ca3af';

    novoCartao.innerHTML = `
        <div class="midia-container" style="cursor: pointer;">
            ${imagemPoster}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="cursor: pointer;" class="titulo-clicavel">${dadosFilme.titulo}</h2>
            <button class="btn-favorito" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: ${corFavorito};">❤️</button>
        </div>
        <span class="ano">${dadosFilme.ano}</span>
        <p>${dadosFilme.sinopse}</p>
        <button class="btn-remover">Remover</button>
    `;

    // Ações dos botões (Favorito / Remover)
    const btnFavorito = novoCartao.querySelector('.btn-favorito');
    btnFavorito.addEventListener('click', async (e) => {
        e.stopPropagation();
        const novoStatus = !dadosFilme.favorito;
        await fetch(`https://api-meu-catalogo.onrender.com/filmes/${dadosFilme._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorito: novoStatus }) });
        dadosFilme.favorito = novoStatus; btnFavorito.style.color = novoStatus ? '#ef4444' : '#9ca3af';
    });

    const btnRemover = novoCartao.querySelector('.btn-remover');
    btnRemover.addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch(`https://api-meu-catalogo.onrender.com/filmes/${dadosFilme._id}`, { method: 'DELETE' });
        novoCartao.remove();
        
        // Dispara o Toast de Remoção
        mostrarToast('Filme removido da prateleira.', 'info');
        
        // Verifica se ficou vazio após remover
        if (gridCatalogo.querySelectorAll('.cartao-filme').length === 0) {
            gridCatalogo.innerHTML = `
                <div class="empty-state">
                    <h2>Sua prateleira está vazia! 🍿</h2>
                    <p>Busque um filme na barra acima ou explore nossas categorias.</p>
                </div>
            `;
        }
    });

    // Clique no Pôster ou no Título para abrir o Modal
    const midiaContainer = novoCartao.querySelector('.midia-container');
    const tituloClicavel = novoCartao.querySelector('.titulo-clicavel');
    
    const acaoAbrirModal = () => abrirModalDetalhes(dadosFilme.tmdbId, dadosFilme.titulo);
    midiaContainer.addEventListener('click', acaoAbrirModal);
    tituloClicavel.addEventListener('click', acaoAbrirModal);

    aplicarEfeitoTrailer(novoCartao, dadosFilme.tmdbId);
    
    // Inserir no topo (opcional, mas bom para os novos salvos aparecerem primeiro)
    gridCatalogo.prepend(novoCartao);
}

// --- 4. VISUAL: EXPLORAÇÃO (TOP 20, RECOMENDAÇÃO, TRENDING) --- //
function adicionarFilmeExploracaoNaTela(dadosFilme) {
    const novoCartao = document.createElement('div');
    novoCartao.classList.add('cartao-filme');
    
    const imagemPoster = dadosFilme.poster ? `<img src="${dadosFilme.poster}" style="cursor: pointer;">` : `<div style="height: 300px; background: #2d2d2d; cursor: pointer;"></div>`;

    novoCartao.innerHTML = `
        <div class="midia-container" style="cursor: pointer;">
            ${imagemPoster}
        </div>
        <h2 style="cursor: pointer;" class="titulo-clicavel">${dadosFilme.titulo}</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="ano">${dadosFilme.ano}</span>
            <span style="color: #f5c518; font-weight: bold; font-size: 0.85rem;">⭐ ${dadosFilme.nota}</span>
        </div>
        <p>${dadosFilme.sinopse}</p>
    `;

    // Clique no Pôster ou no Título para abrir o Modal
    const midiaContainer = novoCartao.querySelector('.midia-container');
    const tituloClicavel = novoCartao.querySelector('.titulo-clicavel');
    
    const acaoAbrirModal = () => abrirModalDetalhes(dadosFilme.tmdbId, dadosFilme.titulo);
    midiaContainer.addEventListener('click', acaoAbrirModal);
    tituloClicavel.addEventListener('click', acaoAbrirModal);

    aplicarEfeitoTrailer(novoCartao, dadosFilme.tmdbId);
    gridCatalogo.appendChild(novoCartao);
}

// --- 5, 6 E 7. FUNÇÕES DE BUSCA DA API --- //
async function carregarTop20PorCategoria(genreId) {
    mostrarCarregamento("Explorando o catálogo do TMDB...");
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=vote_average.desc&vote_count.gte=1000&with_genres=${genreId}`;
    const dados = await (await fetch(url)).json();
    gridCatalogo.innerHTML = ''; 
    dados.results.slice(0, 20).forEach(filme => processarExibicaoExterna(filme));
}

async function carregarRecomendacoes() {
    mostrarCarregamento("Separando filmes a dedo para você...");
    const pagina = Math.floor(Math.random() * 15) + 1;
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&primary_release_date.gte=2022-01-01&vote_average.gte=7.0&vote_count.gte=500&page=${pagina}`;
    const dados = await (await fetch(url)).json();
    const misturados = dados.results.sort(() => 0.5 - Math.random());
    gridCatalogo.innerHTML = ''; 
    
    // Exibindo 10 recomendações
    misturados.slice(0, 10).forEach(filme => processarExibicaoExterna(filme));
}

async function carregarTop10Semanal() {
    mostrarCarregamento("Buscando as tendências mundiais desta semana...");
    const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR`;
    const dados = await (await fetch(url)).json();
    gridCatalogo.innerHTML = ''; 
    dados.results.slice(0, 10).forEach(filme => processarExibicaoExterna(filme));
}

function processarExibicaoExterna(filme) {
    adicionarFilmeExploracaoNaTela({
        titulo: filme.title, 
        ano: filme.release_date ? filme.release_date.substring(0, 4) : 'N/A',
        sinopse: filme.overview || 'Sinopse não disponível.',
        poster: filme.poster_path ? `https://image.tmdb.org/t/p/w500${filme.poster_path}` : null,
        nota: filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A',
        tmdbId: filme.id
    });
}

// --- 8. BOTÃO ADICIONAR MANUALMENTE --- //
btnAdicionar.addEventListener('click', async function() {
    if (inputFilme.value.trim() !== '') {
        const resposta = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(inputFilme.value)}`);
        const dados = await resposta.json();
        
        if (dados.results && dados.results.length > 0) {
            const f = dados.results[0];
            await adicionarFilmeSelecionado({ 
                titulo: f.title, 
                ano: f.release_date ? f.release_date.substring(0, 4) : '', 
                sinopse: f.overview, 
                poster: f.poster_path ? `https://image.tmdb.org/t/p/w500${f.poster_path}` : null, 
                tmdbId: f.id 
            });
        } else {
            // Toast Substituindo o antigo Alert
            mostrarToast('Filme não encontrado!', 'erro');
        }
    }
});

// --- 9. CARREGAR DO SERVIDOR --- //
async function carregarListaDoServidor() {
    mostrarCarregamento(
        "Conectando ao banco de dados...", 
        "Como usamos um servidor gratuito, isso pode levar até 50 segundos na primeira vez. ☕"
    );
    
    try {
        const resposta = await fetch('https://api-meu-catalogo.onrender.com/filmes');
        const filmesSalvos = await resposta.json();
        gridCatalogo.innerHTML = ''; 
        
        if (Array.isArray(filmesSalvos) && filmesSalvos.length > 0) {
            filmesSalvos.forEach(filme => adicionarFilmeNaTela(filme));
        } else {
            gridCatalogo.innerHTML = `
                <div class="empty-state">
                    <h2>Sua prateleira está vazia! 🍿</h2>
                    <p>Busque um filme na barra acima ou explore nossas categorias.</p>
                </div>
            `;
        }
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        gridCatalogo.innerHTML = `
            <div class="empty-state">
                <h2 style="color: #ef4444;">❌ Erro de Conexão</h2>
                <p>Não foi possível acessar o banco de dados. Tente atualizar a página.</p>
            </div>
        `;
    }
}

// --- 10. BOTÕES DE CATEGORIA --- //
const botoesCategoria = document.querySelectorAll('.btn-categoria');
botoesCategoria.forEach(botao => {
    botao.addEventListener('click', async function() {
        botoesCategoria.forEach(b => { b.style.background = '#1f1f1f'; b.style.color = '#f3f4f6'; b.style.border = '1px solid #374151'; });
        this.style.background = '#f5c518'; this.style.color = '#121212'; this.style.border = 'none';
        
        const genreId = this.getAttribute('data-genre');
        gridCatalogo.innerHTML = '';
        painelNavegacao.style.display = genreId === 'all' ? 'none' : 'block';

        if (genreId === 'all') carregarListaDoServidor();
        else if (genreId === 'recomendacao') await carregarRecomendacoes();
        else if (genreId === 'trending') await carregarTop10Semanal();
        else await carregarTop20PorCategoria(genreId);
    });
});

if (btnVoltar) {
    btnVoltar.addEventListener('click', () => { document.querySelector('[data-genre="all"]').click(); });
}

// --- 11. TRAILER PREMIUM --- //
function aplicarEfeitoTrailer(cartao, tmdbId) {
    let temp; 
    const container = cartao.querySelector('.midia-container');
    const imagem = container.querySelector('img'); 
    let iframe = container.querySelector('iframe');

    cartao.addEventListener('mouseenter', () => {
        temp = setTimeout(async () => {
            if (!iframe && tmdbId) {
                const url = `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${API_KEY}&language=pt-BR`;
                const resposta = await fetch(url);
                const dados = await resposta.json();
                const trailer = dados.results ? dados.results.find(v => v.site === 'YouTube' && v.type === 'Trailer') : null;
                
                if (trailer) {
                    iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}`;
                    iframe.style.pointerEvents = 'none'; 
                    container.appendChild(iframe);
                }
            }
            if (iframe && imagem) { 
                imagem.style.opacity = '0'; 
                iframe.style.opacity = '1'; 
            }
        }, 1500);
    });

    cartao.addEventListener('mouseleave', () => {
        clearTimeout(temp);
        if (iframe && imagem) { 
            iframe.style.opacity = '0'; 
            imagem.style.opacity = '1'; 
        }
    });
}

// --- 12. LÓGICA DO NOVO MODAL EXPANDIDO --- //
const modalOverlay = document.getElementById('modal-detalhes');
const modalCorpo = document.getElementById('modal-corpo');
const btnFecharModal = document.getElementById('btn-fechar-modal');

if (btnFecharModal && modalOverlay) {
    btnFecharModal.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) fecharModal(); });
}

function fecharModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('ativo');
        setTimeout(() => { modalOverlay.style.display = 'none'; }, 300);
    }
}

async function abrirModalDetalhes(tmdbId, tituloPesquisa) {
    if (!modalOverlay || !modalCorpo) return;

    modalOverlay.style.display = 'flex';
    setTimeout(() => modalOverlay.classList.add('ativo'), 10);
    modalCorpo.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px;"><div class="spinner"></div><p style="color: #f5c518; font-weight: bold; margin-top: 15px;">Carregando detalhes do universo...</p></div>';

    try {
        let id = tmdbId;
        if (!id && tituloPesquisa) {
            const busca = await (await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(tituloPesquisa)}`)).json();
            if (busca.results && busca.results.length > 0) id = busca.results[0].id;
        }
        if (!id) throw new Error("ID não encontrado");

        // Busca Detalhes do TMDB e Comentários do seu Banco de Dados simultaneamente
        const resDetalhes = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=pt-BR`);
        const resCreditos = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}&language=pt-BR`);
        const resComentarios = await fetch(`https://api-meu-catalogo.onrender.com/comentarios/${id}`); // Sua API
        
        const detalhes = await resDetalhes.json();
        const creditos = await resCreditos.json();
        const comentariosSalvos = await resComentarios.json();

        const imgFundo = detalhes.backdrop_path ? `https://image.tmdb.org/t/p/w780${detalhes.backdrop_path}` : '';
        const duracao = detalhes.runtime ? `${detalhes.runtime} min` : 'N/A';
        const generos = detalhes.genres ? detalhes.genres.map(g => g.name).join('</span><span>') : '';
        const diretor = creditos.crew ? creditos.crew.find(c => c.job === 'Director') : null;
        const elenco = creditos.cast ? creditos.cast.slice(0, 6) : [];

        let htmlElenco = '';
        elenco.forEach(ator => {
            const foto = ator.profile_path ? `https://image.tmdb.org/t/p/w185${ator.profile_path}` : 'https://via.placeholder.com/150x225/2d2d2d/ffffff?text=Sem+Foto';
            htmlElenco += `<div class="ator-card"><img src="${foto}"><span class="ator-nome">${ator.name}</span><span class="ator-papel">${ator.character}</span></div>`;
        });

        // Monta os balões de comentários que vieram do banco
        let htmlComentarios = '';
        if (comentariosSalvos.length > 0) {
            comentariosSalvos.forEach(c => {
                htmlComentarios += `<div class="balao-comentario"><strong>👤 ${c.nome}</strong>${c.texto}</div>`;
            });
        } else {
            htmlComentarios = `<p id="msg-sem-comentarios" style="color: #9ca3af; font-size: 0.85rem; text-align: center; margin-top: 20px;">Seja o primeiro a comentar!</p>`;
        }

        // Constrói o HTML Final do Modal com as duas colunas
        modalCorpo.innerHTML = `
            ${imgFundo ? `<img src="${imgFundo}" class="modal-header-img">` : ''}
            <div class="modal-layout-duplo">
                <div class="modal-info">
                    <h2>${detalhes.title}</h2>
                    <div class="modal-tags">
                        <span>⭐ ${detalhes.vote_average ? detalhes.vote_average.toFixed(1) : 'N/A'}</span>
                        <span>⏱️ ${duracao}</span>
                        <span>🎬 Dirigido por: ${diretor ? diretor.name : 'Desconhecido'}</span>
                        <span>${generos}</span>
                    </div>
                    <p class="modal-sinopse">${detalhes.overview || 'Sinopse não disponível.'}</p>
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 1px solid #374151; padding-bottom: 5px;">Elenco Principal</h3>
                    <div class="elenco-grid">${htmlElenco}</div>
                </div>

                <div class="sessao-comentarios">
                    <div class="comentarios-header">💬 Mural de Opiniões</div>
                    <div class="lista-comentarios" id="caixa-comentarios">${htmlComentarios}</div>
                    
                    <div class="form-comentario">
                        <input type="text" id="input-nome-comentario" placeholder="Seu nome (ex: Lidio)" maxlength="30" required>
                        <textarea id="input-texto-comentario" placeholder="O que você achou do filme?" maxlength="150" required></textarea>
                        <button class="btn-enviar-comentario" id="btn-enviar-comentario">Publicar</button>
                    </div>
                </div>
            </div>
        `;

        // Ativando a Lógica de Enviar o Comentário
        const btnEnviarComentario = document.getElementById('btn-enviar-comentario');
        btnEnviarComentario.addEventListener('click', async () => {
            const inputNome = document.getElementById('input-nome-comentario');
            const inputTexto = document.getElementById('input-texto-comentario');
            const nome = inputNome.value.trim();
            const texto = inputTexto.value.trim();

            if (!nome || !texto) {
                mostrarToast('Preencha seu nome e o comentário!', 'erro');
                return;
            }

            btnEnviarComentario.innerText = 'Enviando...';
            btnEnviarComentario.disabled = true;

            const novoComentario = { tmdbId: id, nome, texto };

            try {
                // Dispara para o backend
                const resposta = await fetch('https://api-meu-catalogo.onrender.com/comentarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoComentario)
                });
                
                if (resposta.ok) {
                    // Adiciona instantaneamente na tela sem precisar recarregar
                    const caixaComentarios = document.getElementById('caixa-comentarios');
                    const msgSemComentarios = document.getElementById('msg-sem-comentarios');
                    if (msgSemComentarios) msgSemComentarios.remove();
                    
                    const htmlNovo = `<div class="balao-comentario" style="border-left: 3px solid #f5c518;"><strong>👤 ${nome}</strong>${texto}</div>`;
                    // Insere no topo da lista
                    caixaComentarios.insertAdjacentHTML('afterbegin', htmlNovo);
                    
                    inputNome.value = '';
                    inputTexto.value = '';
                    mostrarToast('Opinião publicada!', 'sucesso');
                }
            } catch (erro) {
                mostrarToast('Erro ao enviar. Tente novamente.', 'erro');
            } finally {
                btnEnviarComentario.innerText = 'Publicar';
                btnEnviarComentario.disabled = false;
            }
        });

    } catch (erro) {
        console.error("Erro no modal:", erro);
        modalCorpo.innerHTML = '<p style="text-align: center; padding: 50px; color: #ef4444;">Erro ao carregar as informações.</p>';
    }
}

// Inicia o app
carregarListaDoServidor();

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
                    inputFilme.

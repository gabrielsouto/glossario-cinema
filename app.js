const CATS = {
  captacao: { label: 'Captação', corVar: '--c-captacao', bgVar: '--c-captacao-bg' },
  edicao: { label: 'Edição', corVar: '--c-edicao', bgVar: '--c-edicao-bg' },
  roteiro: { label: 'Roteiro', corVar: '--c-roteiro', bgVar: '--c-roteiro-bg' },
  audio: { label: 'Áudio', corVar: '--c-audio', bgVar: '--c-audio-bg' },
  distribuicao: { label: 'Distribuição', corVar: '--c-distribuicao', bgVar: '--c-distribuicao-bg' }
};

const TERMS = [
  {"t":"Bitrate","meta":"formato e entrega","cat":"distribuicao","d":"Quantidade de dados usada por unidade de tempo em áudio ou vídeo."},
  {"t":"Cena","meta":"narrativa audiovisual","cat":"roteiro","d":"Unidade narrativa que reúne ações em um mesmo contexto de tempo e lugar."},
  {"t":"Codec","meta":"formato e entrega","cat":"distribuicao","d":"Método usado para codificar e decodificar áudio ou vídeo, muitas vezes com compressão."},
  {"t":"Color grading","meta":"pós-produção","cat":"edicao","d":"Ajuste criativo de cor e contraste para construir a aparência final."},
  {"t":"Continuidade","meta":"pós-produção","cat":"edicao","d":"Coerência visual, sonora e narrativa entre planos."},
  {"t":"Decupagem","meta":"narrativa audiovisual","cat":"roteiro","d":"Planejamento da cobertura visual de uma cena em planos e movimentos."},
  {"t":"Final cut","meta":"pós-produção","cat":"edicao","d":"Versão final da montagem preparada para acabamento e entrega."},
  {"t":"Foley","meta":"som e pós-produção","cat":"audio","d":"Recriação sincronizada de sons cotidianos durante a pós-produção."},
  {"t":"Frame","meta":"produção de imagem","cat":"captacao","d":"Uma imagem individual dentro da sequência de vídeo."},
  {"t":"Frame rate","meta":"produção de imagem","cat":"captacao","d":"Quantidade de quadros exibidos por segundo, medida em fps."},
  {"t":"Plano","meta":"produção de imagem","cat":"captacao","d":"Trecho contínuo registrado entre o início e o fim de uma tomada."},
  {"t":"Rough cut","meta":"pós-produção","cat":"edicao","d":"Primeira montagem estruturada, ainda aberta a mudanças importantes."},
  {"t":"Sequência","meta":"narrativa audiovisual","cat":"roteiro","d":"Conjunto de cenas ligado por uma ação ou ideia narrativa."},
  {"t":"Som diegético","meta":"som e pós-produção","cat":"audio","d":"Som cuja fonte existe dentro do universo narrativo."},
  {"t":"Timecode","meta":"pós-produção","cat":"edicao","d":"Código de tempo usado para localizar quadros com precisão."}
];

function escapar(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function filtrarTermos(termos, { cat, query }) {
  const q = normalizar(query).trim();
  return termos.filter(item => {
    const bateCategoria = !cat || item.cat === cat;
    const conteudo = normalizar(`${item.t} ${item.meta} ${item.d}`);
    return bateCategoria && (!q || conteudo.includes(q));
  });
}

function contarPorCategoria(termos) {
  return Object.keys(CATS).reduce((acc, chave) => {
    acc[chave] = termos.filter(item => item.cat === chave).length;
    return acc;
  }, {});
}

function destacar(textoOriginal, query) {
  const q = String(query || '').trim();
  if (!q) return escapar(textoOriginal);
  const indice = String(textoOriginal).toLocaleLowerCase('pt-BR').indexOf(q.toLocaleLowerCase('pt-BR'));
  if (indice === -1) return escapar(textoOriginal);
  return `${escapar(textoOriginal.slice(0, indice))}<mark>${escapar(textoOriginal.slice(indice, indice + q.length))}</mark>${escapar(textoOriginal.slice(indice + q.length))}`;
}

if (typeof document !== 'undefined') {
  let categoriaAtiva = null;
  let termoBusca = '';
  const catNav = document.querySelector('#catNav');
  const resultsEl = document.querySelector('#results');
  const countEl = document.querySelector('#resultCount');
  const searchEl = document.querySelector('#search');
  const resetBtn = document.querySelector('#resetBtn');

  function montarNav() {
    const contagens = contarPorCategoria(TERMS);
    catNav.innerHTML = Object.entries(CATS).map(([chave, info]) => `
      <button class="cat-btn${categoriaAtiva === chave ? ' active' : ''}" type="button" data-cat="${chave}" aria-pressed="${categoriaAtiva === chave}">
        <span class="cat-dot" style="background:var(${info.corVar})"></span>${escapar(info.label)}<span class="cat-count">${contagens[chave]}</span>
      </button>
    `).join('');
  }

  function render() {
    montarNav();
    const filtrados = filtrarTermos(TERMS, { cat: categoriaAtiva, query: termoBusca });
    countEl.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'termo' : 'termos'}`;
    if (!filtrados.length) {
      resultsEl.innerHTML = '<p class="empty-state">Nenhum termo encontrado. Tente outra busca ou limpe o filtro de categoria.</p>';
      return;
    }

    const blocos = [];
    filtrados.forEach(item => {
      const letra = item.t[0].toLocaleUpperCase('pt-BR');
      const ultimo = blocos.at(-1);
      if (!ultimo || ultimo.letra !== letra) blocos.push({ letra, itens: [] });
      blocos.at(-1).itens.push(item);
    });

    resultsEl.innerHTML = blocos.map(bloco => `
      <h2 class="letter-heading">${escapar(bloco.letra)}</h2>
      <div class="grid">
        ${bloco.itens.map(item => {
          const info = CATS[item.cat];
          return `<article class="term-card">
            <div class="term-head">
              <span><span class="term-name">${destacar(item.t, termoBusca)}</span><span class="term-meta">${escapar(item.meta)}</span></span>
              <span class="chip" style="background:var(${info.bgVar});color:var(${info.corVar})">${escapar(info.label)}</span>
            </div>
            <p class="term-def">${destacar(item.d, termoBusca)}</p>
          </article>`;
        }).join('')}
      </div>
    `).join('');
  }

  catNav.addEventListener('click', event => {
    const botao = event.target.closest('[data-cat]');
    if (!botao) return;
    categoriaAtiva = categoriaAtiva === botao.dataset.cat ? null : botao.dataset.cat;
    render();
  });
  searchEl.addEventListener('input', event => { termoBusca = event.target.value; render(); });
  resetBtn.addEventListener('click', () => { categoriaAtiva = null; termoBusca = ''; searchEl.value = ''; render(); });
  render();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATS, TERMS, escapar, normalizar, filtrarTermos, contarPorCategoria, destacar };
}

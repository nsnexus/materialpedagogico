'use client';

import { useEffect, useMemo, useState } from 'react';
import { SITE } from '@/lib/site';

const CORES = ['#ff6b4a', '#16a864', '#7b8cff', '#ffb020', '#2ec4a0', '#ff8fb1'];
const MAX_RESULTADOS = 200;

const ICONES = { pdf: '📕', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️', doc: '📘', docx: '📘', ppt: '📙', pptx: '📙', zip: '🗜️' };
const VER_NO_NAVEGADOR = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

const ext = (nome) => nome.split('.').pop().toLowerCase();
const semAcento = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const qtd = (n) => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'arquivo' : 'arquivos'}`;

function tamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

// Monta a árvore de pastas a partir das chaves "Pasta/Sub/arquivo.pdf".
function montarArvore(arquivos) {
  const pastas = new Map([['', { subpastas: new Set(), arquivos: [], total: 0 }]]);
  const pasta = (caminho) => {
    if (!pastas.has(caminho)) pastas.set(caminho, { subpastas: new Set(), arquivos: [], total: 0 });
    return pastas.get(caminho);
  };
  for (const a of arquivos) {
    const partes = a.k.split('/');
    const nome = partes.pop();
    let caminho = '';
    pasta('').total += 1;
    for (const p of partes) {
      const pai = caminho;
      caminho = caminho ? `${caminho}/${p}` : p;
      pasta(pai).subpastas.add(caminho);
      pasta(caminho).total += 1;
    }
    pasta(caminho).arquivos.push({ ...a, nome });
  }
  return pastas;
}

function LinhaArquivo({ a }) {
  const pasta = a.mostrarPasta ? a.k.split('/').slice(0, -1).join(' › ') : '';
  if (a.link) {
    return (
      <li className="arq">
        <span className="arq-ico">🔗</span>
        <div className="arq-info">
          <span className="arq-nome">{a.nome}</span>
          <small>Link externo{pasta && ` · ${pasta}`}</small>
        </div>
        <div className="arq-acoes">
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="arq-btn">
            Abrir
          </a>
        </div>
      </li>
    );
  }
  const e = ext(a.nome);
  const url = `/api/portal/arquivo?k=${encodeURIComponent(a.k)}`;
  return (
    <li className="arq">
      <span className="arq-ico">{ICONES[e] || '📄'}</span>
      <div className="arq-info">
        <span className="arq-nome">{a.nome.replace(/\.[^.]+$/, '')}</span>
        <small>
          {e.toUpperCase()} · {tamanho(a.t)}
          {pasta && ` · ${pasta}`}
        </small>
      </div>
      <div className="arq-acoes">
        {VER_NO_NAVEGADOR.includes(e) && (
          <a href={`${url}&ver=1`} target="_blank" rel="noopener noreferrer" className="arq-btn arq-ver">
            Ver
          </a>
        )}
        <a href={url} className="arq-btn">
          Baixar
        </a>
      </div>
    </li>
  );
}

export default function Portal({ nome }) {
  const [catalogo, setCatalogo] = useState(null);
  const [erro, setErro] = useState('');
  const [atual, setAtual] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetch('/api/portal/catalogo')
      .then((r) => {
        if (r.status === 401) window.location.href = '/entrar';
        return r.json();
      })
      .then((d) => setCatalogo(d.arquivos || []))
      .catch(() => setErro('Não foi possível carregar os materiais. Recarregue a página.'));
  }, []);

  const arvore = useMemo(() => (catalogo ? montarArvore(catalogo) : null), [catalogo]);

  const resultados = useMemo(() => {
    const termo = semAcento(busca.trim());
    if (!catalogo || termo.length < 2) return null;
    return catalogo
      .filter((a) => semAcento(a.k).includes(termo))
      .slice(0, MAX_RESULTADOS)
      .map((a) => ({ ...a, nome: a.k.split('/').pop(), mostrarPasta: true }));
  }, [busca, catalogo]);

  const pasta = arvore?.get(atual);
  const migalhas = atual ? atual.split('/') : [];
  const subpastas = pasta ? [...pasta.subpastas].sort((a, b) => a.localeCompare(b, 'pt-BR')) : [];

  return (
    <div className="portal">
      <header className="portal-topo">
        <div className="wrap portal-topo-conteudo">
          <span className="portal-marca">🧰 {SITE.marca}</span>
          <div className="portal-usuario">
            <span>Olá, {nome}!</span>
            <form action="/api/sair" method="post">
              <button className="link-btn">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="wrap portal-corpo">
        <div className="portal-boasvindas">
          <h1>Seu baú de materiais</h1>
          <p>
            {arvore ? qtd(arvore.get('').total) : 'Carregando…'} · baixe quantos quiser,
            quando quiser.
          </p>
          <input
            className="portal-busca"
            type="search"
            placeholder="🔎  Buscar atividade (ex: alfabeto, adição, páscoa)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {erro && <p className="modal-erro">{erro}</p>}

        {resultados && (
          <section>
            <h2 className="portal-h2">
              {resultados.length === MAX_RESULTADOS ? `Mais de ${MAX_RESULTADOS}` : resultados.length} resultado(s) para
              “{busca}”
            </h2>
            <ul className="arq-lista">
              {resultados.map((a) => (
                <LinhaArquivo key={a.k} a={a} />
              ))}
            </ul>
          </section>
        )}

        {!resultados && arvore && (
          <>
            {atual && (
              <nav className="migalhas">
                <button onClick={() => setAtual('')}>Início</button>
                {migalhas.map((m, i) => (
                  <span key={i}>
                    {' › '}
                    <button onClick={() => setAtual(migalhas.slice(0, i + 1).join('/'))}>{m}</button>
                  </span>
                ))}
              </nav>
            )}

            {arvore.get('').total === 0 && (
              <p className="portal-vazio">
                Os materiais estão sendo organizados e aparecem aqui em breve. Seu acesso já está garantido! 💜
              </p>
            )}

            {subpastas.length > 0 && (
              <div className={atual ? 'pastas-lista' : 'pastas-grid'}>
                {subpastas.map((caminho, i) => (
                  <button key={caminho} className="pasta-card" onClick={() => setAtual(caminho)}>
                    <span className="pasta-ico" style={{ background: CORES[i % CORES.length] }}>
                      📁
                    </span>
                    <span className="pasta-nome">{caminho.split('/').pop()}</span>
                    <small>{qtd(arvore.get(caminho).total)}</small>
                  </button>
                ))}
              </div>
            )}

            {pasta?.arquivos.length > 0 && (
              <ul className="arq-lista">
                {[...pasta.arquivos]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }))
                  .map((a) => (
                    <LinhaArquivo key={a.k} a={a} />
                  ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

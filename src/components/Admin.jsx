'use client';

import { useEffect, useMemo, useState } from 'react';
import { SITE } from '@/lib/site';

const MAX_MB = 95; // limite de corpo de requisição do Cloudflare é 100 MB

function tamanho(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

function quando(ts) {
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AdminLogin() {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const res = await fetch('/api/admin/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    });
    if (res.ok) return window.location.reload();
    setErro((await res.json().catch(() => ({}))).error || 'Não foi possível entrar.');
    setEnviando(false);
  }

  return (
    <main className="entrar">
      <form className="entrar-card" onSubmit={entrar}>
        <span className="entrar-marca">🧰 {SITE.marca}</span>
        <h1>Painel administrativo</h1>
        <label>
          Senha do painel
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoFocus />
        </label>
        {erro && <p className="modal-erro">{erro}</p>}
        <button className="btn-buy btn-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

function CampoPasta({ valor, setValor, pastas, id }) {
  return (
    <label>
      Pasta
      <input
        list={id}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Ex: Datas Comemorativas/Páscoa"
        required
      />
      <datalist id={id}>
        {pastas.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <small className="admin-ajuda">Escolha uma existente ou digite um nome novo. Use / para subpasta.</small>
    </label>
  );
}

const STATUS = { ativa: '🟢 Ativa', bloqueada: '🔴 Bloqueada' };

function SecaoClientes() {
  const [busca, setBusca] = useState('');
  const [contas, setContas] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo, texto, link? }

  async function carregar(mais = false) {
    const qs = new URLSearchParams({ busca });
    if (mais && cursor) qs.set('cursor', cursor);
    const res = await fetch(`/api/admin/clientes?${qs}`, { cache: 'no-store' });
    if (res.status === 401) return window.location.reload();
    const d = await res.json();
    setContas(mais ? [...(contas || []), ...d.contas] : d.contas);
    setCursor(d.cursor);
  }

  useEffect(() => {
    const t = setTimeout(() => carregar(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  async function agir(c, acao) {
    if (acao === 'bloquear' && !confirm(`Bloquear ${c.email}? Ela perde o acesso na hora, em todos os aparelhos.`)) return;
    setAviso(null);
    const res = await fetch('/api/admin/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: c.email, acao }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setAviso({ tipo: 'erro', texto: d.error || 'Falha na ação.' });
    if (d.link) {
      setAviso({ tipo: 'ok', texto: `Link de nova senha para ${c.email} (vale 1 hora, uso único):`, link: d.link });
    } else {
      setAviso({ tipo: 'ok', texto: acao === 'bloquear' ? `${c.email} bloqueada.` : `${c.email} reativada.` });
    }
    carregar();
  }

  async function copiar(link) {
    try {
      await navigator.clipboard.writeText(link);
      setAviso((a) => ({ ...a, texto: 'Link copiado! Mande para a cliente pelo WhatsApp.' }));
    } catch (e) {}
  }

  return (
    <section className="admin-card">
      <div className="admin-lista-topo">
        <h2 className="portal-h2">Clientes</h2>
        <input
          className="admin-filtro"
          type="search"
          placeholder="Buscar pelo começo do e-mail…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {aviso && (
        <div className={aviso.tipo === 'ok' ? 'admin-ok' : 'modal-erro'}>
          <p>{aviso.texto}</p>
          {aviso.link && (
            <div className="admin-link-gerado">
              <code>{aviso.link}</code>
              <button className="arq-btn" onClick={() => copiar(aviso.link)}>
                Copiar
              </button>
            </div>
          )}
        </div>
      )}
      {!contas && <p>Carregando…</p>}
      {contas?.length === 0 && <p className="admin-ajuda">Nenhuma cliente encontrada.</p>}
      <ul className="admin-lista">
        {contas?.map((c) => (
          <li key={c.email}>
            <div className="admin-item-info">
              <span>{c.nome}</span>
              <small>
                {c.email} · {STATUS[c.status] || c.status}
                {c.criadoEm && ` · desde ${new Date(c.criadoEm).toLocaleDateString('pt-BR')}`}
              </small>
            </div>
            <div className="admin-acoes">
              {c.status === 'ativa' && (
                <button className="admin-botao" onClick={() => agir(c, 'link-senha')}>
                  Link de senha
                </button>
              )}
              {c.status === 'ativa' ? (
                <button className="admin-excluir" onClick={() => agir(c, 'bloquear')}>
                  Bloquear
                </button>
              ) : (
                <button className="admin-botao" onClick={() => agir(c, 'reativar')}>
                  Reativar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {cursor && (
        <button className="link-btn" onClick={() => carregar(true)}>
          Carregar mais
        </button>
      )}
    </section>
  );
}

export function AdminPainel() {
  const [dados, setDados] = useState(null);
  const [aba, setAba] = useState('arquivo');
  const [pasta, setPasta] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [progresso, setProgresso] = useState('');
  const [msg, setMsg] = useState(null); // { tipo: 'ok' | 'erro', texto }
  const [filtro, setFiltro] = useState('');

  async function carregar() {
    const res = await fetch('/api/admin/catalogo', { cache: 'no-store' });
    if (res.status === 401) return window.location.reload();
    setDados(await res.json());
  }

  useEffect(() => {
    carregar();
  }, []);

  const pastas = useMemo(() => {
    const s = new Set();
    for (const a of dados?.arquivos || []) {
      const partes = a.k.split('/').slice(0, -1);
      for (let i = 1; i <= partes.length; i++) s.add(partes.slice(0, i).join('/'));
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [dados]);

  const lista = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    return (dados?.arquivos || []).filter((a) => !termo || a.k.toLowerCase().includes(termo));
  }, [dados, filtro]);

  async function enviarArquivos(e) {
    e.preventDefault();
    setMsg(null);
    const grandes = arquivos.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (grandes.length) {
      return setMsg({ tipo: 'erro', texto: `Arquivo acima de ${MAX_MB} MB: ${grandes.map((f) => f.name).join(', ')}` });
    }
    let enviados = 0;
    const falhas = [];
    for (const [i, f] of arquivos.entries()) {
      setProgresso(`Enviando ${i + 1} de ${arquivos.length}: ${f.name}`);
      const fd = new FormData();
      fd.append('pasta', pasta);
      fd.append('arquivo', f);
      const res = await fetch('/api/admin/catalogo', { method: 'POST', body: fd });
      if (res.ok) enviados += 1;
      else falhas.push(`${f.name} (${(await res.json().catch(() => ({}))).error || res.status})`);
    }
    setProgresso('');
    setArquivos([]);
    e.target.reset();
    setMsg(
      falhas.length
        ? { tipo: 'erro', texto: `${enviados} enviado(s). Falharam: ${falhas.join('; ')}` }
        : { tipo: 'ok', texto: `${enviados} arquivo(s) adicionado(s) em "${pasta}".` }
    );
    carregar();
  }

  async function salvarLink(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/catalogo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pasta, titulo, url }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ tipo: 'erro', texto: d.error || 'Falha ao salvar link.' });
    setTitulo('');
    setUrl('');
    setMsg({ tipo: 'ok', texto: `Link "${titulo}" adicionado em "${pasta}".` });
    carregar();
  }

  async function excluir(item) {
    const oQue = item.link ? 'o link' : 'o arquivo';
    if (!confirm(`Excluir ${oQue} "${item.k}"? As clientes deixam de ver na hora. Não dá para desfazer.`)) return;
    const res = await fetch(`/api/admin/catalogo?k=${encodeURIComponent(item.k)}`, { method: 'DELETE' });
    if (!res.ok) setMsg({ tipo: 'erro', texto: 'Não foi possível excluir.' });
    carregar();
  }

  const totalLinks = (dados?.arquivos || []).filter((a) => a.link).length;

  return (
    <div className="portal">
      <header className="portal-topo">
        <div className="wrap portal-topo-conteudo">
          <span className="portal-marca">🧰 Painel · {SITE.marca}</span>
          <div className="portal-usuario">
            <a href="/portal" className="admin-link-topo">
              Ver portal
            </a>
            <form action="/api/admin/sair" method="post">
              <button className="link-btn">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="wrap portal-corpo">
        <div className="admin-numeros">
          <div>
            <strong>{dados ? dados.arquivos.length - totalLinks : '…'}</strong>arquivos
          </div>
          <div>
            <strong>{dados ? totalLinks : '…'}</strong>links
          </div>
          <div>
            <strong>{dados ? `${dados.clientes}${dados.maisClientes ? '+' : ''}` : '…'}</strong>clientes
          </div>
          <div>
            <strong>{dados ? dados.vendas.filter((v) => Date.now() - v.ts < 864e5).length : '…'}</strong>vendas 24h
          </div>
        </div>

        <section className="admin-card">
          <div className="admin-abas">
            <button className={aba === 'arquivo' ? 'ativa' : ''} onClick={() => setAba('arquivo')}>
              📄 Adicionar arquivos
            </button>
            <button className={aba === 'link' ? 'ativa' : ''} onClick={() => setAba('link')}>
              🔗 Adicionar link
            </button>
          </div>

          {aba === 'arquivo' ? (
            <form onSubmit={enviarArquivos} className="admin-form">
              <CampoPasta valor={pasta} setValor={setPasta} pastas={pastas} id="pastas-arq" />
              <label>
                Arquivos (PDF, Word, imagens…)
                <input type="file" multiple required onChange={(e) => setArquivos([...e.target.files])} />
                <small className="admin-ajuda">
                  Pode selecionar vários. Até {MAX_MB} MB cada. Arquivo com mesmo nome na mesma pasta é substituído.
                </small>
              </label>
              <button className="btn-buy" disabled={!!progresso || !arquivos.length}>
                {progresso || `Enviar ${arquivos.length || ''} arquivo(s)`}
              </button>
            </form>
          ) : (
            <form onSubmit={salvarLink} className="admin-form">
              <CampoPasta valor={pasta} setValor={setPasta} pastas={pastas} id="pastas-link" />
              <label>
                Título que a cliente vai ver
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Modelo editável no Canva" required />
              </label>
              <label>
                Link
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
              </label>
              <button className="btn-buy">Salvar link</button>
            </form>
          )}
          {msg && <p className={msg.tipo === 'ok' ? 'admin-ok' : 'modal-erro'}>{msg.texto}</p>}
        </section>

        <section className="admin-card">
          <div className="admin-lista-topo">
            <h2 className="portal-h2">Materiais no portal</h2>
            <input
              className="admin-filtro"
              type="search"
              placeholder="Filtrar…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          {!dados && <p>Carregando…</p>}
          <ul className="admin-lista">
            {lista.map((a) => (
              <li key={a.k}>
                <span className="admin-item-ico">{a.link ? '🔗' : '📄'}</span>
                <div className="admin-item-info">
                  <span>{a.k.split('/').pop()}</span>
                  <small>
                    {a.k.split('/').slice(0, -1).join(' › ')}
                    {a.link ? ` · ${a.url}` : ` · ${tamanho(a.t)}`}
                  </small>
                </div>
                <button className="admin-excluir" onClick={() => excluir(a)} aria-label={`Excluir ${a.k}`}>
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </section>

        <SecaoClientes />

        {dados?.vendas?.length > 0 && (
          <section className="admin-card">
            <h2 className="portal-h2">Últimas vendas</h2>
            <ul className="admin-vendas">
              {dados.vendas.map((v) => (
                <li key={v.ts}>
                  <span>{v.nome}</span>
                  <small>{quando(v.ts)}</small>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

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
  const [email, setEmail] = useState('');
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
      body: JSON.stringify({ email, senha }),
    });
    if (res.ok) return window.location.reload();
    setErro((await res.json().catch(() => ({}))).error || 'Não foi possível entrar.');
    setEnviando(false);
  }

  return (
    <main className="entrar">
      <form className="entrar-card" onSubmit={entrar}>
        <span className="entrar-marca" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Aprendoca" width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          <span>{SITE.marca}</span>
        </span>
        <h1>Painel administrativo</h1>
        <label>
          E-mail do administrador
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="narcisofelizardo@gmail.com"
            required
            autoFocus
          />
        </label>
        <label>
          Senha do painel
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
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

const STATUS = {
  ativa: { rotulo: 'Ativa', classe: 'badge-ativa' },
  bloqueada: { rotulo: 'Bloqueada', classe: 'badge-bloqueada' },
  pendente: { rotulo: 'Pendente (Pix)', classe: 'badge-pendente' },
};

function SecaoClientes() {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todas');
  const [contas, setContas] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo, texto, link? }
  const [modalNovo, setModalNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoZap, setNovoZap] = useState('');
  const [novaSenha, setNovaSenha] = useState('123456');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  async function carregar(mais = false) {
    const qs = new URLSearchParams({ busca, status: statusFiltro });
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
  }, [busca, statusFiltro]);

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
      setAviso({
        tipo: 'ok',
        texto: acao === 'bloquear' ? `${c.email} bloqueada.` : `${c.email} acesso liberado com sucesso!`,
      });
    }
    carregar();
  }

  async function criarClienteManual(e) {
    e.preventDefault();
    setSalvandoNovo(true);
    setAviso(null);
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'criar-manual',
          nome: novoNome,
          email: novoEmail,
          whatsapp: novoZap,
          senha: novaSenha,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao cadastrar cliente.');
      setModalNovo(false);
      setNovoNome('');
      setNovoEmail('');
      setNovoZap('');
      setNovaSenha('123456');
      setAviso({ tipo: 'ok', texto: `Cliente ${d.conta.nome} cadastrada e com acesso liberado!` });
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function copiar(link) {
    try {
      await navigator.clipboard.writeText(link);
      setAviso((a) => ({ ...a, texto: 'Link copiado! Envie para a cliente no WhatsApp.' }));
    } catch (e) {}
  }

  function linkZap(c) {
    const raw = String(c.whatsapp || '').replace(/\D/g, '');
    if (!raw) return null;
    const num = raw.length === 10 || raw.length === 11 ? `55${raw}` : raw;
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const msg =
      c.status === 'pendente'
        ? `Olá ${c.nome || ''}! Vi que você gerou o Pix para a Aprendoca. Ficou alguma dúvida sobre o material ou precisa de ajuda para concluir seu acesso?`
        : `Olá ${c.nome || ''}! Seu acesso à Aprendoca está liberado! Você pode entrar pelo link: ${siteUrl}/entrar com seu e-mail ${c.email} e a senha que escolheu.`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  const contagem = useMemo(() => {
    if (!contas) return { total: 0, ativas: 0, pendentes: 0, bloqueadas: 0 };
    return {
      total: contas.length,
      ativas: contas.filter((c) => c.status === 'ativa').length,
      pendentes: contas.filter((c) => c.status === 'pendente').length,
      bloqueadas: contas.filter((c) => c.status === 'bloqueada').length,
    };
  }, [contas]);

  return (
    <section className="admin-card">
      <div className="admin-lista-topo">
        <div>
          <h2 className="portal-h2" style={{ textAlign: 'left', marginBottom: '4px' }}>
            Clientes & Acessos
          </h2>
          <small className="admin-ajuda">Gerencie alunas, envie mensagens no WhatsApp ou libere acessos manualmente.</small>
        </div>
        <button className="btn-buy" style={{ padding: '9px 18px', fontSize: '0.88rem' }} onClick={() => setModalNovo(true)}>
          ＋ Liberar Novo Cliente
        </button>
      </div>

      {/* Modal de cadastro manual */}
      {modalNovo && (
        <div className="modal-fundo" onClick={() => setModalNovo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={() => setModalNovo(false)}>
              ×
            </button>
            <h3>Liberar Acesso Manual</h3>
            <p className="modal-sub">Cadastre uma cliente e libere o acesso na hora (cortesia ou compra por fora).</p>
            <form onSubmit={criarClienteManual}>
              <label>
                Nome da cliente
                <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required placeholder="Ex: Maria Silva" />
              </label>
              <label>
                E-mail
                <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} required placeholder="maria@email.com" />
              </label>
              <label>
                WhatsApp (opcional)
                <input value={novoZap} onChange={(e) => setNovoZap(e.target.value)} placeholder="(81) 99999-9999" />
              </label>
              <label>
                Senha inicial
                <input value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} />
              </label>
              <button className="btn-buy btn-full" disabled={salvandoNovo}>
                {salvandoNovo ? 'Liberando acesso…' : 'Cadastrar e Liberar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Abas de filtro por status */}
      <div className="admin-filtros-status">
        <button
          className={statusFiltro === 'todas' ? 'filtro-pill ativa' : 'filtro-pill'}
          onClick={() => setStatusFiltro('todas')}
        >
          Todas ({contagem.total})
        </button>
        <button
          className={statusFiltro === 'pendente' ? 'filtro-pill ativa' : 'filtro-pill'}
          onClick={() => setStatusFiltro('pendente')}
        >
          🟡 Pendentes ({contagem.pendentes})
        </button>
        <button
          className={statusFiltro === 'ativa' ? 'filtro-pill ativa' : 'filtro-pill'}
          onClick={() => setStatusFiltro('ativa')}
        >
          🟢 Ativas ({contagem.ativas})
        </button>
        <button
          className={statusFiltro === 'bloqueada' ? 'filtro-pill ativa' : 'filtro-pill'}
          onClick={() => setStatusFiltro('bloqueada')}
        >
          🔴 Bloqueadas ({contagem.bloqueadas})
        </button>
        <input
          className="admin-filtro"
          type="search"
          placeholder="Buscar por e-mail ou nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ marginLeft: 'auto' }}
        />
      </div>

      {aviso && (
        <div className={aviso.tipo === 'ok' ? 'admin-ok' : 'modal-erro'} style={{ margin: '14px 0' }}>
          <p>{aviso.texto}</p>
          {aviso.link && (
            <div className="admin-link-gerado">
              <code>{aviso.link}</code>
              <button className="arq-btn" onClick={() => copiar(aviso.link)}>
                Copiar link
              </button>
            </div>
          )}
        </div>
      )}

      {!contas && <p style={{ marginTop: '16px' }}>Carregando clientes…</p>}
      {contas?.length === 0 && <p className="admin-ajuda" style={{ marginTop: '16px' }}>Nenhuma cliente encontrada com esse filtro.</p>}

      <ul className="admin-lista" style={{ marginTop: '12px' }}>
        {contas?.map((c) => {
          const badge = STATUS[c.status] || { rotulo: c.status, classe: '' };
          const zapUrl = linkZap(c);
          return (
            <li key={c.email} style={{ padding: '12px 6px', alignItems: 'center' }}>
              <div className="admin-item-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '1.02rem' }}>{c.nome || 'Sem nome'}</strong>
                  <span className={`status-badge ${badge.classe}`}>{badge.rotulo}</span>
                </div>
                <small style={{ display: 'block', marginTop: '3px', color: '#555' }}>
                  📧 {c.email}
                  {c.whatsapp && (
                    <span style={{ marginLeft: '8px', color: '#16a864', fontWeight: 'bold' }}>
                      📱 {c.whatsapp}
                    </span>
                  )}
                  {c.criadoEm && ` · Cadastro: ${new Date(c.criadoEm).toLocaleDateString('pt-BR')}`}
                  {c.pagoEm && ` · Pago: ${new Date(c.pagoEm).toLocaleDateString('pt-BR')}`}
                </small>
              </div>

              <div className="admin-acoes">
                {zapUrl && (
                  <a
                    href={zapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-botao-zap"
                    title="Conversar com a cliente no WhatsApp"
                  >
                    💬 WhatsApp
                  </a>
                )}

                {c.status === 'pendente' && (
                  <button className="admin-botao-liberar" onClick={() => agir(c, 'liberar-manual')} title="Ativar acesso manualmente">
                    ⚡ Liberar Manual
                  </button>
                )}

                {c.status === 'ativa' && (
                  <button className="admin-botao" onClick={() => agir(c, 'link-senha')} title="Gerar link temporário para ela redefinir a senha">
                    🔑 Link de senha
                  </button>
                )}

                {c.status === 'ativa' ? (
                  <button className="admin-excluir" onClick={() => agir(c, 'bloquear')} title="Suspender o acesso da cliente">
                    Bloquear
                  </button>
                ) : c.status === 'bloqueada' ? (
                  <button className="admin-botao" onClick={() => agir(c, 'reativar')}>
                    Desbloquear
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {cursor && (
        <button className="link-btn" style={{ marginTop: '16px' }} onClick={() => carregar(true)}>
          Carregar mais clientes
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
          <span className="portal-marca" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="Aprendoca" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <span>Painel · {SITE.marca}</span>
          </span>
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

'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { SITE, formatBRL } from '@/lib/site';

const POLL_MS = 4000;
const STORAGE_KEY = 'bp-pedido';

function lerPedido() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

function salvarPedido(pedido) {
  try {
    if (pedido) localStorage.setItem(STORAGE_KEY, JSON.stringify(pedido));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

export default function Checkout() {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState('form'); // form | pix | pago
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pix, setPix] = useState(null); // { txid, pixCopiaECola, qr }
  const [senha, setSenha] = useState('');
  const [jaTemAcesso, setJaTemAcesso] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const abrir = () => {
      setAberto(true);
      // Cliente que fechou a aba com um Pix pendente volta para o mesmo QR.
      const salvo = lerPedido();
      if (salvo?.txid && etapa === 'form') mostrarPix(salvo);
    };
    window.addEventListener('abrir-checkout', abrir);
    return () => window.removeEventListener('abrir-checkout', abrir);
  }, [etapa]);

  useEffect(() => {
    if (etapa !== 'pix' || !pix?.txid) return;
    let ativo = true;
    const checar = async () => {
      try {
        const res = await fetch(`/api/status/${pix.txid}`, { cache: 'no-store' });
        const data = await res.json();
        if (!ativo) return;
        if (data.status === 'PAID') {
          setEtapa('pago');
          salvarPedido(null);
          return;
        }
      } catch (e) {}
      if (ativo) timer.current = setTimeout(checar, POLL_MS);
    };
    timer.current = setTimeout(checar, POLL_MS);
    return () => {
      ativo = false;
      clearTimeout(timer.current);
    };
  }, [etapa, pix]);

  async function mostrarPix(pedido) {
    const qr = await QRCode.toDataURL(pedido.pixCopiaECola, { margin: 1, width: 260 });
    setPix({ ...pedido, qr });
    setEtapa('pix');
  }

  async function gerarPix(e) {
    e.preventDefault();
    setErro('');
    setJaTemAcesso(false);
    setEnviando(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (data.jaTemAcesso) setJaTemAcesso(true);
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar Pix.');
      const pedido = { txid: data.txid, pixCopiaECola: data.pixCopiaECola };
      salvarPedido(pedido);
      await mostrarPix(pedido);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (e) {}
  }

  function novoPedido() {
    salvarPedido(null);
    setPix(null);
    setEtapa('form');
  }

  if (!aberto) return null;

  return (
    <div className="modal-fundo" onClick={() => setAberto(false)}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-fechar" aria-label="Fechar" onClick={() => setAberto(false)}>
          ×
        </button>

        {etapa === 'form' && (
          <form onSubmit={gerarPix}>
            <h3>Falta pouco! 🎒</h3>
            <p className="modal-sub">
              {SITE.marca} · acesso vitalício por <strong>{formatBRL(SITE.preco)}</strong>
            </p>
            <label>
              Seu nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
            </label>
            <label>
              Seu e-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Crie uma senha
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="mínimo 6 caracteres"
              />
            </label>
            <p className="modal-dica">Com esse e-mail e senha você entra no portal dos materiais sempre que quiser.</p>
            {erro && <p className="modal-erro">{erro}</p>}
            {jaTemAcesso && (
              <a className="btn-buy btn-full btn-secundario" href="/entrar">
                Entrar no portal
              </a>
            )}
            <button className="btn-buy btn-full" disabled={enviando}>
              {enviando ? 'Gerando Pix…' : 'Gerar Pix'}
            </button>
            <p className="modal-nota">🔒 Pagamento via Pix. Liberação automática.</p>
          </form>
        )}

        {etapa === 'pix' && pix && (
          <div className="pix">
            <h3>Pague com Pix</h3>
            <p className="modal-sub">Escaneie o QR Code ou use o Pix copia e cola.</p>
            <img src={pix.qr} alt="QR Code Pix" width={220} height={220} />
            <p className="pix-valor">{formatBRL(SITE.preco)}</p>
            <button type="button" className="btn-buy btn-full" onClick={copiar}>
              {copiado ? 'Código copiado ✓' : 'Copiar código Pix'}
            </button>
            <div className="pix-aguardando">
              <span className="spinner" /> Aguardando pagamento… o acesso libera sozinho aqui. Pode deixar esta tela aberta.
            </div>
            <button type="button" className="link-btn" onClick={novoPedido}>
              Gerar um novo Pix
            </button>
          </div>
        )}

        {etapa === 'pago' && (
          <div className="pago">
            <div className="pago-icone">🎉</div>
            <h3>Pagamento confirmado!</h3>
            <p className="modal-sub">
              Sua conta foi criada. Para voltar depois, entre com <strong>{email || 'seu e-mail'}</strong> e a senha que
              você escolheu.
            </p>
            <a className="btn-buy btn-full" href="/portal">
              Abrir meus materiais
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITE } from '@/lib/site';

function Suporte() {
  return SITE.whatsapp ? (
    <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
      fale com o suporte no WhatsApp
    </a>
  ) : (
    'fale com o suporte'
  );
}

export default function Esqueci() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('form'); // form | enviado | semEmail
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function pedir(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const res = await fetch('/api/senha/esqueci', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const d = await res.json().catch(() => ({}));
    setEnviando(false);
    if (d.semEmail) return setEstado('semEmail');
    if (!res.ok) return setErro(d.error || 'Não foi possível enviar agora.');
    setEstado('enviado');
  }

  return (
    <main className="entrar">
      <div className="entrar-card">
        <Link href="/" className="entrar-marca">
          🧰 {SITE.marca}
        </Link>
        <h1>Esqueci a senha</h1>

        {estado === 'form' && (
          <form onSubmit={pedir}>
            <p className="modal-sub">Digite o e-mail da compra. Vamos mandar um link para você criar uma senha nova.</p>
            <label>
              E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            {erro && <p className="modal-erro">{erro}</p>}
            <button className="btn-buy btn-full" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}

        {estado === 'enviado' && (
          <p className="modal-sub">
            Se <strong>{email}</strong> tiver acesso ao portal, o link chega em instantes. Confira também o spam. Não
            chegou? <Suporte />.
          </p>
        )}

        {estado === 'semEmail' && (
          <p className="modal-sub">
            Para criar uma nova senha, <Suporte /> informando o e-mail da compra.
          </p>
        )}

        <p className="modal-nota">
          <Link href="/entrar">Voltar para o login</Link>
        </p>
      </div>
    </main>
  );
}

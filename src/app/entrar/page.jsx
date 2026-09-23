'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const res = await fetch('/api/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível entrar.');
      window.location.href = '/portal';
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <main className="entrar">
      <form className="entrar-card" onSubmit={entrar}>
        <Link href="/" className="entrar-marca">
          🧰 {SITE.marca}
        </Link>
        <h1>Entrar no portal</h1>
        <p className="modal-sub">Use o e-mail e a senha que você criou na compra.</p>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {erro && <p className="modal-erro">{erro}</p>}
        <button className="btn-buy btn-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="modal-nota">
          Esqueceu a senha?{' '}
          {SITE.whatsapp ? (
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
              Fale com o suporte
            </a>
          ) : (
            'Fale com o suporte.'
          )}
        </p>
        <p className="modal-nota">
          Ainda não tem acesso? <Link href="/#oferta">Garanta o seu</Link>
        </p>
      </form>
    </main>
  );
}

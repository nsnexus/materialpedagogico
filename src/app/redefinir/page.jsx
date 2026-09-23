'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Redefinir() {
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(location.search).get('t') || '');
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (senha !== confirma) return setErro('As senhas não são iguais.');
    setEnviando(true);
    const res = await fetch('/api/senha/redefinir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    });
    if (res.ok) return (window.location.href = '/portal');
    setErro((await res.json().catch(() => ({}))).error || 'Não foi possível salvar.');
    setEnviando(false);
  }

  return (
    <main className="entrar">
      <form className="entrar-card" onSubmit={salvar}>
        <Link href="/" className="entrar-marca">
          🧰 {SITE.marca}
        </Link>
        <h1>Nova senha</h1>
        <p className="modal-sub">Escolha uma senha nova para entrar no portal.</p>
        <label>
          Nova senha
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
        <label>
          Repita a senha
          <input
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {erro && <p className="modal-erro">{erro}</p>}
        <button className="btn-buy btn-full" disabled={enviando || !token}>
          {enviando ? 'Salvando…' : 'Salvar e entrar'}
        </button>
        {!token && <p className="modal-erro">Link incompleto. Abra o link do e-mail de novo.</p>}
      </form>
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [pendente, setPendente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setPendente(false);
    setEnviando(true);
    try {
      const res = await fetch('/api/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.pendente || res.status === 402) {
          setPendente(true);
        }
        throw new Error(data.error || 'Não foi possível entrar.');
      }
      window.location.href = '/portal';
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  const whatsappNum = String(SITE.whatsapp || '').replace(/\D/g, '');
  const textoPendente = `Olá! Fiz o pagamento Pix para a Aprendoca com o e-mail ${email}, mas consta como pendente no login. Segue meu comprovante:`;
  const textoGeral = `Olá! Preciso de ajuda com meu acesso na Aprendoca${email ? ` (e-mail: ${email})` : ''}.`;

  const linkSuportePendente = whatsappNum
    ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(textoPendente)}`
    : `mailto:narcisofelizardo@gmail.com?subject=${encodeURIComponent('Comprovante de pagamento Aprendoca')}&body=${encodeURIComponent(textoPendente)}`;

  const linkSuporteGeral = whatsappNum
    ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent(textoGeral)}`
    : `mailto:narcisofelizardo@gmail.com?subject=${encodeURIComponent('Suporte Aprendoca')}&body=${encodeURIComponent(textoGeral)}`;

  return (
    <main className="entrar">
      <form className="entrar-card" onSubmit={entrar}>
        <Link href="/" className="entrar-marca" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Aprendoca" width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          <span>{SITE.marca}</span>
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
        {erro && (
          <div className="entrar-erro-container">
            <p className="modal-erro">{erro}</p>
            {pendente && (
              <a
                href={linkSuportePendente}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-suporte-pix"
              >
                💬 Enviar comprovante no WhatsApp
              </a>
            )}
          </div>
        )}
        <button className="btn-buy btn-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="modal-nota">
          <Link href="/esqueci">Esqueci a senha</Link>
        </p>
        <p className="modal-nota">
          Ainda não tem acesso? <Link href="/#oferta">Garanta o seu</Link>
        </p>
        <p className="modal-nota modal-nota-suporte">
          Problemas com o acesso?{' '}
          <a href={linkSuporteGeral} target="_blank" rel="noopener noreferrer">
            Fale com o suporte
          </a>
        </p>
      </form>
    </main>
  );
}

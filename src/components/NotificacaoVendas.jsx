'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/lib/site';

const PRIMEIRA_EM = 8000; // espera antes da primeira notificação
const INTERVALO = 22000; // entre uma e outra
const VISIVEL_POR = 6000;
const MAX_EXIBICOES = 6;

// Só para visualizar o layout no `next dev` com ?demo-vendas. Nunca roda em produção.
const DEMO = [
  { nome: 'Exemplo A.', ts: Date.now() - 4 * 60000 },
  { nome: 'Exemplo B.', ts: Date.now() - 38 * 60000 },
];

function tempoAtras(ts) {
  const min = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export default function NotificacaoVendas() {
  const [vendas, setVendas] = useState([]);
  const [atual, setAtual] = useState(null);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    const demo = process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).has('demo-vendas');
    if (demo) {
      setVendas(DEMO);
      return;
    }
    fetch('/api/vendas-recentes')
      .then((r) => r.json())
      .then((d) => setVendas(d.vendas || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!vendas.length || fechado) return;
    let i = 0;
    let esconder;
    const mostrar = () => {
      if (i >= Math.min(MAX_EXIBICOES, vendas.length * 2)) return;
      setAtual(vendas[i % vendas.length]);
      i += 1;
      esconder = setTimeout(() => setAtual(null), VISIVEL_POR);
    };
    const primeira = setTimeout(mostrar, PRIMEIRA_EM);
    const ciclo = setInterval(mostrar, INTERVALO);
    return () => {
      clearTimeout(primeira);
      clearTimeout(esconder);
      clearInterval(ciclo);
    };
  }, [vendas, fechado]);

  if (fechado) return null;

  return (
    <div className={`notif ${atual ? 'notif-visivel' : ''}`} role="status" aria-live="polite">
      {atual && (
        <>
          <span className="notif-ico">🎒</span>
          <div className="notif-texto">
            <strong>{atual.nome}</strong> garantiu o acesso ao {SITE.marca}
            <small>{tempoAtras(atual.ts)} · compra verificada via Pix</small>
          </div>
          <button className="notif-fechar" aria-label="Fechar notificações" onClick={() => setFechado(true)}>
            ×
          </button>
        </>
      )}
    </div>
  );
}

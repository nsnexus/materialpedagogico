// Cliente server-side do gateway Pix do NSMusic (NSNexus Pay).
// A chave nunca vai para o navegador: só as rotas /api usam este arquivo.
import { variavel } from '@/lib/env';

// Só no `next dev` com DEV_PIX_FAKE=1: simula um Pix que "é pago" 8s depois, para testar o fluxo.
const FAKE = () => process.env.NODE_ENV === 'development' && process.env.DEV_PIX_FAKE === '1';
const FAKE_PAGA_EM = 8000;

function config() {
  return {
    gatewayUrl: variavel('NSNEXUS_GATEWAY_URL') || 'https://nsmusic.nsnexus.com.br',
    apiKey: variavel('NSNEXUS_GATEWAY_API_KEY'),
  };
}

export async function createPixCharge({ appId, externalOrderId, amount, description, payer }) {
  if (FAKE()) {
    return { txid: `DEVFAKE${Date.now()}`, pixCopiaECola: '00020126-PIX-DE-TESTE-DEV', amount, appId };
  }
  const { gatewayUrl, apiKey } = config();
  if (!apiKey) throw new Error('NSNEXUS_GATEWAY_API_KEY não configurada.');

  const res = await fetch(`${gatewayUrl}/api/gateway/v1/charges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Gateway-Api-Key': apiKey },
    body: JSON.stringify({ appId, externalOrderId, amount, description, payer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Gateway HTTP ${res.status}`);
  }
  return res.json();
}

export async function getPixCharge(txid, { appId, amount } = {}) {
  if (FAKE() && txid.startsWith('DEVFAKE')) {
    const pago = Date.now() - Number(txid.slice(7)) > FAKE_PAGA_EM;
    return { txid, appId, amount, status: pago ? 'PAID' : 'PENDING' };
  }
  const { gatewayUrl, apiKey } = config();
  if (!apiKey) throw new Error('NSNEXUS_GATEWAY_API_KEY não configurada.');

  const res = await fetch(`${gatewayUrl}/api/gateway/v1/charges/${encodeURIComponent(txid)}`, {
    headers: { 'X-Gateway-Api-Key': apiKey },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gateway HTTP ${res.status}`);
  return res.json();
}

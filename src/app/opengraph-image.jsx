// Imagem de prévia do link (WhatsApp, Facebook): fundo ilustrado + texto da oferta.
import { ImageResponse } from 'next/og';
import { SITE, formatBRL } from '@/lib/site';

export const runtime = 'edge';
export const alt = `${SITE.marca}: ${SITE.qtdMateriais} materiais prontos pra imprimir`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function carregarFonte() {
  // Baloo 2 ExtraBold do Google Fonts; se falhar, usa a fonte padrão.
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/533 (KHTML, like Gecko)' },
    }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch (e) {
    return null;
  }
}

export default async function OgImage() {
  const [fundo, fonte] = await Promise.all([
    fetch(new URL('../../public/og-fundo.jpg', import.meta.url)).then((r) => r.arrayBuffer()),
    carregarFonte(),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'Baloo' }}>
        <img src={fundo} width={1200} height={630} style={{ position: 'absolute', inset: 0, objectFit: 'cover' }} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '64px 0 0 64px', width: 700 }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: '#ff6b4a',
              color: '#fff',
              fontSize: 26,
              padding: '6px 22px',
              borderRadius: 999,
            }}
          >
            {SITE.marca.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 64, lineHeight: 1.05, color: '#1f2a44', marginTop: 22 }}>
            <span>{SITE.qtdMateriais} materiais</span>
            <span style={{ color: '#ff6b4a' }}>prontos pra imprimir</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              marginTop: 34,
              background: '#16a864',
              color: '#fff',
              fontSize: 36,
              padding: '12px 30px',
              borderRadius: 999,
            }}
          >
            Acesso vitalício por {formatBRL(SITE.preco)}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonte ? [{ name: 'Baloo', data: fonte, weight: 800, style: 'normal' }] : undefined,
    }
  );
}

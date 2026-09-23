import './globals.css';
import './ilustracoes.css';
import './portal.css';
import { SITE } from '@/lib/site';

export const metadata = {
  // Domínio público, usado para montar a URL absoluta da imagem de compartilhamento.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'),
  title: `${SITE.marca} | ${SITE.qtdMateriais} itens pedagógicos`,
  description:
    'Atividades para imprimir, cadernos de colorir, datas comemorativas, fichas e projetos escolares. Pagamento único, acesso vitalício.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B4A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Caveat:wght@700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

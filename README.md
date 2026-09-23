# Baú Pedagógico

Página de vendas do acervo pedagógico (R$ 9,99, acesso vitalício) com checkout Pix próprio
(gateway centralizado do NSMusic, ver `../nsmusic/docs/GATEWAY_INTEGRATION.md`) e portal da cliente
com os arquivos no Cloudflare R2.

## Rodar local

```bash
npm install
npm run dev -- -p 3010
```

O `next dev` simula KV e R2 localmente (`setupDevPlatform`, dados em `.wrangler/`).
Com `DEV_PIX_FAKE=1` no `.env.local`, o Pix gerado é "pago" sozinho 8 s depois, para testar o fluxo inteiro.
Para ter arquivos no portal local: `node scripts/subir-acervo.mjs "<pasta>" --local`.

## Onde editar

- `src/lib/site.js`: marca, preço, imagens, categorias, bônus, autora, depoimentos, FAQ, WhatsApp.
- `src/app/page.jsx`: textos e ordem das seções da página de vendas.
- `src/app/globals.css`, `ilustracoes.css`, `portal.css`: estilos (cores em `:root`).

## Fluxo de compra e acesso

1. No checkout a cliente informa nome, e-mail e cria uma senha. `POST /api/checkout` gera o Pix
   (valor fixo no servidor) e guarda o pedido no KV com o hash da senha (PBKDF2).
2. O modal consulta `GET /api/status/:txid` a cada 4 s. Com o Pix confirmado (`appId` deste site e valor >= preço),
   a conta é criada como ativa e o navegador que gerou o Pix recebe o cookie de sessão (30 dias).
3. O botão "Abrir meus materiais" leva a `/portal`. Depois, ela entra por `/entrar` com e-mail e senha.
4. O portal lê `_catalogo.json` do R2 e baixa cada arquivo por `/api/portal/arquivo`, sempre conferindo a sessão.

A conta só nasce quando o Pix do pedido é pago, então ninguém consegue trocar a senha de um pedido alheio.
"Esqueci a senha" ainda é manual (suporte); dá para automatizar com envio de e-mail (ex: Resend).

## Subir o acervo

A estrutura de pastas vira a navegação do portal (1ª pasta = categoria):

```bash
node scripts/subir-acervo.mjs "C:\caminho\do\acervo"
```

Usa o login do `wrangler` (`npx wrangler login`), sem token. Arquivos já enviados com o mesmo tamanho
são pulados, então é só rodar de novo para adicionar materiais ou refazer falhas. Se ficar lento, o modo
`--s3` usa a API S3 do R2 (precisa de `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` no `.env.local`).

## Deploy (Cloudflare Pages)

1. Bucket R2 `bau-acervo` e KV `BAU_KV` já criados na conta do nsmusic (id no `wrangler.toml`).
2. No projeto do Pages: build `npx @cloudflare/next-on-pages`, saída `.vercel/output/static`, flag `nodejs_compat`.
3. Bindings: KV `BAU_KV` e R2 `ACERVO` (Settings > Functions).
4. Variáveis: `NSNEXUS_GATEWAY_URL`, `NSNEXUS_GATEWAY_API_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.
   Nunca defina `DEV_PIX_FAKE` em produção (só funciona com `NODE_ENV=development`, mas não custa evitar).

## Notificações de compra

O aviso "Maria S. garantiu o acesso" só mostra compras reais: quando o Pix é confirmado, a venda entra
na lista `recentes` do KV (últimas 20, exibidas por até 7 dias), com primeiro nome + inicial do sobrenome.
Para ver o layout em desenvolvimento: `http://localhost:3010/?demo-vendas`.

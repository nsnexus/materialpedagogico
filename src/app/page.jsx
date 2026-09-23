import BuyButton from '@/components/BuyButton';
import Checkout from '@/components/Checkout';
import NotificacaoVendas from '@/components/NotificacaoVendas';
import {
  FOLHAS,
  FolhaColorir,
  FolhaContagem,
  FolhaLabirinto,
  FolhaTracado,
} from '@/components/Folhas';
import { Estrela, GizDeCera, Lapis, Onda, Rabisco, SeloGiratorio, Seta, Sublinhado } from '@/components/Deco';
import { SITE, formatBRL } from '@/lib/site';

const PRECO = formatBRL(SITE.preco);
const [REAIS, CENTAVOS] = SITE.preco.toFixed(2).split('.');

const COR = { creme: '#fff8ee', tinta: '#1f2a44', branco: '#ffffff', pessego: '#ffe3d6', coral: '#ff6b4a' };

const BENEFICIOS = [
  'Pronto para imprimir e aplicar',
  'Para professoras, coordenadoras e mães',
  'Educação infantil, anos iniciais e gestão',
  'Pagamento único, acesso vitalício',
];

const INCLUSO = [
  `${SITE.qtdMateriais} itens pedagógicos`,
  'Acesso vitalício, sem mensalidade',
  'Todas as categorias do acervo',
  'Acesso pelo celular ou computador',
  'Liberação automática após o Pix',
];

const TAREFAS = [
  'Procurar atividade na internet',
  'Adaptar pra turma',
  'Formatar tudo de novo',
  'Imprimir (e a impressora travar)',
  'Descansar 😴',
];

const PASTAS = [
  ['🧸', 'Educação Infantil', '#ff6b4a'],
  ['🔤', 'Português', '#16a864'],
  ['🧠', 'Atividades Lúdicas', '#7b8cff'],
  ['🎉', 'Datas Comemorativas', '#ffb020'],
  ['🏫', 'Gestão Escolar', '#2ec4a0'],
  ['🎒', 'Recursos do Professor', '#ff8fb1'],
];

function FaixaPrevias({ reverso = false }) {
  const itens = SITE.previews.length
    ? SITE.previews.map((src) => <img key={src} src={src} alt="Página do acervo" className="folha" loading="lazy" />)
    : (reverso ? [...FOLHAS].reverse() : FOLHAS).map((F, i) => <F key={i} />);
  return (
    <div className={`faixa ${reverso ? 'faixa-reversa' : ''}`}>
      <div className="faixa-trilho">
        {itens}
        {/* cópia para o loop contínuo */}
        <div className="faixa-copia" aria-hidden="true">{itens}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const { autora, bonus, depoimentos } = SITE;

  return (
    <>
      <div className="topbar">
        🎒 Oferta de lançamento: acesso vitalício por apenas {PRECO}
        <a href="/entrar" className="topbar-entrar">
          Já comprei · Entrar
        </a>
      </div>

      <header className="hero">
        <Estrela className="deco deco-estrela-1" />
        <Estrela cor="#ff8fb1" className="deco deco-estrela-2" />
        <Rabisco cor="#7b8cff" className="deco deco-rabisco-1" />

        <div className="wrap hero-grid">
          <div className="hero-texto">
            <span className="selo">{SITE.marca}</span>
            <h1>
              {SITE.qtdMateriais} itens{' '}
              <span className="destaque">
                prontos pra imprimir
                <Sublinhado className="sublinhado" />
              </span>
            </h1>
            <p className="hero-sub">
              Atividades para imprimir, cadernos de colorir, datas comemorativas e materiais de gestão escolar num baú só. Abra a pasta, imprima e
              aplique amanhã mesmo.
            </p>
            <ul className="checks">
              {BENEFICIOS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <BuyButton className="btn-xl">Quero meu acesso por {PRECO}</BuyButton>
            <div className="mini-selos">
              <span>⚡ Acesso imediato</span>
              <span>🔒 Pix seguro</span>
            </div>
          </div>

          <div className="hero-arte" aria-hidden="true">
            <svg className="hero-blob" viewBox="0 0 500 500">
              <path d="M421 312Q396 424 283 449T96 380Q22 302 60 196T205 56Q298 22 373 91T421 312Z" fill="#ffe3d6" />
              <path d="M392 300Q378 390 290 412T124 360Q70 296 96 210T212 96Q282 72 344 120T392 300Z" fill="#ffd4c2" />
            </svg>
            {SITE.heroImagem ? (
              <img src={SITE.heroImagem} alt="" className="hero-foto" fetchPriority="high" />
            ) : (
              <>
                <div className="leque">
                  <FolhaColorir className="leque-1" />
                  <FolhaLabirinto className="leque-2" />
                  <FolhaContagem className="leque-3" />
                  <FolhaTracado className="leque-4" />
                </div>
                <Lapis className="deco deco-lapis" />
                <GizDeCera cor="#16a864" className="deco deco-giz-1" />
                <GizDeCera cor="#7b8cff" className="deco deco-giz-2" />
              </>
            )}
            <div className="hero-selo">
              <SeloGiratorio preco={PRECO} />
            </div>
            <div className="nota-mao">
              olha só que
              <br />
              fofura! <Seta className="nota-seta" />
            </div>
          </div>
        </div>

        <div className="wrap numeros">
          <div>
            <strong>{SITE.qtdMateriais}</strong>itens
          </div>
          <div>
            <strong>{SITE.categorias.length}</strong>categorias
          </div>
          <div>
            <strong>R$ 0</strong>de mensalidade
          </div>
          <div>
            <strong>∞</strong>acesso vitalício
          </div>
        </div>
      </header>

      <Onda de={COR.creme} para={COR.branco} />

      <section className="secao secao-branca">
        <div className="wrap">
          <p className="sobretitulo">espia só 👀</p>
          <h2>Um pouquinho do que tem dentro do baú</h2>
          <p className="secao-sub">
            Exemplos do tipo de atividade que você encontra: letra grande, espaço pra criança fazer e pronto pra imprimir.
          </p>
        </div>
        <FaixaPrevias />
        <FaixaPrevias reverso />
        <div className="wrap">
          <div className="grid-cat">
            {SITE.categorias.map((c) => (
              <div className="cat" key={c.titulo}>
                <span className="cat-ico">{c.icone}</span>
                {c.titulo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Onda de={COR.branco} para={COR.tinta} invertida />

      <section className="secao secao-dor">
        <div className="wrap dor-grid">
          <div>
            <h2>Domingo à noite não era pra ser assim</h2>
            <p>
              Enquanto todo mundo descansa, você está procurando atividade, adaptando, formatando e brigando com a
              impressora. E na segunda ainda falta ideia.
            </p>
            <p className="dor-destaque">Seu tempo vale mais que isso.</p>
          </div>
          <div className={`dor-visual ${SITE.dorImagem ? 'com-imagem' : ''}`}>
          {SITE.dorImagem && (
            <img
              src={SITE.dorImagem}
              alt="Professora cansada à noite, cercada de papéis, notebook e impressora"
              className="dor-foto"
              loading="lazy"
            />
          )}
          <div className="postit">
            <span className="postit-fita" />
            <p className="postit-titulo">Minha noite de domingo:</p>
            <ul>
              {TAREFAS.map((t, i) => (
                <li key={t} className={i === TAREFAS.length - 1 ? 'postit-nunca' : ''}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </section>

      <Onda de={COR.tinta} para={COR.creme} />

      <section className="secao">
        <div className="wrap solucao-grid">
          <div className="celular" aria-hidden="true">
            <div className="celular-tela">
              <div className="celular-topo">
                <span>🧰</span> {SITE.marca}
              </div>
              {PASTAS.map(([ico, nome, cor]) => (
                <div className="celular-pasta" key={nome}>
                  <span className="celular-ico" style={{ background: cor }}>
                    {ico}
                  </span>
                  {nome}
                  <span className="celular-seta">›</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="alinha-esq">Com o {SITE.marca}, a atividade já está pronta</h2>
            <div className="beneficio">
              <span className="beneficio-ico">⏱️</span>
              <div>
                <h3>Ganhe suas noites de volta</h3>
                <p>Tudo separado por pasta. Achou, imprimiu, pronto.</p>
              </div>
            </div>
            <div className="beneficio">
              <span className="beneficio-ico">✏️</span>
              <div>
                <h3>Variedade pro ano inteiro</h3>
                <p>Da volta às aulas ao Natal, sempre tem algo pra aplicar.</p>
              </div>
            </div>
            <div className="beneficio">
              <span className="beneficio-ico">📱</span>
              <div>
                <h3>No celular ou no computador</h3>
                <p>Acesse de onde estiver e baixe só o que precisar.</p>
              </div>
            </div>
            <div className="beneficio">
              <span className="beneficio-ico">💸</span>
              <div>
                <h3>Preço de um lanche</h3>
                <p>Paga uma vez só, {PRECO}, e usa pra sempre.</p>
              </div>
            </div>
            <BuyButton>Quero garantir meu acesso</BuyButton>
          </div>
        </div>
      </section>

      {bonus.length > 0 && (
        <section className="secao secao-bonus">
          <div className="wrap">
            <h2>🎁 Bônus inclusos</h2>
            <div className="grid-3">
              {bonus.map((b) => (
                <div className="card" key={b.titulo}>
                  <span className="tag-bonus">BÔNUS</span>
                  <h3>{b.titulo}</h3>
                  <p>{b.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {autora.nome && (
        <section className="secao secao-autora">
          <div className="wrap autora">
            {autora.foto && (
              <div className="autora-polaroid">
                <span className="postit-fita" />
                <img src={autora.foto} alt={autora.nome} className="autora-foto" loading="lazy" />
                <p className="autora-assinatura">com carinho, {autora.nome.split(' ')[0]} 💜</p>
              </div>
            )}
            <div>
              <p className="sobretitulo alinha-esq">prazer! 👋</p>
              <h2 className="alinha-esq">Quem sou eu</h2>
              <p className="autora-nome">
                <strong>{autora.nome}</strong>
                {autora.titulo && <span>{autora.titulo}</span>}
              </p>
              {[].concat(autora.texto).map((t) => (
                <p key={t}>{t}</p>
              ))}
              {autora.valores?.length > 0 && (
                <div className="autora-valores">
                  {autora.valores.map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {depoimentos.length > 0 && (
        <section className="secao secao-depo">
          <div className="wrap">
            <h2>O que dizem as professoras</h2>
            <div className="grid-3">
              {depoimentos.map((d) => (
                <figure className="card depo" key={d.nome}>
                  <div className="estrelas">★★★★★</div>
                  <blockquote>“{d.texto}”</blockquote>
                  <figcaption>{d.nome}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="secao secao-oferta" id="oferta">
        <Estrela className="deco deco-oferta-1" />
        <Estrela cor="#2ec4a0" className="deco deco-oferta-2" />
        <div className="wrap">
          <h2>Leve o baú inteiro hoje</h2>
          <div className="plano">
            <span className="plano-faixa">PLANO ÚNICO</span>
            <p className="plano-nome">{SITE.marca} Vitalício</p>
            <p className="plano-preco">
              <small>R$</small>
              {REAIS}
              <small>,{CENTAVOS}</small>
            </p>
            <p className="plano-tipo">pagamento único · sem mensalidade</p>
            <ul className="checks">
              {INCLUSO.map((i) => (
                <li key={i}>{i}</li>
              ))}
              {bonus.length > 0 && <li>Todos os bônus inclusos</li>}
            </ul>
            <BuyButton className="btn-full btn-xl">Quero meu acesso agora</BuyButton>
            <div className="mini-selos">
              <span>⚡ Acesso imediato</span>
              <span>🔒 Pix seguro</span>
            </div>
          </div>
        </div>
      </section>

      <section className="secao secao-faq">
        <div className="wrap estreito">
          <h2>Perguntas frequentes</h2>
          {SITE.faq.map((f) => (
            <details key={f.p}>
              <summary>{f.p}</summary>
              <p>{f.r}</p>
            </details>
          ))}
        </div>
      </section>

      <Onda de={COR.creme} para={COR.coral} />

      <section className="secao secao-final">
        <div className="wrap estreito centro">
          <div className="final-folhas" aria-hidden="true">
            <FolhaSilabasMini />
          </div>
          <h2>Comece a próxima aula com a atividade pronta</h2>
          <p>
            {SITE.qtdMateriais} itens por {PRECO}. Uma vez só, pra sempre.
          </p>
          <BuyButton className="btn-xl btn-claro">Quero meu acesso agora</BuyButton>
        </div>
      </section>

      <footer className="rodape">
        <div className="wrap">
          <p>
            © {new Date().getFullYear()} {SITE.marca}. Produto digital, entregue por link de acesso após a
            confirmação do pagamento.
          </p>
          {SITE.whatsapp && (
            <p>
              Suporte:{' '}
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </p>
          )}
        </div>
      </footer>

      <Checkout />
      <NotificacaoVendas />
    </>
  );
}

function FolhaSilabasMini() {
  const [, , , , Silabas, Formas] = FOLHAS;
  return (
    <>
      <Silabas className="final-f1" />
      <Formas className="final-f2" />
    </>
  );
}

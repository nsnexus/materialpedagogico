// Fichas de atividade ilustradas em SVG (formato A4), usadas como prévia do acervo.
// Quando houver prints reais do material em SITE.previews, eles substituem estas.

const TINTA = '#1f2a44';
const CINZA = '#9aa3b8';

function Folha({ cor, titulo, children, className = '' }) {
  return (
    <svg viewBox="0 0 210 297" className={`folha ${className}`} role="img" aria-label={`Ficha: ${titulo}`}>
      <rect width="210" height="297" rx="8" fill="#fff" />
      <rect width="210" height="36" rx="8" fill={cor} />
      <rect y="28" width="210" height="8" fill={cor} />
      <text x="105" y="24" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="16" fill="#fff">
        {titulo}
      </text>
      <text x="14" y="54" fontFamily="Nunito, sans-serif" fontSize="8.5" fill={CINZA}>
        Nome: ____________________________
      </text>
      {children}
    </svg>
  );
}

export function FolhaTracado(props) {
  return (
    <Folha cor="#ff6b4a" titulo="Letra A" {...props}>
      <text
        x="105" y="178" textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="140"
        fill="none" stroke="#ff6b4a" strokeWidth="2.5" strokeDasharray="5 5"
      >
        A
      </text>
      <g transform="translate(150 70)">
        <rect x="-3" y="22" width="6" height="16" fill="#a0673c" />
        <circle cx="0" cy="12" r="15" fill="#2ec4a0" />
        <circle cx="-7" cy="8" r="3" fill="#ff6b4a" />
        <circle cx="6" cy="15" r="3" fill="#ff6b4a" />
      </g>
      <text x="150" y="124" textAnchor="middle" fontFamily="Nunito" fontWeight="800" fontSize="9" fill={TINTA}>ÁRVORE</text>
      {[210, 245].map((y) => (
        <g key={y}>
          <line x1="16" y1={y} x2="194" y2={y} stroke="#dfe3ec" />
          <line x1="16" y1={y + 18} x2="194" y2={y + 18} stroke={CINZA} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <text key={i} x={28 + i * 25} y={y + 16} fontFamily="Nunito" fontWeight="700" fontSize="20"
              fill="none" stroke={i === 0 ? TINTA : CINZA} strokeDasharray={i === 0 ? '' : '2 2'} strokeWidth="1">
              a
            </text>
          ))}
        </g>
      ))}
    </Folha>
  );
}

function Maca({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="9" fill="#ff6b4a" />
      <rect x="-1" y="-13" width="2" height="6" fill="#7a4a24" />
      <ellipse cx="4" cy="-11" rx="4" ry="2" fill="#2ec4a0" />
    </g>
  );
}

export function FolhaContagem(props) {
  const linhas = [3, 5, 2, 4];
  return (
    <Folha cor="#16a864" titulo="Vamos contar?" {...props}>
      {linhas.map((n, l) => {
        const y = 88 + l * 50;
        return (
          <g key={l}>
            {Array.from({ length: n }).map((_, i) => (
              <Maca key={i} x={26 + i * 24} y={y} />
            ))}
            <rect x="160" y={y - 16} width="32" height="32" rx="6" fill="none" stroke={TINTA} strokeWidth="1.5" />
            {l === 0 && (
              <text x="176" y={y + 8} textAnchor="middle" fontFamily="'Baloo 2'" fontWeight="800" fontSize="22" fill="#16a864">3</text>
            )}
          </g>
        );
      })}
      <text x="105" y="286" textAnchor="middle" fontFamily="Nunito" fontSize="8" fill={CINZA}>
        Conte as maçãs e escreva o número
      </text>
    </Folha>
  );
}

export function FolhaLabirinto(props) {
  // Quadrados concêntricos com a abertura alternando de lado.
  const caminhos = [0, 1, 2, 3].map((k) => {
    const d = k * 20;
    const x1 = 20 + d, x2 = 190 - d, y1 = 72 + d, y2 = 242 - d;
    return k % 2 === 0
      ? `M${x1 + 20} ${y1} H${x2} V${y2} H${x1} V${y1}`
      : `M${x2 - 20} ${y2} H${x1} V${y1} H${x2} V${y2}`;
  });
  return (
    <Folha cor="#7b8cff" titulo="Labirinto" {...props}>
      {caminhos.map((d) => (
        <path key={d} d={d} fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
      ))}
      <path d="M30 62 Q30 90 50 92 T 68 112" fill="none" stroke="#ff6b4a" strokeWidth="2" strokeDasharray="3 3" />
      <text x="22" y="66" fontSize="16">🐝</text>
      <text x="97" y="163" fontSize="18">🌻</text>
      <text x="105" y="272" textAnchor="middle" fontFamily="Nunito" fontSize="8" fill={CINZA}>
        Ajude a abelha a chegar na flor
      </text>
    </Folha>
  );
}

export function FolhaColorir(props) {
  const petalas = [0, 60, 120, 180, 240, 300];
  return (
    <Folha cor="#ffb020" titulo="Pinte por número" {...props}>
      <g transform="translate(105 140)">
        {petalas.map((a, i) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse cx="0" cy="-42" rx="20" ry="30" fill={i < 2 ? '#ff8fb1' : '#fff'} stroke={TINTA} strokeWidth="1.5" />
            <text x="0" y="-40" textAnchor="middle" fontFamily="Nunito" fontWeight="800" fontSize="10" fill={TINTA}
              transform={`rotate(${-a} 0 -42)`}>
              2
            </text>
          </g>
        ))}
        <circle r="18" fill="#ffd84d" stroke={TINTA} strokeWidth="1.5" />
        <text y="4" textAnchor="middle" fontFamily="Nunito" fontWeight="800" fontSize="11" fill={TINTA}>1</text>
      </g>
      <path d="M105 210 V262 M105 238 Q86 226 78 236 Q92 246 105 240" fill="none" stroke={TINTA} strokeWidth="1.5" />
      {[['1', '#ffd84d'], ['2', '#ff8fb1'], ['3', '#2ec4a0']].map(([n, c], i) => (
        <g key={n} transform={`translate(${46 + i * 48} 280)`}>
          <circle r="7" fill={c} stroke={TINTA} />
          <text x="12" y="3.5" fontFamily="Nunito" fontWeight="800" fontSize="10" fill={TINTA}>{n}</text>
        </g>
      ))}
    </Folha>
  );
}

export function FolhaSilabas(props) {
  const sil = ['BA', 'BE', 'BI', 'BO', 'BU'];
  const cores = ['#ff6b4a', '#ffb020', '#16a864', '#7b8cff', '#ff8fb1'];
  return (
    <Folha cor="#ff8fb1" titulo="Família do B" {...props}>
      {sil.map((s, i) => (
        <g key={s} transform={`translate(${14 + i * 37} 70)`}>
          <rect width="33" height="33" rx="7" fill={cores[i]} />
          <text x="16.5" y="23" textAnchor="middle" fontFamily="'Baloo 2'" fontWeight="800" fontSize="15" fill="#fff">{s}</text>
        </g>
      ))}
      <g transform="translate(58 150)">
        <circle r="26" fill="#fff" stroke={TINTA} strokeWidth="1.5" />
        <path d="M-26 0 H26 M0 -26 Q16 0 0 26" fill="none" stroke="#ff6b4a" strokeWidth="2" />
      </g>
      <text x="150" y="146" textAnchor="middle" fontFamily="'Baloo 2'" fontWeight="800" fontSize="22" fill={TINTA}>BO-LA</text>
      <text x="150" y="164" textAnchor="middle" fontFamily="Nunito" fontSize="8" fill={CINZA}>Escreva a palavra</text>
      {[205, 235, 265].map((y) => (
        <line key={y} x1="16" y1={y} x2="194" y2={y} stroke={CINZA} strokeDasharray="3 3" />
      ))}
    </Folha>
  );
}

export function FolhaFormas(props) {
  return (
    <Folha cor="#2ec4a0" titulo="Ligue as formas" {...props}>
      <g fill="none" stroke={TINTA} strokeWidth="2">
        <circle cx="45" cy="92" r="16" />
        <path d="M45 128 L63 158 H27 Z" />
        <rect x="29" y="178" width="32" height="32" />
        <path d="M45 228 l5 11 12 1 -9 8 3 12 -11-6 -11 6 3-12 -9-8 12-1 z" />
      </g>
      <circle cx="165" cy="200" r="16" fill="#ffb020" />
      <path d="M165 76 L183 106 H147 Z" fill="#7b8cff" />
      <rect x="149" y="228" width="32" height="32" fill="#ff8fb1" />
      <path d="M165 128 l5 11 12 1 -9 8 3 12 -11-6 -11 6 3-12 -9-8 12-1 z" fill="#ffd84d" />
      <path d="M64 92 C110 92 110 200 146 200" fill="none" stroke="#ff6b4a" strokeWidth="2" strokeDasharray="4 4" />
      {[92, 145, 194, 244].map((y) => <circle key={y} cx="72" cy={y} r="3" fill={TINTA} />)}
      {[92, 145, 200, 244].map((y) => <circle key={y} cx="140" cy={y} r="3" fill={TINTA} />)}
    </Folha>
  );
}

export const FOLHAS = [FolhaTracado, FolhaContagem, FolhaLabirinto, FolhaColorir, FolhaSilabas, FolhaFormas];

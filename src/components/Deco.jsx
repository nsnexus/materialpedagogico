// Elementos decorativos desenhados à mão (SVG): rabiscos, material escolar, ondas e selo.

export function Lapis({ className = '' }) {
  return (
    <svg viewBox="0 0 120 24" className={className} aria-hidden="true">
      <rect x="18" y="4" width="84" height="16" fill="#ffc857" />
      <rect x="18" y="4" width="84" height="5" fill="#ffd982" />
      <rect x="102" y="4" width="12" height="16" rx="3" fill="#ff8fb1" />
      <rect x="98" y="4" width="6" height="16" fill="#c9ced9" />
      <path d="M18 4 L0 12 L18 20 Z" fill="#f1d3a8" />
      <path d="M6 9.3 L0 12 L6 14.7 Z" fill="#1f2a44" />
    </svg>
  );
}

export function GizDeCera({ cor = '#ff6b4a', className = '' }) {
  return (
    <svg viewBox="0 0 90 22" className={className} aria-hidden="true">
      <path d="M14 3 H86 a3 3 0 0 1 3 3 V16 a3 3 0 0 1 -3 3 H14 Z" fill={cor} />
      <path d="M14 3 L2 8 V14 L14 19 Z" fill={cor} opacity="0.8" />
      <rect x="30" y="3" width="40" height="16" fill="#fff" opacity="0.35" />
      <path d="M36 8 H64 M36 13 H56" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function Estrela({ cor = '#ffc857', className = '' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2 L25 15 L38 16 L28 25 L31 38 L20 31 L9 38 L12 25 L2 16 L15 15 Z" fill={cor} stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Rabisco({ cor = '#ff6b4a', className = '' }) {
  return (
    <svg viewBox="0 0 80 30" className={className} aria-hidden="true">
      <path d="M2 20 C12 2 20 28 30 12 S48 24 56 8 S72 22 78 10" fill="none" stroke={cor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Sublinhado({ className = '' }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M4 14 C60 4 140 4 296 10 M20 17 C100 11 200 11 280 15" fill="none" stroke="#ffc857" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Seta({ className = '' }) {
  return (
    <svg viewBox="0 0 70 60" className={className} aria-hidden="true">
      <path d="M6 8 C30 4 56 18 58 48 M46 38 L58 50 L66 36" fill="none" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Onda({ de, para, invertida = false }) {
  return (
    <div className="onda" style={{ background: de }} aria-hidden="true">
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={invertida ? { transform: 'scaleX(-1)' } : undefined}>
        <path d="M0 35 C240 75 480 75 720 40 S1200 0 1440 30 V70 H0 Z" fill={para} />
      </svg>
    </div>
  );
}

export function SeloGiratorio({ preco }) {
  return (
    <div className="selo-giro" aria-label={`Acesso vitalício por ${preco}`}>
      <svg viewBox="0 0 140 140" className="selo-giro-texto" aria-hidden="true">
        <defs>
          <path id="circulo-selo" d="M70 70 m-52 0 a52 52 0 1 1 104 0 a52 52 0 1 1 -104 0" />
        </defs>
        <text fontFamily="Nunito" fontWeight="800" fontSize="11.5" letterSpacing="1.4" fill="#1f2a44">
          <textPath href="#circulo-selo">ACESSO VITALÍCIO • PAGAMENTO ÚNICO •</textPath>
        </text>
      </svg>
      <div className="selo-giro-centro">
        <small>só</small>
        {preco}
      </div>
    </div>
  );
}

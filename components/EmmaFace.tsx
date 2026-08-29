'use client'

// ============================================================
// EmmaFace — avatar animé (réutilisé de MindSearch AI, inchangé)
// Composant VISUEL PUR. Piloté par `state` : idle | listening | speaking.
// ============================================================

export type EmmaFaceState = 'idle' | 'listening' | 'speaking'

export default function EmmaFace({
  state = 'idle',
  size = 168,
}: {
  state?: EmmaFaceState
  size?: number
}) {
  const cls =
    state === 'listening'
      ? 'emmaface listening'
      : state === 'speaking'
      ? 'emmaface speaking'
      : 'emmaface'

  return (
    <div style={{ width: size, height: size, lineHeight: 0 }}>
      <style>{`
        .emmaface .ef-bob{animation:efBob 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .emmaface .ef-eye{animation:efBlink 4.8s infinite;transform-box:fill-box;transform-origin:center}
        .emmaface .ef-ring{opacity:0;transform-box:fill-box;transform-origin:center}
        .emmaface .ef-brow{transition:transform .25s ease;transform-box:fill-box;transform-origin:center}
        .emmaface .ef-mclosed{display:block}
        .emmaface .ef-mopen{display:none;transform-box:fill-box;transform-origin:center top}
        .emmaface.listening .ef-ring{animation:efRing 1.6s ease-out infinite}
        .emmaface.listening .ef-brow{transform:translateY(-2.5px)}
        .emmaface.listening .ef-eye{animation:efBlink 2.9s infinite}
        .emmaface.speaking .ef-mclosed{display:none}
        .emmaface.speaking .ef-mopen{display:block;animation:efTalk .38s ease-in-out infinite}
        .emmaface.speaking .ef-bob{animation:efBob 1.6s ease-in-out infinite}
        @keyframes efBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes efBlink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.07)}}
        @keyframes efTalk{0%,100%{transform:scaleY(.32)}50%{transform:scaleY(1)}}
        @keyframes efRing{0%{opacity:.55;transform:scale(.92)}100%{opacity:0;transform:scale(1.13)}}
      `}</style>
      <svg className={cls} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Emma">
        <defs>
          <clipPath id="efmed"><circle cx="100" cy="100" r="88" /></clipPath>
          <radialGradient id="efskin" cx="44%" cy="36%" r="80%">
            <stop offset="0%" stopColor="#FBDCBE" /><stop offset="62%" stopColor="#F0C29A" /><stop offset="100%" stopColor="#DDA579" />
          </radialGradient>
          <linearGradient id="efhair" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor="#5C3D27" /><stop offset="55%" stopColor="#412A1A" /><stop offset="100%" stopColor="#2B1A10" />
          </linearGradient>
          <linearGradient id="efbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C6A4E" /><stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
        </defs>
        <circle className="ef-ring" cx="100" cy="100" r="95" fill="none" stroke="#FACC15" strokeWidth="3" />
        <g clipPath="url(#efmed)">
          <circle cx="100" cy="100" r="88" fill="url(#efbg)" />
          <g className="ef-bob">
            <path d="M50 200 q0 -46 50 -46 q50 0 50 46 z" fill="#0E4536" />
            <path d="M70 164 q30 16 60 0 l0 28 l-60 0 z" fill="#F3CDA9" />
            <path d="M70 152 q30 22 60 0 l0 -8 q-30 12 -60 0z" fill="#DBA478" />
            <path d="M54 108 q-6 56 14 86 l16 0 q-20 -34 -12 -90z" fill="url(#efhair)" />
            <path d="M146 108 q6 56 -14 86 l-16 0 q20 -34 12 -90z" fill="url(#efhair)" />
            <ellipse cx="100" cy="104" rx="38" ry="45" fill="url(#efskin)" />
            <path d="M62 130 q38 26 76 0 q-9 28 -38 28 q-29 0 -38 -28z" fill="#C98F63" opacity="0.12" />
            <path d="M56 98 q4 -60 44 -60 q40 0 44 60 q-12 -36 -30 -42 q3 13 -3 19 q-15 -22 -34 -9 q-15 11 -21 33z" fill="url(#efhair)" />
            <path d="M60 96 q8 -30 26 -38 q-19 18 -21 41z" fill="#6E4A2D55" />
            <g className="ef-brow">
              <path d="M74 87 q11 -6 22 -1.5" fill="none" stroke="#5C3D27" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M104 85.5 q11 -4.5 22 1.5" fill="none" stroke="#5C3D27" strokeWidth="3.2" strokeLinecap="round" />
            </g>
            <g className="ef-eye">
              <path d="M74 98 q9 -8 19 0 q-9 6 -19 0z" fill="#FAF8F3" />
              <circle cx="84" cy="98" r="4.8" fill="#5E7A6B" /><circle cx="84" cy="98" r="2.3" fill="#1E140C" />
              <circle cx="82.3" cy="96.3" r="1.4" fill="#FFFFFF" />
              <path d="M74 97 q9 -8 19 0" fill="none" stroke="#2A1A12" strokeWidth="2.2" strokeLinecap="round" />
            </g>
            <g className="ef-eye">
              <path d="M107 98 q9 -8 19 0 q-9 6 -19 0z" fill="#FAF8F3" />
              <circle cx="116" cy="98" r="4.8" fill="#5E7A6B" /><circle cx="116" cy="98" r="2.3" fill="#1E140C" />
              <circle cx="114.3" cy="96.3" r="1.4" fill="#FFFFFF" />
              <path d="M107 97 q9 -8 19 0" fill="none" stroke="#2A1A12" strokeWidth="2.2" strokeLinecap="round" />
            </g>
            <path d="M100 103 q-3 11 -1 15 q3 2 6 0" fill="none" stroke="#C9926B" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="76" cy="122" rx="7.5" ry="5.2" fill="#E68A86" opacity="0.32" />
            <ellipse cx="124" cy="122" rx="7.5" ry="5.2" fill="#E68A86" opacity="0.32" />
            <g className="ef-mclosed">
              <path d="M87 129 q6 -5 13 -2 q7 -3 13 2 q-6 8 -13 8 q-7 0 -13 -8z" fill="#C46B5C" />
              <path d="M87 129 q13 4 26 0" fill="none" stroke="#9A4F3F" strokeWidth="1.3" strokeLinecap="round" />
            </g>
            <g className="ef-mopen">
              <path d="M88 128 q12 -4 24 0 q-2 14 -12 14 q-10 0 -12 -14z" fill="#7A3A33" />
              <path d="M91 129 q9 3 18 0 q-2 3 -9 3 q-7 0 -9 -3z" fill="#FAF8F3" opacity="0.9" />
              <path d="M90 139 q10 5 20 0 q-4 4 -10 4 q-6 0 -10 -4z" fill="#C46B5C" />
              <path d="M88 128 q12 -4 24 0" fill="none" stroke="#9A4F3F" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </g>
        </g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="#064E3B" strokeWidth="4" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#FACC15" strokeWidth="1.5" opacity="0.85" />
      </svg>
    </div>
  )
}

"use client";

// StudentFace — l'avatar de l'ADO (même univers visuel qu'EmmaFace, adapté de
// CandidateFace de Coach Emma) : hoodie décontracté, cheveux en bataille,
// pas de casque — un élève de sixth form, pas un candidat en entretien.
// Composant VISUEL PUR, animé comme Emma (idle | listening | speaking).

export type StudentFaceState = "idle" | "listening" | "speaking";

export default function StudentFace({
  state = "idle",
  size = 168,
}: {
  state?: StudentFaceState;
  size?: number;
}) {
  const cls = state === "listening" ? "sf listening" : state === "speaking" ? "sf speaking" : "sf";

  return (
    <div style={{ width: size, height: size, lineHeight: 0 }}>
      <style>{`
        .sf .sf-bob{animation:sfBob 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        .sf .sf-eye{animation:sfBlink 5s infinite;transform-box:fill-box;transform-origin:center}
        .sf .sf-mclosed{display:block}
        .sf .sf-mopen{display:none;transform-box:fill-box;transform-origin:center top}
        .sf.listening .sf-eye{animation:sfBlink 2.9s infinite}
        .sf.speaking .sf-mclosed{display:none}
        .sf.speaking .sf-mopen{display:block;animation:sfTalk .36s ease-in-out infinite}
        .sf.speaking .sf-bob{animation:sfBob 1.6s ease-in-out infinite}
        @keyframes sfBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes sfBlink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.07)}}
        @keyframes sfTalk{0%,100%{transform:scaleY(.32)}50%{transform:scaleY(1)}}
      `}</style>
      <svg className={cls} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Student">
        <defs>
          <clipPath id="sfclip"><circle cx="100" cy="100" r="88" /></clipPath>
          <radialGradient id="sfskin" cx="44%" cy="36%" r="80%">
            <stop offset="0%" stopColor="#F0C9A8" /><stop offset="62%" stopColor="#E0AE86" /><stop offset="100%" stopColor="#C68F63" />
          </radialGradient>
          <linearGradient id="sfhair" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor="#3B2A1B" /><stop offset="55%" stopColor="#2A1D12" /><stop offset="100%" stopColor="#1C130B" />
          </linearGradient>
          <linearGradient id="sfbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#123E52" /><stop offset="100%" stopColor="#0B2A38" />
          </linearGradient>
          <linearGradient id="sfhoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A6472" /><stop offset="100%" stopColor="#414B58" />
          </linearGradient>
        </defs>
        <g clipPath="url(#sfclip)">
          <circle cx="100" cy="100" r="88" fill="url(#sfbg)" />
          <g className="sf-bob">
            {/* épaules — HOODIE décontracté avec capuche derrière la nuque */}
            <path d="M44 200 q0 -52 56 -52 q56 0 56 52 z" fill="url(#sfhoodie)" />
            <path d="M62 160 q38 -26 76 0 q6 8 2 16 q-40 -22 -80 0 q-4 -8 2 -16z" fill="#333B46" />
            {/* cordons de la capuche */}
            <path d="M90 168 q-2 14 1 22" fill="none" stroke="#D8DCE1" strokeWidth="3" strokeLinecap="round" />
            <path d="M110 168 q2 14 -1 22" fill="none" stroke="#D8DCE1" strokeWidth="3" strokeLinecap="round" />
            {/* cou */}
            <path d="M84 148 q16 12 32 0 l0 16 q-16 10 -32 0z" fill="#E0AE86" />
            {/* visage */}
            <ellipse cx="100" cy="104" rx="38" ry="45" fill="url(#sfskin)" />
            <path d="M62 130 q38 26 76 0 q-9 28 -38 28 q-29 0 -38 -28z" fill="#C68F63" opacity="0.12" />
            {/* cheveux en bataille (mèches) */}
            <path d="M56 100 q2 -62 44 -62 q42 0 44 62 q-10 -30 -26 -40 q4 10 -2 16 q-8 -14 -20 -12 q4 -8 0 -12 q-10 4 -16 14 q-2 -8 -8 -8 q-10 14 -16 42z" fill="url(#sfhair)" />
            <path d="M58 92 q6 -26 20 -36 q-14 16 -14 40z" fill="#4E3722" opacity="0.5" />
            {/* sourcils */}
            <path d="M74 88 q11 -6 22 -1.5" fill="none" stroke="#2A1D12" strokeWidth="3" strokeLinecap="round" />
            <path d="M104 86.5 q11 -4.5 22 1.5" fill="none" stroke="#2A1D12" strokeWidth="3" strokeLinecap="round" />
            {/* yeux */}
            <g className="sf-eye">
              <path d="M74 98 q9 -8 19 0 q-9 6 -19 0z" fill="#FAF8F3" />
              <circle cx="84" cy="98" r="4.6" fill="#5b463a" /><circle cx="84" cy="98" r="2.2" fill="#1E140C" />
              <circle cx="82.4" cy="96.4" r="1.3" fill="#fff" />
            </g>
            <g className="sf-eye">
              <path d="M107 98 q9 -8 19 0 q-9 6 -19 0z" fill="#FAF8F3" />
              <circle cx="116" cy="98" r="4.6" fill="#5b463a" /><circle cx="116" cy="98" r="2.2" fill="#1E140C" />
              <circle cx="114.4" cy="96.4" r="1.3" fill="#fff" />
            </g>
            {/* nez + joues */}
            <path d="M100 103 q-3 11 -1 15 q3 2 6 0" fill="none" stroke="#C68F63" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="76" cy="122" rx="7" ry="5" fill="#E68A86" opacity="0.22" />
            <ellipse cx="124" cy="122" rx="7" ry="5" fill="#E68A86" opacity="0.22" />
            {/* bouche — petit sourire en coin d'ado */}
            <g className="sf-mclosed">
              <path d="M87 130 q6 -4 13 -1.5 q7 -2.5 13 3 q-7 6 -13 5.5 q-7 0 -13 -7z" fill="#B65B4C" />
            </g>
            <g className="sf-mopen">
              <path d="M88 129 q12 -4 24 0 q-2 13 -12 13 q-10 0 -12 -13z" fill="#7A3A33" />
              <path d="M91 130 q9 3 18 0 q-2 3 -9 3 q-7 0 -9 -3z" fill="#FAF8F3" opacity="0.9" />
            </g>
          </g>
        </g>
        <circle cx="100" cy="100" r="88" fill="none" stroke="#0B2A38" strokeWidth="4" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#4aa3c4" strokeWidth="1.5" opacity="0.7" />
      </svg>
    </div>
  );
}

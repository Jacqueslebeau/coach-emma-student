import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import RichText from "@/components/RichText";

// Site marketing (page publique). Connecté → tableau de bord.
export default async function Home() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="-mt-8">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl mt-8 px-6 py-14 sm:px-12 sm:py-20 text-white shadow-hero"
        style={{ background: "radial-gradient(120% 130% at 90% -15%, rgba(235,169,44,.24), transparent 52%), radial-gradient(90% 120% at 5% 110%, rgba(137,131,242,.30), transparent 55%), linear-gradient(158deg,#3F38C4 0%, #2A2472 100%)" }}>
        <p className="font-mono text-xs font-bold tracking-[0.17em] uppercase text-[#F3CE82]">
          Tuteur personnel · GCSE & A Level
        </p>
        <h1 className="font-serif font-black text-4xl sm:text-6xl leading-[0.97] mt-4 max-w-3xl">
          Le tuteur qui ne lâche rien avant le <em className="not-italic text-[#F3CE82]">A*</em>
        </h1>
        <p className="mt-6 text-lg text-[#D6D4F2] max-w-2xl leading-relaxed">
          Coach Emma Student ne se contente pas de répondre aux questions. Il prend la leçon du jour,
          vérifie qu'elle est <strong className="text-white">comprise</strong>, fait pratiquer en
          conditions d'examen, corrige comme un examinateur, et retravaille ce qui cloche —
          jusqu'à ce que ça tienne.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?register=1" className="btn bg-[#EBA92C] text-[#2A2472] hover:bg-[#F5C155] text-base !px-8 !py-3.5 font-bold">
            Commencer
          </Link>
          <Link href="/login" className="btn border border-white/30 text-white hover:bg-white/10 text-base !px-8 !py-3.5">
            Se connecter
          </Link>
        </div>
        <p className="mt-10 font-mono text-[13px] text-[#CFCDF0] flex flex-wrap items-center gap-x-2 gap-y-2">
          {["Leçon", "Cours", "Maîtrise vérifiée", "Remédiation", "Exercices corrigés", "Points à travailler"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#8f8bd0]">→</span>}
              <span className="border border-[#F3CE82]/30 bg-white/[.08] rounded-full px-3 py-1 whitespace-nowrap">{s}</span>
            </span>
          ))}
          <span className="text-[#8f8bd0]">→</span>
          <span className="font-serif font-black text-[#F3CE82] text-lg">A★</span>
        </p>
      </section>

      {/* ================= DIFFÉRENCIATEUR ================= */}
      <section className="mt-16">
        <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">Ce qui change tout</p>
        <h2 className="font-serif font-semibold text-3xl text-ink mt-2">
          On n'enseigne pas « les maths ». On entraîne à <em className="not-italic text-indigo">réussir l'examen</em>.
        </h2>
        <p className="text-muted mt-3 max-w-3xl">
          Connaître son cours ne suffit pas pour un A*. Il faut répondre <strong className="text-ink">comme le mark scheme
          l'exige</strong>. Chaque exercice et chaque correction d'Emma est construit là-dessus.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <div className="card p-6 border-t-[3px] border-t-amber">
            <h3 className="font-semibold text-[15.5px]">Les command words, maîtrisés</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              « Show that », « Hence », « Exact value »… chaque verbe de consigne est un contrat précis avec
              l'examinateur. Emma entraîne à chacun, et affiche pour chaque exercice
              <strong className="text-ink"> ce que l'examinateur attend</strong> pour donner tous les points.
            </p>
          </div>
          <div className="card p-6 border-t-[3px] border-t-indigo">
            <h3 className="font-semibold text-[15.5px]">Corrigé comme une vraie copie</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Notation mark par mark — method marks et accuracy marks, comme à l'examen. Une bonne méthode avec
              une erreur de calcul garde ses points, et l'élève apprend <strong className="text-ink">pourquoi</strong>.
              Sur papier ? Il photographie sa copie, Emma corrige le manuscrit.
            </p>
          </div>
          <div className="card p-6 border-t-[3px] border-t-amber">
            <h3 className="font-semibold text-[15.5px]">Les habitudes qui coûtent l'A*</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Arrondir trop tôt, sauter des étapes dans un « Show that », oublier une solution en trigo… Emma les
              traque à chaque correction et les fait disparaître — c'est là que se gagnent les derniers 10 %.
            </p>
          </div>
        </div>
      </section>

      {/* ================= LA BOUCLE ================= */}
      <section className="mt-16">
        <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">La méthode</p>
        <h2 className="font-serif font-semibold text-3xl text-ink mt-2">Une boucle qui ne laisse rien passer</h2>
        <div className="mt-8 space-y-3">
          {[
            ["1", "Il capture sa leçon", "Le titre, ses notes, ou une photo du cours pris en classe. Emma identifie les concepts exacts du programme (Edexcel, OCR)."],
            ["2", "Il apprend — vite ou à fond", "Cours complet ou « concepts clés » pour réviser : clair, avec la notation propre et le réflexe d'examen pour chaque concept."],
            ["3", "Emma vérifie qu'il a compris", "Pas une note floue : un diagnostic concept par concept — acquis, fragile, ou à revoir. Ce qui coince est ré-expliqué autrement, puis re-vérifié."],
            ["4", "Il pratique comme à l'examen", "Des exercices calqués sur les past papers, en ligne ou sur papier. Correction d'examinateur, et on refait une variante tant que ce n'est pas solide."],
            ["5", "Rien n'est oublié", "Les points fragiles vont dans sa liste « à travailler » et reviennent plus tard — c'est la répétition espacée qui construit la mémoire du jour J."],
          ].map(([n, t, d]) => (
            <div key={n} className="card p-5 flex gap-5 items-start">
              <span className="font-serif font-black text-2xl text-indigo w-8 text-center shrink-0">{n}</span>
              <div>
                <h3 className="font-semibold text-[15.5px]">{t}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= DÉMO ÉCRITE ================= */}
      <section className="mt-16">
        <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">Démo</p>
        <h2 className="font-serif font-semibold text-3xl text-ink mt-2">Une séance, en vrai</h2>
        <p className="text-muted mt-3 max-w-3xl">
          Mardi soir. Maxence a vu la <strong className="text-ink">chain rule</strong> en classe. Voici la séance,
          telle qu'elle se passe dans l'outil :
        </p>

        <div className="mt-8 space-y-4 max-w-3xl">
          {/* 1 — capture */}
          <div className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">1 · Il capture sa leçon</p>
            <div className="mt-2 bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2.5 w-fit ml-auto text-[15px]">
              « Differentiation — chain rule » + 📷 photo du cours
            </div>
            <p className="text-sm text-muted mt-3">
              Emma identifie la leçon dans le spec Edexcel (Pure 7.2) et la découpe en 4 concepts :
              <span className="chip-todo ml-1">reconnaître une fonction composée</span>{" "}
              <span className="chip-todo">appliquer la chain rule</span>{" "}
              <span className="chip-todo">fonctions trig composées</span>{" "}
              <span className="chip-todo">chain rule inversée</span>
            </p>
          </div>

          {/* 2 — vérification + correction */}
          <div className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">2 · Après le cours, Emma vérifie — question 2/5</p>
            <div className="mt-2 bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 w-fit">
              <RichText text={"**Given that** \\( y = (3x^2 - 1)^5 \\), **find** \\( \\frac{dy}{dx} \\)."} />
            </div>
            <div className="mt-2 bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2.5 w-fit ml-auto">
              <RichText text={"\\( \\frac{dy}{dx} = 5(3x^2-1)^4 \\)"} className="[&_*]:!text-white" />
            </div>
            <div className="mt-2 bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-3 max-w-[92%]">
              <p className="text-sm"><span className="chip-fragile">presque</span></p>
              <RichText
                className="mt-1.5 text-[15px]"
                text={"Bonne nouvelle : la structure y est — tu aurais le **M1** (method mark) à l'examen. Mais tu perds le **A1** : tu as dérivé l'extérieur… et oublié de multiplier par la dérivée de l'intérieur. **Méprise repérée : dérivée intérieure oubliée.** La bonne réponse : \\( \\frac{dy}{dx} = 5(3x^2-1)^4 \\times 6x = 30x(3x^2-1)^4 \\). On la refait autrement, puis je te re-teste."}
              />
            </div>
            <p className="text-sm text-muted mt-3">
              Le concept passe en <span className="chip-fragile">fragile</span> → ré-explication sous un autre angle
              (l'image de la poupée russe), 2 questions de re-vérification → <span className="chip-acquis">acquis</span>.
            </p>
          </div>

          {/* 3 — exercice examen */}
          <div className="card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">3 · Exercice en conditions d'examen</p>
            <div className="mt-2 bg-indigo-soft rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span className="chip bg-amber-soft text-amber font-mono">“Show that”</span>
                <span className="chip-todo">4 marks · ~5 min</span>
              </div>
              <RichText text={"**Show that** the curve \\( y = (2x-3)^4 \\) has a stationary point at \\( x = \\tfrac{3}{2} \\)."} />
              <p className="text-xs text-muted mt-2 bg-white/60 rounded-lg px-3 py-2">
                🎯 <strong>Ce que l'examinateur attend :</strong> le résultat est donné — 100 % des marks sont dans le
                cheminement. Chaque étape écrite (M1 chain rule, A1 dérivée, M1 poser dy/dx = 0), et une
                conclusion explicite (A1).
              </p>
            </div>
            <p className="text-sm text-muted mt-3">
              Maxence le fait <strong className="text-ink">sur papier</strong>, photographie sa copie, et Emma corrige
              le manuscrit : <span className="font-mono text-indigo font-semibold">3/4 marks</span> — « conclusion non
              écrite : à l'examen, un “Show that” sans phrase finale perd son dernier mark. C'est l'habitude n°7 de
              celles qui coûtent l'A*. »
            </p>
          </div>

          {/* 4 — bilan */}
          <div className="card p-5 border-amber">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">4 · Fin de séance — 42 minutes</p>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Bilan : 3 concepts <span className="chip-acquis">acquis</span>, 1 <span className="chip-fragile">fragile</span>.
              « Conclusion des Show that » part dans ses points à travailler — Emma le re-testera dans 3 jours.
              Le tableau de bord enregistre la séance, et sa courbe de % de marks monte d'un cran.
            </p>
          </div>
        </div>
      </section>

      {/* ================= POUR QUI ================= */}
      <section className="mt-16">
        <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">Pour qui</p>
        <h2 className="font-serif font-semibold text-3xl text-ink mt-2">Fait pour ceux qui visent haut</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <div className="card p-6">
            <h3 className="font-semibold text-[15.5px]">🎓 L'élève qui vise A/A*</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              GCSE ou A Level, il a le niveau mais veut sécuriser les derniers marks : technique d'examen,
              pratique constante, points faibles traqués un par un.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-[15.5px]">📈 L'élève qui veut monter</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              De C vers A, de B vers A* : le diagnostic par concept trouve exactement où ça coince, et la boucle
              ne le lâche pas tant que ce n'est pas acquis. Chaque grade gagné se voit sur sa courbe.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-[15.5px]">👨‍👩‍👧 Les parents</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Un tuteur exigeant disponible tous les soirs, une fraction du prix d'un tuteur particulier — et la
              progression visible, séance par séance, au lieu d'un « ça va » en sortant de cours.
            </p>
          </div>
        </div>
      </section>

      {/* ================= COACHING + STYLES ================= */}
      <section className="mt-16 grid md:grid-cols-2 gap-4">
        <div className="card p-7">
          <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">Le mental aussi</p>
          <h2 className="font-serif font-semibold text-2xl text-ink mt-2">Un coach d'examen, pas seulement un prof</h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Le stress, la confiance, la stratégie du jour J — la moitié d'un A* se joue là. Dans ses séances de
            coaching, Emma écoute comment il se sent, le prépare à ce qui l'attend, construit sa gestion du temps
            (~1 point par minute), ses routines anti-panique, et le remotive avec <strong className="text-ink">ses
            propres progrès chiffrés</strong> — pas des encouragements creux. Toujours bienveillante, jamais à la
            place d'un adulte de confiance quand ça compte.
          </p>
        </div>
        <div className="card p-7">
          <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">Son Emma à lui</p>
          <h2 className="font-serif font-semibold text-2xl text-ink mt-2">Le ton qui lui convient</h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Chaque élève choisit le style de son tuteur :
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {[["Sympa", "chaleureuse, encourageante"], ["Stricte", "cadrée, exigeante"], ["Direct", "l'essentiel, zéro détour"], ["Chatty", "conversationnelle"]].map(([l, h]) => (
              <span key={l} className="chip-todo !text-[13px] !py-1.5 !px-4" title={h}>{l}</span>
            ))}
          </div>
          <p className="text-sm text-muted mt-4 leading-relaxed">
            Le ton change — l'exigence, la politesse et l'efficacité, jamais. Et les séances sont cadrées :
            45 minutes efficaces valent mieux que 3 heures diluées.
          </p>
        </div>
      </section>

      {/* ================= PROGRESSION / PARENTS ================= */}
      <section className="mt-16 card p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: "linear-gradient(#C97E10,#4F46E5)" }} />
        <p className="eyebrow font-mono text-xs font-bold tracking-[0.17em] uppercase text-amber">La preuve, pas la promesse</p>
        <h2 className="font-serif font-semibold text-3xl text-ink mt-2">La progression, noir sur blanc</h2>
        <div className="grid sm:grid-cols-2 gap-8 mt-5 items-center">
          <p className="text-muted leading-relaxed">
            Niveau de départ → niveau actuel estimé sur ses vrais résultats d'exercices → objectif.
            Chaque séance est enregistrée : durée, leçons couvertes, points travaillés, tendance des scores.
            L'élève <strong className="text-ink">voit</strong> qu'il progresse — et vous aussi.
          </p>
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-faint">Départ</p>
              <p className="font-serif font-black text-4xl text-muted">C</p>
            </div>
            <span className="text-faint text-2xl">→</span>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-indigo">Actuel</p>
              <p className="font-serif font-black text-4xl text-indigo">A</p>
            </div>
            <span className="text-faint text-2xl">→</span>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber">Objectif</p>
              <p className="font-serif font-black text-4xl text-amber">A*</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MATIÈRES ================= */}
      <section className="mt-16">
        <h2 className="font-serif font-semibold text-2xl text-ink">Les matières</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Mathématiques</h3>
              <span className="chip-acquis">disponible</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">Edexcel A Level (9MA0)</p>
            <p className="text-sm text-muted mt-3">Cours, notation LaTeX propre, exercices past-paper, correction de copies photographiées.</p>
          </div>
          <div className="card p-6 opacity-75">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Économie</h3>
              <span className="chip bg-amber-soft text-amber">bientôt</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">Edexcel A Level</p>
            <p className="text-sm text-muted mt-3">Dissertation, structure d'argumentation, technique des questions à points.</p>
          </div>
          <div className="card p-6 opacity-75">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Géographie</h3>
              <span className="chip bg-amber-soft text-amber">bientôt</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">OCR A Level</p>
            <p className="text-sm text-muted mt-3">Mots-consignes (« assess », « evaluate »), études de cas, réponses en contexte.</p>
          </div>
        </div>
        <p className="text-sm text-faint mt-4">D'autres matières et exam boards suivront — la méthode est la même.</p>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="mt-16 mb-4 text-center card p-10">
        <h2 className="font-serif font-black text-3xl text-indigo-deep">
          Un ami qui sait tout dans la matière.<br />Et qui veut vraiment ton <span className="text-amber">A*</span>.
        </h2>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/login?register=1" className="btn-amber text-base !px-8 !py-3.5 font-bold">Créer un compte</Link>
          <Link href="/login" className="btn-ghost text-base !px-8 !py-3.5">Se connecter</Link>
        </div>
        <p className="text-xs text-faint mt-6">Accès en beta privée pendant la phase de test.</p>
      </section>
    </div>
  );
}

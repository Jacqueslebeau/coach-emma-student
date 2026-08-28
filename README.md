# Coach Emma Student — Phase 0 (MVP Maths)

Produit **séparé** de Coach Emma (autre login, autre base, autre repo) — même stack
éprouvée : Next.js + Vercel + Supabase + API Claude côté serveur.

Cahier de conception : https://claude.ai/code/artifact/203277e7-f397-4cf4-b359-bd3cdfccd7b4

## La boucle (Phase 0 — Maths Edexcel 9MA0)

1. **Capturer la leçon** — titre, notes, ou photo du cours → Emma identifie 3-6 concepts du spec.
2. **Apprendre** — cours complet ou « concepts clés », ton pote-qui-explique, LaTeX propre.
3. **Vérifier la maîtrise** — 5 questions, diagnostic par concept (acquis / fragile / à revoir).
4. **Remédier** — le concept raté est ré-expliqué sous un autre angle (méprise nommée), re-vérifié.
5. **Pratiquer** — 3 exercices style past paper ; en ligne **ou sur papier + photo de la copie**.
6. **Corriger** — au mark scheme (method marks valorisés), corrigé pas à pas, méprises nommées.
7. **Refaire ou avancer** — variante ciblée si fragile, sinon boucle bouclée.
8. **Points à travailler** — liste vivante (avec `due_at` J+3 : amorce de la révision espacée P1).

Garde-fou justesse : chaque prompt de correction impose au modèle de résoudre lui-même
pas à pas avant de juger ; température 0 sur les corrections.

## Le cœur : la technique d'examen (`lib/examTechnique.ts`)

On vend des A*, pas du contenu. Chaque question, exercice et correction est ancré sur :
command words Edexcel (« Show that », « Hence », « Exact value »…), types de marks
(M/A/B/ft), l'échelle des types de questions (fluency → multi-step → proof), les 9
habitudes qui coûtent l'A*, le rythme ~1 mark/min. Chaque exercice affiche « ce que
l'examinateur attend » ; chaque correction note mark par mark et signale les habitudes
coûteuses repérées.

## Coaching d'examen (`/coaching`)

Séances SANS contenu maths : ressenti, stress, préparation, stratégie du jour J,
motivation. Emma écoute, cite les progrès réels de l'élève, conclut sur 1-3 actions.
Garde-fous absolus dans le prompt : bienveillance, zéro propos discriminatoire/illégal,
orientation vers un adulte de confiance en cas de mal-être — jamais de diagnostic.

## Styles d'Emma & cadre de séance

L'élève choisit le ton : **sympa / stricte / direct / chatty** (chit-chat ≤ 5 min).
Le style change le ton, jamais l'exigence ni la courtoisie. Minuteur de séance intégré :
signal doux à 45 min, franc à 60 min (une séance efficace ne dépasse pas l'heure).

## Tableau de bord progression

Niveau de départ (figé à la 1re saisie) → niveau actuel **estimé** depuis les % de
marks des séries d'exercices (bandes indicatives : ≥85 % ≈ A*) → objectif. Historique
des séances auto-tracké (durée réelle + ce qui a été couvert), leçons/topics couverts,
points à travailler.

## Infrastructure (provisionnée)

- **Supabase dédié** : projet `coach-emma-student` (`odlmsobbpiruplwqwtdl`, région eu-west-2 Londres),
  migration appliquée. Pour tester sans friction : Dashboard → Authentication → Sign In/Up →
  désactiver « Confirm email ».
- **Pas de service_role** : toutes les écritures passent par la session élève (RLS).
  3 variables d'env seulement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `ANTHROPIC_API_KEY`.
- **Déploiement : Vercel, comme Coach Emma.** Import standard de ce repo (branche
  `main`), une seule variable d'env : `ANTHROPIC_API_KEY`. (La config Supabase
  publique est embarquée dans `lib/publicConfig.ts` — clé publishable, sécurité
  par RLS.)

## Lancer en local

```bash
npm install
cp .env.example .env.local   # remplir les 3 variables
npm run dev                  # http://localhost:3100
```

## Structure

- `lib/prompts.ts` — le cerveau pédagogique (persona, extraction de concepts, cours, quiz,
  correction, remédiation, exercices, marking). Source unique.
- `lib/claude.ts` — wrapper unique API Claude (vision incluse) + log coût `workflow_runs`.
- `lib/mastery.ts` — mise à jour maîtrise par concept + points à travailler.
- `app/api/*` — routes server-only (clé API jamais côté client).
- `app/lesson/[id]/page.tsx` — la boucle complète côté élève.
- `supabase/migrations/0001_init.sql` — schéma (profils, leçons, tentatives, maîtrise,
  points faibles, workflow_runs, bucket `student-uploads`).

## Suite (voir cahier de conception)

- **Phase 1** : carte des concepts par matière + révision espacée (le champ `due_at` et
  `concept_mastery.history` sont déjà en base pour ça).
- **Phase 2** : Éco (Edexcel) + Géo (OCR) — dissertation, mots-consignes, coaching voix ElevenLabs.
- **Phase 3** : tableau de bord parent, motivation, multi-utilisateurs → vente.

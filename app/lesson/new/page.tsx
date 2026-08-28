"use client";

// Capture d'une leçon — les 3 portes d'entrée, une destination :
// titre, notes tapées, ou photo du cours → mêmes concepts identifiés.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/compressImage";

export default function NewLesson() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarify, setClarify] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setClarify(null);
    try {
      const fd = new FormData();
      if (title.trim()) fd.set("title", title.trim());
      if (notes.trim()) fd.set("notes", notes.trim());
      if (photo) fd.set("photo", await compressImage(photo));
      const r = await fetch("/api/lessons", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.status === 422 && d.needs_clarification) {
        setClarify(d.clarification || "Peux-tu préciser le chapitre ?");
        return;
      }
      if (!r.ok) throw new Error(d.error || "Erreur");
      router.push(`/lesson/${d.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif font-black text-3xl text-indigo-deep">Nouvelle leçon</h1>
      <p className="text-muted mt-2">
        Entre ce que tu as — le titre suffit, mais plus tu en donnes, plus le cours collera à ce que
        ton prof a fait. Emma identifie les concepts du programme Edexcel.
      </p>

      {/* Matières : Maths active en Phase 0, Éco/Géo arrivent en Phase 2 */}
      <div className="flex gap-2 mt-6">
        <span className="chip-todo !text-[13px] !py-1.5 !px-4">Maths · Edexcel</span>
        <span className="chip !text-[13px] !py-1.5 !px-4 bg-white border border-line text-faint" title="Bientôt">Éco · bientôt</span>
        <span className="chip !text-[13px] !py-1.5 !px-4 bg-white border border-line text-faint" title="Bientôt">Géo · bientôt</span>
      </div>

      <form onSubmit={onSubmit} className="card p-6 mt-4 space-y-5">
        <div>
          <label className="text-sm font-semibold">Titre de la leçon</label>
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Differentiation — chain rule"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Tes notes <span className="text-faint font-normal">(optionnel)</span></label>
          <textarea
            className="input mt-1 min-h-[140px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Colle ou tape ce que vous avez vu en classe…"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Photo du cours <span className="text-faint font-normal">(optionnel)</span></label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:btn-ghost file:!py-1.5 file:!px-3.5 file:text-[13px] file:border-0 file:bg-indigo-soft file:text-indigo file:rounded-lg file:font-semibold"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
          {photo && <p className="text-xs text-faint mt-1">{photo.name} ({Math.round(photo.size / 1024)} Ko)</p>}
        </div>
        {clarify && (
          <p className="text-sm font-semibold text-learning bg-learning-bg rounded-xl px-4 py-3">
            Emma a besoin d'une précision : {clarify}
          </p>
        )}
        {error && <p className="text-sm text-gap font-semibold">{error}</p>}
        <button className="btn-primary w-full !py-3" disabled={busy}>
          {busy ? "Emma identifie les concepts…" : "C'est parti →"}
        </button>
      </form>
    </div>
  );
}

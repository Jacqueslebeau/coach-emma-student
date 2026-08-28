"use client";

// Page /demo — la démo scénarisée en plein écran (partageable telle quelle).
import DemoStudio from "@/components/DemoStudio";
import { useLang, LangToggle } from "@/lib/i18n";

export default function DemoPage() {
  const [lang, setLang] = useLang();
  return (
    <div>
      <div className="flex justify-end max-w-xl mx-auto pt-2">
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <DemoStudio fullscreen lang={lang} />
    </div>
  );
}

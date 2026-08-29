"use client";

// Bouton retour présent sur chaque page de la console.
import { useRouter } from "next/navigation";

export default function BackLink({ fallback = "/dashboard", label = "← Retour" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="text-sm text-faint hover:text-indigo font-semibold"
    >
      {label}
    </button>
  );
}

import DemoStudio from "@/components/DemoStudio";

// Page /demo — la démo scénarisée en plein écran (partageable telle quelle).
export const metadata = { title: "La démo — Coach Emma Student" };

export default function DemoPage() {
  return <DemoStudio fullscreen />;
}

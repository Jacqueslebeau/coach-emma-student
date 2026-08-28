"use client";

// Compression côté client des photos (cours, copies) avant upload :
// les photos de téléphone font souvent 5-12 Mo alors que Vercel limite les
// requêtes à ~4,5 Mo. On redimensionne à 1600px max et on encode en JPEG.
const MAX_DIM = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    // Déjà petite et déjà JPEG → on garde l'original.
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type === "image/jpeg") return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // en cas d'échec (format exotique), on tente l'original
  }
}

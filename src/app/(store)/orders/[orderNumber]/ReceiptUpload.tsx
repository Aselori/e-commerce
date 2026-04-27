"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { submitReceipt } from "../actions";

type Props = {
  orderNumber: string;
  userId: string;
};

export function ReceiptUpload({ orderNumber, userId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Selecciona el comprobante de pago.");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setError("El archivo debe ser una imagen o PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no debe superar 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${ext}`;
      const storagePath = `${userId}/${orderNumber}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("receipts")
        .upload(storagePath, file, { upsert: false });

      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }

      const result = await submitReceipt(orderNumber, storagePath);
      if ("error" in result) {
        setError(result.error);
        setUploading(false);
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el comprobante.");
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-600 mb-2">
          Comprobante de pago (imagen o PDF)
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-gray-900 file:text-white hover:file:bg-red-600"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {uploading ? "Subiendo..." : "Enviar comprobante"}
      </button>
    </form>
  );
}

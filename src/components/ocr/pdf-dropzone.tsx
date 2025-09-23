"use client";

import { useCallback, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";
import { toast } from "sonner";

interface PdfUploadDropzoneProps {
  kanzleien: Array<{ id: string; name: string }>;
}

const STORAGE_BUCKET = "projekte";

export function PdfUploadDropzone({ kanzleien }: PdfUploadDropzoneProps) {
  const supabase = createClientComponentClient<Database>();
  const [isDragging, setIsDragging] = useState(false);
  const [kanzleiId, setKanzleiId] = useState<string>(kanzleien[0]?.id ?? "");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Nur PDF-Dateien werden unterstützt.");
        return;
      }

      if (!kanzleiId) {
        toast.error("Bitte eine Kanzlei auswählen.");
        return;
      }

      setIsUploading(true);
      const path = `${kanzleiId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error(uploadError.message);
        setIsUploading(false);
        return;
      }

      const { error: functionError } = await supabase.functions.invoke("ocr-handler", {
        body: { path, kanzleiId }
      });

      setIsUploading(false);

      if (functionError) {
        toast.error(functionError.message ?? "OCR-Verarbeitung fehlgeschlagen");
      } else {
        toast.success("Upload erfolgreich. OCR wurde gestartet.");
      }
    },
    [kanzleiId, supabase]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        await handleUpload(file);
      }
    },
    [handleUpload]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-accent/40 bg-surface/80 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className="text-xs uppercase tracking-wide text-accent">OCR Upload</span>
        <select
          value={kanzleiId}
          onChange={(event) => setKanzleiId(event.target.value)}
          className="rounded-lg bg-muted px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <option value="">Kanzlei auswählen</option>
          {kanzleien.map((kanzlei) => (
            <option key={kanzlei.id} value={kanzlei.id}>
              {kanzlei.name}
            </option>
          ))}
        </select>
      </div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-6 py-8 text-center text-sm transition hover:border-accent/50 ${
          isDragging ? "border-accent/70 bg-slate-900/40" : ""
        }`}
      >
        <span className="text-slate-200">
          {isUploading ? "Lade hoch..." : "PDF hier ablegen oder auswählen"}
        </span>
        <span className="text-xs text-slate-500">
          Der Upload erstellt automatisch ein Projekt im Pool-Bucket und stößt die OCR Edge Function an.
        </span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await handleUpload(file);
            }
          }}
        />
      </label>
    </div>
  );
}

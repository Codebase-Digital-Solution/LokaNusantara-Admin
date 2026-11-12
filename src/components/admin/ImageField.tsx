"use client";

import { useRef, useState } from "react";
import { ImageOff, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { imageSrc } from "@/core/utils/imageUrl";
import { Input, errorMessage } from "./ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Photo picker (location photo, trail cover): upload a file (stored by the API) or paste an
 * image URL. [value] is what gets saved as image_url.
 */
export function ImageField({
  value,
  onChange,
  upload,
  label = "Foto",
}: {
  value: string;
  onChange: (url: string) => void;
  upload: (file: File) => Promise<string>;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const src = imageSrc(value);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) {
      setError("Format harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran maksimal 5 MB.");
      return;
    }
    setBusy(true);
    try {
      setBroken(false);
      onChange(await upload(file));
    } catch (err) {
      setError(`Gagal mengunggah: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700 block">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
        className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50"
      >
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded or external photo
          <img
            src={src}
            alt="Foto lokasi"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 text-center text-sm text-gray-500"
          >
            {src && broken ? <ImageOff size={28} /> : <ImagePlus size={28} />}
            {src && broken ? "Gambar tidak bisa dimuat. Unggah ulang atau periksa URL." : "Klik atau seret foto ke sini"}
            <span className="text-xs text-gray-400">JPG, PNG, atau WebP, maksimal 5 MB</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin text-gray-500" />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ImagePlus size={14} /> {value ? "Ganti foto" : "Unggah foto"}
        </button>
        {value && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onChange("");
              setBroken(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} /> Hapus foto
          </button>
        )}
      </div>

      <Input
        type="url"
        placeholder="Atau tempel URL gambar (https://...)"
        value={value.startsWith("/uploads/") ? "" : value}
        onChange={(e) => {
          setBroken(false);
          onChange(e.target.value.trim());
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Small square thumbnail for tables. */
export function ImageThumb({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(url);
  return (
    <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-300">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded or external photo
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <ImageOff size={16} aria-label="Belum ada foto" />
      )}
    </div>
  );
}

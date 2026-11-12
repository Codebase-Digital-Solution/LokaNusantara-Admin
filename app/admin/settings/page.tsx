"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff, KeyRound, XCircle } from "lucide-react";
import { aiSettingsDatasource } from "@/data/datasources";
import type { AISettings } from "@/domain/entities";
import { Button, ErrorBanner, Field, Input, LoadingState, PageHeader, errorMessage } from "@/components/admin/ui";

// Suggestions only; any model name the key can use is accepted.
const MODEL_SUGGESTIONS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"];

const SOURCE_LABEL: Record<string, string> = {
  database: "disimpan dari panel admin",
  env: "dari file .env server",
};

export default function SettingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["ai-settings"], queryFn: aiSettingsDatasource.get });

  return (
    <>
      <PageHeader
        title="Pengaturan AI"
        description="Dipakai oleh Tanya Loka dan Rencana Kunjungan di aplikasi. Perubahan langsung berlaku tanpa restart server."
      />
      {error && <ErrorBanner message={errorMessage(error)} />}
      {isLoading ? <LoadingState /> : data && <SettingsForm current={data} />}
    </>
  );
}

function SettingsForm({ current }: { current: AISettings }) {
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(current.model);
  const [maxInput, setMaxInput] = useState(String(current.max_input_chars));
  const [maxOutput, setMaxOutput] = useState(String(current.max_output_tokens));
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const save = useMutation({
    mutationFn: (clearKey: boolean) =>
      aiSettingsDatasource.update({
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
        clear_api_key: clearKey,
        model: model.trim(),
        max_input_chars: Number(maxInput),
        max_output_tokens: Number(maxOutput),
      }),
    onSuccess: (view) => {
      qc.setQueryData(["ai-settings"], view);
      setApiKey("");
      setSaved(true);
      setTestResult(null);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const test = useMutation({
    mutationFn: aiSettingsDatasource.test,
    onSuccess: () => setTestResult({ ok: true, message: `Key dan model "${current.model}" bisa dipakai.` }),
    onError: (err) => setTestResult({ ok: false, message: errorMessage(err) }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(false);
        }}
      >
        <ErrorBanner message={save.error ? errorMessage(save.error) : null} />

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-900">API key OpenAI</h2>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
            <KeyRound size={16} className="shrink-0 text-gray-400" />
            {current.api_key_set ? (
              <span className="text-gray-700">
                Terpasang, berakhiran <span className="font-mono font-medium">...{current.api_key_hint}</span>
                <span className="text-gray-400"> ({SOURCE_LABEL[current.api_key_source] ?? "-"})</span>
              </span>
            ) : (
              <span className="text-amber-700">Belum ada key. Tanya Loka dan Rencana Kunjungan nonaktif.</span>
            )}
          </div>
          <Field
            label={current.api_key_set ? "Ganti API key" : "API key"}
            hint="Kosongkan untuk tetap memakai key yang sekarang. Key tidak pernah ditampilkan lagi setelah disimpan."
          >
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showKey ? "Sembunyikan key" : "Tampilkan key"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          {current.api_key_source === "database" && (
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate(true)}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Hapus key dari database (kembali ke key di .env bila ada)
            </button>
          )}
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900">Model dan batas</h2>
          <Field label="Model" hint="Nama model OpenAI, misalnya gpt-4o-mini. Pastikan key Anda punya akses ke model ini.">
            <Input
              required
              list="model-suggestions"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="font-mono"
            />
            <datalist id="model-suggestions">
              {MODEL_SUGGESTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Max input (karakter)"
              hint="Batas panjang pertanyaan Tanya Loka dan catatan rencana dari pengguna. 50 sampai 4000."
            >
              <Input
                required
                type="number"
                min={50}
                max={4000}
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
              />
            </Field>
            <Field
              label="Max output (token)"
              hint="Batas panjang jawaban AI. Rencana kunjungan butuh sekitar 1500 token; terlalu kecil membuat jawaban terpotong. 300 sampai 16000."
            >
              <Input
                required
                type="number"
                min={300}
                max={16000}
                value={maxOutput}
                onChange={(e) => setMaxOutput(e.target.value)}
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> Tersimpan
            </span>
          )}
          <Button type="submit" loading={save.isPending}>
            Simpan pengaturan
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Uji koneksi</h2>
          <p className="mt-1 text-sm text-gray-500">
            Memeriksa key dan model yang sudah tersimpan ke OpenAI. Simpan dulu bila baru mengganti.
          </p>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            loading={test.isPending}
            disabled={!current.api_key_set}
            onClick={() => test.mutate()}
          >
            Uji sekarang
          </Button>
          {testResult && (
            <p
              className={`mt-3 flex items-start gap-1.5 text-sm ${
                testResult.ok ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" />
              )}
              {testResult.message}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          <h2 className="font-semibold text-gray-900">Berlaku untuk</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Tanya Loka (pemandu budaya)</li>
            <li>Rencana Kunjungan</li>
          </ul>
          <p className="mt-3">
            Key disimpan di database server dan hanya 4 karakter terakhirnya yang ditampilkan di panel ini.
          </p>
        </div>
      </aside>
    </div>
  );
}

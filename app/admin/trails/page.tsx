"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, X } from "lucide-react";
import { locationDatasource, trailDatasource } from "@/data/datasources";
import { ImageField } from "@/components/admin/ImageField";
import { imageSrc } from "@/core/utils/imageUrl";
import { CONTENT_LANGUAGES, type LanguageCode, type Trail, type TrailInput, type TrailTranslation } from "@/domain/entities";
import { LanguageTabs } from "@/components/admin/LanguageTabs";
import {
  Button,
  DeleteButton,
  ErrorBanner,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  TextArea,
  errorMessage,
  Pagination,
  usePagination,
} from "@/components/admin/ui";

const emptyTranslations = (): Record<LanguageCode, TrailTranslation> => Object.fromEntries(
  CONTENT_LANGUAGES.map(({ code }) => [code, { title: "", subtitle: "", story: "" }]),
) as Record<LanguageCode, TrailTranslation>;
const emptyStopTranslations = (): Record<LanguageCode, string> => ({ id: "", en: "", ja: "", ko: "" });
const EMPTY: TrailInput = { slug: "", title: "", subtitle: "", story: "", color: "#A87618", image_url: "", stops: [], translations: emptyTranslations() };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TrailsPage() {
  const qc = useQueryClient();
  const trails = useQuery({ queryKey: ["trails"], queryFn: trailDatasource.getAll });
  const locations = useQuery({ queryKey: ["locations"], queryFn: locationDatasource.getAll });

  const [editing, setEditing] = useState<Trail | "new" | null>(null);
  const [form, setForm] = useState<TrailInput>(EMPTY);
  const [language, setLanguage] = useState<LanguageCode>("id");
  const [slugTouched, setSlugTouched] = useState(false);
  const [newStop, setNewStop] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const pager = usePagination(trails.data ?? []);

  const set = (patch: Partial<TrailInput>) => setForm((f) => ({ ...f, ...patch }));
  const setTranslation = (patch: Partial<TrailTranslation>) => setForm((f) => ({ ...f, translations: { ...f.translations, [language]: { ...f.translations[language], ...patch } } }));

  const sortedLocations = useMemo(
    () => [...(locations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [locations.data],
  );
  const locationName = useMemo(() => new Map((locations.data ?? []).map((l) => [l.id, l.name])), [locations.data]);

  const save = useMutation({
    mutationFn: () => {
      const input = { ...form, title: form.translations.id.title.trim(), subtitle: form.translations.id.subtitle, story: form.translations.id.story, translations: form.translations,
        stops: form.stops.map((stop) => ({ ...stop, note: stop.translations.id ?? "" })) };
      return editing === "new" ? trailDatasource.create(input) : trailDatasource.update((editing as Trail).id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trails"] });
      setEditing(null);
    },
  });

  const open = (t: Trail | "new") => {
    save.reset();
    setNewStop("");
    setSlugTouched(t !== "new");
    setLanguage("id");
    const translations = emptyTranslations();
    if (t !== "new") {
      for (const row of t.translations ?? []) translations[row.language_code] = { title: row.title ?? "", subtitle: row.subtitle ?? "", story: row.story ?? "" };
      if (!translations.id.title) translations.id = { title: t.title, subtitle: t.subtitle ?? "", story: t.story ?? "" };
    }
    setForm(t === "new" ? { ...EMPTY, translations: emptyTranslations(), stops: [] } : {
      slug: t.slug, title: translations.id.title, subtitle: translations.id.subtitle, story: translations.id.story,
      color: t.color || "#A87618", image_url: t.image_url ?? "", translations,
      stops: t.stops.map((stop) => {
        const stopTranslations = emptyStopTranslations();
        for (const row of stop.translations ?? []) stopTranslations[row.language_code] = row.note ?? "";
        if (!stopTranslations.id) stopTranslations.id = stop.note ?? "";
        return { location_id: stop.location_id, note: stopTranslations.id, translations: stopTranslations };
      }),
    });
    setEditing(t);
  };

  const moveStop = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const stops = [...f.stops];
      const j = i + dir;
      if (j < 0 || j >= stops.length) return f;
      [stops[i], stops[j]] = [stops[j], stops[i]];
      return { ...f, stops };
    });

  const updateStop = (i: number, note: string) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s, k) => (k === i ? { ...s, note: language === "id" ? note : s.note, translations: { ...s.translations, [language]: note } } : s)) }));

  const removeStop = (i: number) => setForm((f) => ({ ...f, stops: f.stops.filter((_, k) => k !== i) }));

  const remove = async (id: number) => {
    setActionError(null);
    try {
      await trailDatasource.remove(id);
      qc.invalidateQueries({ queryKey: ["trails"] });
    } catch (err) {
      setActionError(`Gagal menghapus: ${errorMessage(err)}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Jalur Kisah"
        description="Rute bertema yang menghubungkan beberapa lokasi secara berurutan."
        action={
          <Button onClick={() => open("new")}>
            <Plus size={16} /> Tambah jalur
          </Button>
        }
      />

      <div className="space-y-4">
        {trails.error && <ErrorBanner message={errorMessage(trails.error)} />}
        <ErrorBanner message={actionError} />
        {trails.isLoading ? (
          <LoadingState />
        ) : trails.data?.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
            Belum ada jalur.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pager.pageItems.map((t) => (
              <div key={t.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                <TrailCover url={t.image_url} color={t.color} />
                <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: t.color || "#999" }} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    {t.subtitle && <p className="text-sm text-gray-500">{t.subtitle}</p>}
                    <p className="mt-1 text-xs text-gray-400">/{t.slug}</p>
                  </div>
                </div>
                <ol className="mt-4 space-y-1 text-sm text-gray-600">
                  {t.stops.map((s, i) => (
                    <li key={s.id} className="flex gap-2">
                      <span className="w-5 shrink-0 text-right text-gray-400 tabular-nums">{i + 1}.</span>
                      {s.location?.name ?? s.location_id}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex justify-end gap-1 border-t border-gray-100 pt-3">
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => open(t)}>
                    <Pencil size={12} /> Ubah
                  </Button>
                  <DeleteButton onConfirm={() => remove(t.id)} />
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination {...pager} />
      </div>

      <Modal wide open={editing !== null} title={editing === "new" ? "Tambah jalur" : "Ubah jalur"} onClose={() => setEditing(null)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <ErrorBanner message={save.error ? errorMessage(save.error) : null} />
          <LanguageTabs value={language} onChange={setLanguage} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul">
              <Input
                required={language === "id"}
                value={form.translations[language].title}
                onChange={(e) => {
                  setTranslation({ title: e.target.value });
                  if (language === "id" && !slugTouched) set({ slug: slugify(e.target.value) });
                }}
              />
            </Field>
            <Field label="Slug" hint="Huruf kecil, angka, dan tanda hubung.">
              <Input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value });
                }}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Subjudul">
              <Input value={form.translations[language].subtitle} onChange={(e) => setTranslation({ subtitle: e.target.value })} />
            </Field>
            <Field label="Warna">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => set({ color: e.target.value.toUpperCase() })}
                  className="h-9 w-12 cursor-pointer rounded border border-gray-200"
                />
                <Input value={form.color} onChange={(e) => set({ color: e.target.value })} className="w-28" />
              </div>
            </Field>
          </div>
          <ImageField
            label="Foto sampul"
            value={form.image_url}
            onChange={(url) => set({ image_url: url })}
            upload={trailDatasource.uploadImage}
          />
          <Field label="Kisah">
            <TextArea rows={5} value={form.translations[language].story} onChange={(e) => setTranslation({ story: e.target.value })} />
          </Field>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Perhentian ({form.stops.length})</p>
            <ol className="space-y-2">
              {form.stops.map((s, i) => (
                <li key={`${s.location_id}-${i}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-sm text-gray-400 tabular-nums">{i + 1}.</span>
                    <span className="flex-1 truncate text-sm font-medium text-gray-900">
                      {locationName.get(s.location_id) ?? s.location_id}
                    </span>
                    <button type="button" onClick={() => moveStop(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Naikkan">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" onClick={() => moveStop(i, 1)} disabled={i === form.stops.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Turunkan">
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" onClick={() => removeStop(i)} className="p-1 text-gray-400 hover:text-red-600" aria-label="Hapus perhentian">
                      <X size={14} />
                    </button>
                  </div>
                  <Input
                    placeholder="Catatan untuk perhentian ini"
                    value={s.translations[language] ?? ""}
                    onChange={(e) => updateStop(i, e.target.value)}
                    className="mt-2"
                  />
                </li>
              ))}
            </ol>
            <div className="mt-2 flex gap-2">
              <Select value={newStop} onChange={(e) => setNewStop(e.target.value)} className="flex-1">
                <option value="">Pilih lokasi untuk ditambahkan</option>
                {sortedLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={!newStop}
                onClick={() => {
                  set({ stops: [...form.stops, { location_id: newStop, note: "", translations: emptyStopTranslations() }] });
                  setNewStop("");
                }}
              >
                <Plus size={14} /> Tambah
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" loading={save.isPending} disabled={form.stops.length === 0}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Cover photo of a trail card, or its theme colour while there is none. */
function TrailCover({ url, color }: { url: string; color: string }) {
  const [broken, setBroken] = useState(false);
  const src = imageSrc(url);
  return (
    <div className="aspect-[16/7] w-full" style={{ background: color || "#A87618" }}>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded or external photo
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-medium text-white/80">Belum ada foto sampul</div>
      )}
    </div>
  );
}

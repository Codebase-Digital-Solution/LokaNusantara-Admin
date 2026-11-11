"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, X } from "lucide-react";
import { locationDatasource, trailDatasource } from "@/data/datasources";
import type { Trail, TrailInput } from "@/domain/entities";
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

const EMPTY: TrailInput = { slug: "", title: "", subtitle: "", story: "", color: "#A87618", stops: [] };

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
  const [slugTouched, setSlugTouched] = useState(false);
  const [newStop, setNewStop] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const pager = usePagination(trails.data ?? []);

  const set = (patch: Partial<TrailInput>) => setForm((f) => ({ ...f, ...patch }));

  const sortedLocations = useMemo(
    () => [...(locations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [locations.data],
  );
  const locationName = useMemo(() => new Map((locations.data ?? []).map((l) => [l.id, l.name])), [locations.data]);

  const save = useMutation({
    mutationFn: () =>
      editing === "new" ? trailDatasource.create(form) : trailDatasource.update((editing as Trail).id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trails"] });
      setEditing(null);
    },
  });

  const open = (t: Trail | "new") => {
    save.reset();
    setNewStop("");
    setSlugTouched(t !== "new");
    setForm(
      t === "new"
        ? EMPTY
        : {
            slug: t.slug,
            title: t.title,
            subtitle: t.subtitle ?? "",
            story: t.story ?? "",
            color: t.color || "#A87618",
            stops: t.stops.map((s) => ({ location_id: s.location_id, note: s.note ?? "" })),
          },
    );
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
    setForm((f) => ({ ...f, stops: f.stops.map((s, k) => (k === i ? { ...s, note } : s)) }));

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
              <div key={t.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Judul">
              <Input
                required
                value={form.title}
                onChange={(e) =>
                  set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })
                }
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
              <Input value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
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
          <Field label="Kisah">
            <TextArea rows={5} value={form.story} onChange={(e) => set({ story: e.target.value })} />
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
                    value={s.note}
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
                  set({ stops: [...form.stops, { location_id: newStop, note: "" }] });
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

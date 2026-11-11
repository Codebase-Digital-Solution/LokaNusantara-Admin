"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { categoryDatasource, eventDatasource, locationDatasource } from "@/data/datasources";
import type { CulturalEvent, EventInput } from "@/domain/entities";
import {
  Button,
  DeleteButton,
  EmptyRow,
  ErrorBanner,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Table,
  TextArea,
  errorMessage,
  Pagination,
  usePagination,
} from "@/components/admin/ui";

const EMPTY: EventInput = {
  name: "",
  description: "",
  category: "",
  start_date: "",
  end_date: null,
  is_estimate: false,
  region: "",
  location_id: null,
};

function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventsPage() {
  const qc = useQueryClient();
  const events = useQuery({ queryKey: ["admin-events"], queryFn: eventDatasource.getAll });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryDatasource.getAll });
  const locations = useQuery({ queryKey: ["locations"], queryFn: locationDatasource.getAll });

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CulturalEvent | "new" | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY);
  const [actionError, setActionError] = useState<string | null>(null);

  const set = (patch: Partial<EventInput>) => setForm((f) => ({ ...f, ...patch }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events.data ?? []).filter(
      (e) => !q || e.name.toLowerCase().includes(q) || e.region?.toLowerCase().includes(q),
    );
  }, [events.data, query]);
  const pager = usePagination(filtered, query);

  const sortedLocations = useMemo(
    () => [...(locations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [locations.data],
  );

  const save = useMutation({
    mutationFn: () => {
      const input: EventInput = {
        ...form,
        name: form.name.trim(),
        end_date: form.end_date || null,
        location_id: form.location_id || null,
      };
      return editing === "new" ? eventDatasource.create(input) : eventDatasource.update((editing as CulturalEvent).id, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      setEditing(null);
    },
  });

  const open = (e: CulturalEvent | "new") => {
    save.reset();
    setForm(
      e === "new"
        ? EMPTY
        : {
            name: e.name,
            description: e.description ?? "",
            category: e.category ?? "",
            start_date: e.start_date,
            end_date: e.end_date ?? null,
            is_estimate: e.is_estimate,
            region: e.region ?? "",
            location_id: e.location_id ?? null,
          },
    );
    setEditing(e);
  };

  const remove = async (id: number) => {
    setActionError(null);
    try {
      await eventDatasource.remove(id);
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err) {
      setActionError(`Gagal menghapus: ${errorMessage(err)}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Agenda Budaya"
        description="Upacara dan acara budaya yang tampil di menu Agenda pada aplikasi."
        action={
          <Button onClick={() => open("new")}>
            <Plus size={16} /> Tambah agenda
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Cari nama atau wilayah" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        {events.error && <ErrorBanner message={errorMessage(events.error)} />}
        <ErrorBanner message={actionError} />

        {events.isLoading ? (
          <LoadingState />
        ) : (
          <Table head={["Tanggal", "Nama", "Kategori", "Wilayah", "Lokasi", ""]}>
            {filtered.length === 0 && <EmptyRow colSpan={6} text="Belum ada agenda." />}
            {pager.pageItems.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 tabular-nums">
                  {formatDate(e.start_date)}
                  {e.end_date && e.end_date !== e.start_date && <> s.d. {formatDate(e.end_date)}</>}
                  {e.is_estimate && (
                    <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">Perkiraan</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                <td className="px-4 py-3 text-gray-500">{e.category}</td>
                <td className="px-4 py-3 text-gray-500">{e.region}</td>
                <td className="px-4 py-3 text-gray-500">{e.location?.name ?? "-"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => open(e)}>
                    <Pencil size={12} /> Ubah
                  </Button>
                  <DeleteButton onConfirm={() => remove(e.id)} />
                </td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination {...pager} />
      </div>

      <Modal wide open={editing !== null} title={editing === "new" ? "Tambah agenda" : "Ubah agenda"} onClose={() => setEditing(null)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <ErrorBanner message={save.error ? errorMessage(save.error) : null} />
          <Field label="Nama">
            <Input required value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal mulai">
              <Input required type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} />
            </Field>
            <Field label="Tanggal selesai" hint="Kosongkan bila hanya satu hari.">
              <Input
                type="date"
                min={form.start_date || undefined}
                value={form.end_date ?? ""}
                onChange={(e) => set({ end_date: e.target.value || null })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_estimate}
              onChange={(e) => set({ is_estimate: e.target.checked })}
              className="h-4 w-4 accent-emerald-700"
            />
            Tanggal perkiraan (mengikuti kalender lunar atau keputusan penyelenggara)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <Select value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">Tanpa kategori</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Wilayah" hint="Contoh: Seluruh Bali, Gianyar">
              <Input value={form.region} onChange={(e) => set({ region: e.target.value })} />
            </Field>
          </div>
          <Field label="Lokasi terkait" hint="Opsional. Menghubungkan agenda ke tempat di peta.">
            <Select value={form.location_id ?? ""} onChange={(e) => set({ location_id: e.target.value || null })}>
              <option value="">Tidak ada</option>
              {sortedLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Deskripsi">
            <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="submit" loading={save.isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

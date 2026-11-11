"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { categoryDatasource, locationDatasource } from "@/data/datasources";
import type { Location, LocationInput } from "@/domain/entities";
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

const LocationPicker = dynamic(() => import("@/components/admin/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-gray-100" />,
});

type FormState = {
  name: string;
  description: string;
  history: string;
  address: string;
  latitude: string;
  longitude: string;
  category_id: string;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  history: "",
  address: "",
  latitude: "",
  longitude: "",
  category_id: "",
};

export default function LocationsPage() {
  const qc = useQueryClient();
  const locations = useQuery({ queryKey: ["locations"], queryFn: locationDatasource.getAll });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryDatasource.getAll });

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (locations.data ?? []).filter(
      (l) =>
        (!categoryFilter || String(l.category_id) === categoryFilter) &&
        (!q || l.name.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)),
    );
  }, [locations.data, query, categoryFilter]);
  const pager = usePagination(filtered, `${query}|${categoryFilter}`);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: () => {
      const input: LocationInput = {
        name: form.name.trim(),
        description: form.description,
        history: form.history,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        category_id: Number(form.category_id),
      };
      return editingId === "new" ? locationDatasource.create(input) : locationDatasource.update(editingId!, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      setEditingId(null);
    },
  });

  const openNew = () => {
    save.reset();
    setForm({ ...EMPTY, category_id: String(categories.data?.[0]?.id ?? "") });
    setEditingId("new");
  };

  // The list endpoint omits description and history, so load the full record.
  const openEdit = async (l: Location) => {
    save.reset();
    setActionError(null);
    setLoadingDetail(true);
    try {
      const full = await locationDatasource.getById(l.id);
      setForm({
        name: full.name,
        description: full.description ?? "",
        history: full.history ?? "",
        address: full.address ?? "",
        latitude: String(full.latitude),
        longitude: String(full.longitude),
        category_id: String(full.category_id),
      });
      setEditingId(l.id);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  const remove = async (id: string) => {
    setActionError(null);
    try {
      await locationDatasource.remove(id);
      qc.invalidateQueries({ queryKey: ["locations"] });
    } catch (err) {
      setActionError(`Gagal menghapus: ${errorMessage(err)}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Lokasi"
        description={`${locations.data?.length ?? 0} tempat tercatat. Ulasan ikut terhapus bila lokasinya dihapus.`}
        action={
          <Button onClick={openNew} disabled={!categories.data?.length}>
            <Plus size={16} /> Tambah lokasi
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari nama atau alamat" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-48">
            <option value="">Semua kategori</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        {locations.error && <ErrorBanner message={errorMessage(locations.error)} />}
        <ErrorBanner message={actionError} />

        {locations.isLoading ? (
          <LoadingState />
        ) : (
          <Table head={["Nama", "Kategori", "Alamat", "Koordinat", ""]}>
            {filtered.length === 0 && <EmptyRow colSpan={5} text="Tidak ada lokasi yang cocok." />}
            {pager.pageItems.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{l.category?.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{l.address}</td>
                <td className="px-4 py-3 text-xs text-gray-400 tabular-nums whitespace-nowrap">
                  {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    className="!px-2 !py-1 text-xs"
                    disabled={loadingDetail}
                    onClick={() => openEdit(l)}
                  >
                    <Pencil size={12} /> Ubah
                  </Button>
                  <DeleteButton onConfirm={() => remove(l.id)} />
                </td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination {...pager} />
      </div>

      <Modal
        wide
        open={editingId !== null}
        title={editingId === "new" ? "Tambah lokasi" : "Ubah lokasi"}
        onClose={() => setEditingId(null)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <ErrorBanner message={save.error ? errorMessage(save.error) : null} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama">
              <Input required value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Kategori">
              <Select required value={form.category_id} onChange={(e) => set({ category_id: e.target.value })}>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Alamat">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <Input
                required
                type="number"
                step="any"
                min={-90}
                max={90}
                value={form.latitude}
                onChange={(e) => set({ latitude: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <Input
                required
                type="number"
                step="any"
                min={-180}
                max={180}
                value={form.longitude}
                onChange={(e) => set({ longitude: e.target.value })}
              />
            </Field>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Klik peta untuk mengisi koordinat.</p>
            <LocationPicker
              lat={form.latitude === "" ? NaN : Number(form.latitude)}
              lng={form.longitude === "" ? NaN : Number(form.longitude)}
              onPick={(lat, lng) => set({ latitude: String(lat), longitude: String(lng) })}
            />
          </div>
          <Field label="Deskripsi">
            <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Sejarah" hint="Teks ini dibacakan oleh pemandu audio di aplikasi.">
            <TextArea rows={6} value={form.history} onChange={(e) => set({ history: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
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

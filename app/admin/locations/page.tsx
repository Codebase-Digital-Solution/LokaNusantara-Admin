"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { categoryDatasource, locationDatasource } from "@/data/datasources";
import { CONTENT_LANGUAGES, type LanguageCode, type Location, type LocationInput, type LocationTranslation } from "@/domain/entities";
import { LanguageTabs } from "@/components/admin/LanguageTabs";
import { ImageField, ImageThumb } from "@/components/admin/ImageField";
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
  translations: Record<LanguageCode, LocationTranslation>;
  image_url: string;
  latitude: string;
  longitude: string;
  category_id: string;
};

const emptyTranslations = (): Record<LanguageCode, LocationTranslation> => Object.fromEntries(
  CONTENT_LANGUAGES.map(({ code }) => [code, { name: "", description: "", history: "", address: "" }]),
) as Record<LanguageCode, LocationTranslation>;

const EMPTY: FormState = {
  translations: emptyTranslations(),
  image_url: "",
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
  const [onlyMissingPhoto, setOnlyMissingPhoto] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [language, setLanguage] = useState<LanguageCode>("id");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (locations.data ?? []).filter(
      (l) =>
        (!categoryFilter || String(l.category_id) === categoryFilter) &&
        (!onlyMissingPhoto || !l.image_url) &&
        (!q || l.name.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)),
    );
  }, [locations.data, query, categoryFilter, onlyMissingPhoto]);
  const pager = usePagination(filtered, `${query}|${categoryFilter}|${onlyMissingPhoto}`);
  const missingPhotos = (locations.data ?? []).filter((l) => !l.image_url).length;

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setTranslation = (patch: Partial<LocationTranslation>) => setForm((f) => ({
    ...f,
    translations: { ...f.translations, [language]: { ...f.translations[language], ...patch } },
  }));

  const save = useMutation({
    mutationFn: () => {
      const input: LocationInput = {
        name: form.translations.id.name.trim(),
        description: form.translations.id.description,
        history: form.translations.id.history,
        image_url: form.image_url,
        address: form.translations.id.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        category_id: Number(form.category_id),
        translations: form.translations,
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
    setLanguage("id");
    setForm({ ...EMPTY, translations: emptyTranslations(), category_id: String(categories.data?.[0]?.id ?? "") });
    setEditingId("new");
  };

  // The list endpoint omits description and history, so load the full record.
  const openEdit = async (l: Location) => {
    save.reset();
    setActionError(null);
    setLoadingDetail(true);
    try {
      const full = await locationDatasource.getById(l.id);
      setLanguage("id");
      setForm({
        translations: (() => {
          const values = emptyTranslations();
          for (const row of full.translations ?? []) values[row.language_code as LanguageCode] = { name: row.name ?? "", description: row.description ?? "", history: row.history ?? "", address: row.address ?? "" };
          if (!values.id.name) values.id = { name: full.name ?? "", description: full.description ?? "", history: full.history ?? "", address: full.address ?? "" };
          return values;
        })(),
        image_url: full.image_url ?? "",
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
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={onlyMissingPhoto}
              onChange={(e) => setOnlyMissingPhoto(e.target.checked)}
              className="h-4 w-4 accent-emerald-700"
            />
            Belum ada foto ({missingPhotos})
          </label>
        </div>

        {locations.error && <ErrorBanner message={errorMessage(locations.error)} />}
        <ErrorBanner message={actionError} />

        {locations.isLoading ? (
          <LoadingState />
        ) : (
          <Table head={["Foto", "Nama", "Kategori", "Alamat", "Koordinat", ""]}>
            {filtered.length === 0 && <EmptyRow colSpan={6} text="Tidak ada lokasi yang cocok." />}
            {pager.pageItems.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2">
                  <ImageThumb url={l.image_url} />
                </td>
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
          <LanguageTabs value={language} onChange={setLanguage} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama">
              <Input required={language === "id"} value={form.translations[language].name} onChange={(e) => setTranslation({ name: e.target.value })} />
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
            <Input value={form.translations[language].address} onChange={(e) => setTranslation({ address: e.target.value })} />
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
          <ImageField
            value={form.image_url}
            onChange={(url) => set({ image_url: url })}
            upload={locationDatasource.uploadImage}
          />
          <Field label="Deskripsi">
            <TextArea value={form.translations[language].description} onChange={(e) => setTranslation({ description: e.target.value })} />
          </Field>
          <Field label="Sejarah" hint="Teks ini dibacakan oleh pemandu audio di aplikasi.">
            <TextArea rows={6} value={form.translations[language].history} onChange={(e) => setTranslation({ history: e.target.value })} />
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

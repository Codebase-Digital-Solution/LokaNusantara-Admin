"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { categoryDatasource } from "@/data/datasources";
import type { Category } from "@/domain/entities";
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
  Table,
  errorMessage,
  PAGE_SIZE,
  Pagination,
  usePagination,
} from "@/components/admin/ui";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["categories"], queryFn: categoryDatasource.getAll });
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [name, setName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const pager = usePagination(data);

  const save = useMutation({
    mutationFn: () =>
      editing === "new" ? categoryDatasource.create(name.trim()) : categoryDatasource.update((editing as Category).id, name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
    },
  });

  const open = (c: Category | "new") => {
    save.reset();
    setName(c === "new" ? "" : c.name);
    setEditing(c);
  };

  // Moves a category one step up or down and saves the whole order. The
  // list updates right away and is restored if saving fails.
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= data.length) return;
    const next = [...data];
    [next[index], next[target]] = [next[target], next[index]];
    const before = data;
    qc.setQueryData(["categories"], next.map((c, i) => ({ ...c, position: i + 1 })));
    setActionError(null);
    try {
      await categoryDatasource.reorder(next.map((c) => c.id));
    } catch (err) {
      qc.setQueryData(["categories"], before);
      setActionError(`Gagal menyimpan urutan: ${errorMessage(err)}`);
    }
  };

  const remove = async (id: number) => {
    setActionError(null);
    try {
      await categoryDatasource.remove(id);
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (err) {
      setActionError(`Gagal menghapus: ${errorMessage(err)}. Kategori yang masih dipakai lokasi tidak bisa dihapus.`);
    }
  };

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kategori dipakai untuk mengelompokkan lokasi. Urutan di sini sama dengan urutan di aplikasi."
        action={
          <Button onClick={() => open("new")}>
            <Plus size={16} /> Tambah kategori
          </Button>
        }
      />
      <div className="space-y-4">
        {error && <ErrorBanner message={errorMessage(error)} />}
        <ErrorBanner message={actionError} />
        {isLoading ? (
          <LoadingState />
        ) : (
          <Table head={["Urutan", "Nama", ""]}>
            {data.length === 0 && <EmptyRow colSpan={3} text="Belum ada kategori." />}
            {pager.pageItems.map((c, i) => {
              const index = (pager.page - 1) * PAGE_SIZE + i;
              return (
              <tr key={c.id}>
                <td className="px-4 py-2 w-28">
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center text-sm font-medium text-gray-500 tabular-nums">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Naikkan ${c.name}`}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === data.length - 1}
                      aria-label={`Turunkan ${c.name}`}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => open(c)}>
                    <Pencil size={12} /> Ubah
                  </Button>
                  <DeleteButton onConfirm={() => remove(c.id)} />
                </td>
              </tr>
              );
            })}
          </Table>
        )}
        <Pagination {...pager} />
      </div>

      <Modal open={editing !== null} title={editing === "new" ? "Tambah kategori" : "Ubah kategori"} onClose={() => setEditing(null)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <ErrorBanner message={save.error ? errorMessage(save.error) : null} />
          <Field label="Nama" hint="Contoh: pura, kuliner, tradisi">
            <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
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

"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Star } from "lucide-react";
import { reviewDatasource } from "@/data/datasources";
import {
  DeleteButton,
  EmptyRow,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Table,
  errorMessage,
  Pagination,
  usePagination,
} from "@/components/admin/ui";

export default function ReviewsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-reviews"], queryFn: reviewDatasource.getAll });
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(
      (r) =>
        (!rating || r.rating === Number(rating)) &&
        (!q ||
          r.comment?.toLowerCase().includes(q) ||
          r.user?.name.toLowerCase().includes(q) ||
          r.location?.name.toLowerCase().includes(q)),
    );
  }, [data, query, rating]);
  const pager = usePagination(filtered, `${query}|${rating}`);

  const remove = async (id: number) => {
    setActionError(null);
    try {
      await reviewDatasource.remove(id);
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (err) {
      setActionError(`Gagal menghapus: ${errorMessage(err)}`);
    }
  };

  return (
    <>
      <PageHeader title="Ulasan" description="Ulasan dari pengguna aplikasi. Hapus ulasan yang tidak pantas atau spam." />
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari komentar, pengguna, atau lokasi" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={rating} onChange={(e) => setRating(e.target.value)} className="sm:w-40">
            <option value="">Semua rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} bintang
              </option>
            ))}
          </Select>
        </div>
        {error && <ErrorBanner message={errorMessage(error)} />}
        <ErrorBanner message={actionError} />

        {isLoading ? (
          <LoadingState />
        ) : (
          <Table head={["Tanggal", "Pengguna", "Lokasi", "Rating", "Komentar", ""]}>
            {filtered.length === 0 && <EmptyRow colSpan={6} text="Tidak ada ulasan." />}
            {pager.pageItems.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 tabular-nums">
                  {new Date(r.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.user?.name ?? "-"}</p>
                  <p className="text-xs text-gray-400">{r.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.location?.name ?? "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star size={14} className="fill-current" />
                    {r.rating}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 min-w-[16rem] max-w-md break-words">{r.comment || <span className="text-gray-300">Tanpa komentar</span>}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton onConfirm={() => remove(r.id)} />
                </td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination {...pager} />
      </div>
    </>
  );
}

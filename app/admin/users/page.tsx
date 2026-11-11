"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { userDatasource } from "@/data/datasources";
import {
  EmptyRow,
  ErrorBanner,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
  errorMessage,
  usePagination,
} from "@/components/admin/ui";

const DAY = 24 * 60 * 60 * 1000;

function shortDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

// Daily registrations, one bar per day. Single series, so no legend: the
// title names it. Hovering a column shows the exact day and count.
function DailyChart({ daily }: { daily: { day: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.count));
  const total = daily.reduce((s, d) => s + d.count, 0);
  const h = 120;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">Registrasi per hari, 30 hari terakhir</p>
        <p className="text-xs text-gray-500 tabular-nums">Total {total}</p>
      </div>
      <div className="relative mt-4" onMouseLeave={() => setHover(null)}>
        <div className="flex items-end gap-[2px] border-b border-gray-200" style={{ height: h }}>
          {daily.map((d, i) => (
            <div
              key={d.day}
              className="relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              aria-label={`${shortDate(d.day)}: ${d.count} registrasi`}
            >
              {hover === i && <div className="absolute inset-0 rounded-sm bg-gray-100" />}
              <div
                className="relative w-full rounded-t-[4px]"
                style={{
                  height: d.count === 0 ? 0 : Math.max(3, (d.count / max) * (h - 8)),
                  background: "#047857",
                }}
              />
            </div>
          ))}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: `${((hover + 0.5) / daily.length) * 100}%` }}
          >
            <span className="text-gray-500">{shortDate(daily[hover].day)}</span>{" "}
            <span className="font-medium text-gray-900 tabular-nums">{daily[hover].count} registrasi</span>
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-[11px] text-gray-400 tabular-nums">
          <span>{daily.length > 0 && shortDate(daily[0].day)}</span>
          <span>{daily.length > 0 && shortDate(daily[daily.length - 1].day)}</span>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-users"], queryFn: userDatasource.getAll });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("user");

  const users = useMemo(() => data?.data ?? [], [data]);
  const appUsers = useMemo(() => users.filter((u) => u.role === "user"), [users]);
  const [now] = useState(() => Date.now());
  const newSince = (days: number) => appUsers.filter((u) => now - new Date(u.created_at).getTime() <= days * DAY).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  }, [users, query, role]);
  const pager = usePagination(filtered, `${query}|${role}`);

  return (
    <>
      <PageHeader title="Pengguna" description="Akun yang registrasi lewat aplikasi mobile." />
      {error && <ErrorBanner message={errorMessage(error)} />}
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Total pengguna terdaftar" value={appUsers.length} />
            <StatTile label="Baru, 7 hari terakhir" value={newSince(7)} />
            <StatTile label="Baru, 30 hari terakhir" value={newSince(30)} />
          </div>

          {data?.daily && <DailyChart daily={data.daily} />}

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Cari nama atau email" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-48">
                <option value="user">Pengguna aplikasi</option>
                <option value="admin">Admin</option>
                <option value="">Semua akun</option>
              </Select>
            </div>

            <Table head={["Nama", "Email", "Peran", "Ulasan", "Terdaftar"]}>
              {filtered.length === 0 && <EmptyRow colSpan={5} text="Belum ada pengguna yang registrasi." />}
              {pager.pageItems.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.role === "admin" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Pengguna"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{u.review_count}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 tabular-nums">
                    {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination {...pager} />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  MapPin,
  MessageSquare,
  Route,
  Tags,
  Users,
} from "lucide-react";
import { statsDatasource } from "@/data/datasources";
import {
  ErrorBanner,
  LoadingState,
  PageHeader,
  errorMessage,
} from "@/components/admin/ui";

const CARDS = [
  { key: "locations", label: "Lokasi", href: "/admin/locations", icon: MapPin },
  {
    key: "categories",
    label: "Kategori",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    key: "events",
    label: "Agenda Budaya",
    href: "/admin/events",
    icon: CalendarDays,
  },
  { key: "trails", label: "Jalur Kisah", href: "/admin/trails", icon: Route },
  {
    key: "reviews",
    label: "Ulasan",
    href: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    key: "users",
    label: "Pengguna aplikasi",
    href: "/admin/users",
    icon: Users,
  },
] as const;

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: statsDatasource.get,
  });

  return (
    <>
      <PageHeader
        title="Dasbor"
        description="Ringkasan data yang tampil di aplikasi LokaNusantara."
      />
      {error && <ErrorBanner message={errorMessage(error)} />}
      {isLoading ? (
        <LoadingState />
      ) : (
        data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CARDS.map(({ key, label, href, icon: Icon }) => {
              const body = (
                <div className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-emerald-300">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon size={16} />
                    {label}
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">
                    {data[key]}
                  </p>
                  {key === "users" && (
                    <p className="mt-1 text-xs text-gray-500 tabular-nums">
                      +{data.new_users_7d} dalam 7 hari, +{data.new_users_30d}{" "}
                      dalam 30 hari
                    </p>
                  )}
                </div>
              );
              return (
                <Link key={key} href={href}>
                  {body}
                </Link>
              );
            })}
          </div>
        )
      )}
    </>
  );
}

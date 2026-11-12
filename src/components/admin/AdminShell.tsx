"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Route,
  Sparkles,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV_GROUPS = [
  {
    title: null,
    items: [{ href: "/admin", label: "Dasbor", icon: LayoutDashboard }],
  },
  {
    title: "Data Tempat",
    items: [
      { href: "/admin/locations", label: "Lokasi", icon: MapPin },
      { href: "/admin/categories", label: "Kategori", icon: Tags },
    ],
  },
  {
    title: "Konten Budaya",
    items: [
      { href: "/admin/events", label: "Agenda Budaya", icon: CalendarDays },
      { href: "/admin/trails", label: "Jalur Kisah", icon: Route },
    ],
  },
  {
    title: "Komunitas",
    items: [
      { href: "/admin/users", label: "Pengguna", icon: Users },
      { href: "/admin/reviews", label: "Ulasan", icon: MessageSquare },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/settings", label: "Pengaturan AI", icon: Sparkles },
    ],
  },
];

// Waits for the persisted session to load, then sends anyone who is not an
// admin to the login page. The API enforces the same rule on every write.
function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (hydrated && !isAdmin) router.replace("/login");
  }, [hydrated, isAdmin, router]);

  if (!hydrated || !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.title && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-full bg-gray-50">
      <aside
        className={`fixed inset-y-0 left-0 z-[900] flex w-60 flex-col border-r border-gray-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <div>
            <p className="font-semibold text-gray-900">LokaNusantara</p>
            <p className="text-xs text-gray-500">Panel Admin</p>
          </div>
          <button
            className="lg:hidden text-gray-400"
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
        {nav}
        <div className="mt-auto border-t border-gray-100 pt-4">
          <p className="truncate px-1 text-sm font-medium text-gray-800">
            {user.name}
          </p>
          <p className="truncate px-1 text-xs text-gray-500">{user.email}</p>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[850] bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-gray-600"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900">LokaNusantara Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

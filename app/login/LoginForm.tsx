"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button, ErrorBanner, Field, Input } from "@/components/admin/ui";

export default function LoginForm() {
  const router = useRouter();
  const { login, loading, error, clearError, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") router.replace("/admin");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (await login(email, password)) router.replace("/admin");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
      <ErrorBanner message={error} />
      <Field label="Email">
        <Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password">
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
      <Button type="submit" loading={loading} className="w-full py-2.5">
        Masuk
      </Button>
      <p className="text-center text-xs text-gray-400">Hanya akun admin yang dapat masuk.</p>
    </form>
  );
}

import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "BaliGuide Admin | Masuk" };

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">BaliGuide Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk untuk mengelola data BaliGuide</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

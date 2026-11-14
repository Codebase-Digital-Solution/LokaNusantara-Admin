"use client";

import { CONTENT_LANGUAGES, type LanguageCode } from "@/domain/entities";

export function LanguageTabs({ value, onChange }: { value: LanguageCode; onChange: (code: LanguageCode) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bahasa terjemahan">
      {CONTENT_LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          role="tab"
          aria-selected={value === language.code}
          onClick={() => onChange(language.code)}
          className={`rounded-lg border px-3 py-1.5 text-sm ${value === language.code ? "border-emerald-700 bg-emerald-50 font-medium text-emerald-800" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

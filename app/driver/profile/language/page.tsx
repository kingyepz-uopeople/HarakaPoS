"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Check } from "lucide-react";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "fr", name: "French", nativeName: "Français" },
];

export default function LanguageSettingsPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem("appLanguage");
    if (saved) {
      setSelectedLanguage(saved);
    }
  }, []);

  function selectLanguage(code: string) {
    setSelectedLanguage(code);
    localStorage.setItem("appLanguage", code);
    // In a real app, you would trigger language change here
    alert(`Language set to ${languages.find((l) => l.code === code)?.name}. App will reload with new language.`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-900">Language</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Language Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Select Language</h2>
            <p className="text-sm text-gray-500 mt-1">Choose your preferred language</p>
          </div>
          <div className="divide-y divide-gray-100">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => selectLanguage(language.code)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{language.name}</p>
                    <p className="text-sm text-gray-500">{language.nativeName}</p>
                  </div>
                </div>
                {selectedLanguage === language.code && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Language Support</h3>
              <p className="text-sm text-blue-700">
                The app interface will be translated to your selected language. Some content may remain in English until translation is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

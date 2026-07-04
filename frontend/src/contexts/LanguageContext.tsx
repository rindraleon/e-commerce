import React, { createContext, useContext, useState, useCallback } from "react";
import { translations, Language, TranslationKeys } from "@/i18n/translations";

// Use a deep mutable type for translations to avoid literal type issues
type DeepString<T> = T extends string ? string : { [K in keyof T]: DeepString<T[K]> };
type TranslationValues = DeepString<TranslationKeys>;

interface LanguageContextType {
  lang: Language;
  t: TranslationValues;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("lang");
    return (saved === "en" || saved === "fr") ? saved : "fr";
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  }, []);

  const toggleLang = useCallback(() => {
    handleSetLang(lang === "fr" ? "en" : "fr");
  }, [lang, handleSetLang]);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang: handleSetLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

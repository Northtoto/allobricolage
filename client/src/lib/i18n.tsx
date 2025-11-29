import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";

interface I18nContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();

  const handleSetLang = (newLang: string) => {
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // Ensure default direction is set
  if (typeof document !== 'undefined' && !document.documentElement.dir) {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }

  return (
    <I18nContext.Provider value={{ 
      lang: i18n.language, 
      setLang: handleSetLang, 
      t: (key) => t(key),
      isRTL: i18n.language === "ar" 
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

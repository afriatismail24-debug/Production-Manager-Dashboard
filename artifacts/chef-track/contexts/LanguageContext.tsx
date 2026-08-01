import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { I18nManager } from "react-native";

import { Lang, LANG_KEY, loadSavedLang, saveLang, t as translate } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  langLoaded: boolean;
  langSelected: boolean; // true only if the user explicitly chose a language
  setLang: (lang: Lang) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [langLoaded, setLangLoaded] = useState(false);
  const [langSelected, setLangSelected] = useState(false);

  useEffect(() => {
    loadSavedLang().then((saved) => {
      if (saved) {
        setLangState(saved);
        setLangSelected(true);
        applyRtl(saved);
      }
      setLangLoaded(true);
    });
  }, []);

  const setLang = useCallback(async (newLang: Lang) => {
    await saveLang(newLang);
    applyRtl(newLang);
    setLangState(newLang);
    setLangSelected(true);
  }, []);

  const tFn = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, langLoaded, langSelected, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
}

function applyRtl(lang: Lang) {
  const shouldBeRtl = lang === "ar";
  if (I18nManager.isRTL !== shouldBeRtl) {
    I18nManager.forceRTL(shouldBeRtl);
  }
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import type { Lang } from '../types';
import en from './en.json';
import he from './he.json';

const STORAGE_KEY = 'tk_lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'he' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return 'he';
}

export function applyDir(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources: { he: { translation: he }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'he',
  interpolation: { escapeValue: false },
});
applyDir(i18n.language as Lang);

i18n.on('languageChanged', (lng) => {
  applyDir(lng as Lang);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

/** t + השפה הנוכחית + החלפת שפה */
export function useLang() {
  const { t, i18n: inst } = useTranslation();
  const lang: Lang = inst.language === 'en' ? 'en' : 'he';
  return { t, lang, setLang: (l: Lang) => void inst.changeLanguage(l), isRtl: lang === 'he' };
}

export default i18n;

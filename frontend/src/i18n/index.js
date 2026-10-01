import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ku';
import 'dayjs/locale/ar-iq';
import ckb from './ckb.json';
import ar from './ar.json';

// Languages the UI supports. English strings are the translation keys, so anything
// missing from a dictionary simply shows in English.
export const LANGUAGES = {
  en:  { label: 'English', dir: 'ltr' },
  ckb: { label: 'کوردی',   dir: 'rtl' },
  ar:  { label: 'العربية', dir: 'rtl' },
};

// dayjs ships Sorani Kurdish month/day names as "ku" but prints Arabic-Indic digits.
// Keep Western digits so dates match every other number in the app, and put the day
// before the month ("30 ئەیلوول 2026") the way it is written in Kurdish.
const dayBeforeMonth = s => s.replace(/([^\d\s,]+(?: [^\d\s,]+)?) (\d{1,2})(?:, (\d{4}))?/, (_, month, day, year) => `${day} ${month}${year ? ` ${year}` : ''}`);
dayjs.Ls.ckb = { ...dayjs.Ls.ku, name: 'ckb', postformat: s => s, preparse: s => s };
// Arabic uses the Iraqi month names (كانون الثاني, شباط, آذار ...), again with Western digits
dayjs.Ls.ar = { ...dayjs.Ls['ar-iq'], name: 'ar', postformat: s => s, preparse: s => s };
// dayjs does not call a locale's postformat hook, so wrap format() for this locale
const baseFormat = dayjs.prototype.format;
dayjs.prototype.format = function (...args) {
  const out = baseFormat.apply(this, args);
  return ['ckb', 'ar'].includes(this.locale()) ? dayBeforeMonth(out) : out;
};

const stored = (() => { try { return localStorage.getItem('lang'); } catch { return null; } })();
const initial = stored in LANGUAGES ? stored : 'en';

function applyLanguage(lng) {
  const meta = LANGUAGES[lng] || LANGUAGES.en;
  dayjs.locale(lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = meta.dir;
  try { localStorage.setItem('lang', lng); } catch { /* storage unavailable */ }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: {} }, ckb: { translation: ckb }, ar: { translation: ar } },
  lng: initial,
  fallbackLng: 'en',
  keySeparator: false,   // keys are whole English sentences
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  saveMissing: true,
  saveMissingTo: 'current',
  // Dev aid: lets the crawler/console see which English strings have no Kurdish yet
  missingKeyHandler: (lngs, ns, key) => {
    const l = Array.isArray(lngs) ? lngs[0] : lngs;
    if (l !== 'en' && typeof window !== 'undefined') (window.__missingKeys ||= new Set()).add(key);
  },
});

i18n.on('languageChanged', applyLanguage);
applyLanguage(initial);

// Translate a string; passes numbers, undefined and already-rendered nodes through untouched.
export function useT() {
  const { t } = useTranslation();
  return useCallback((key, options) => (typeof key === 'string' ? t(key, options) : key), [t]);
}

export function useLanguage() {
  const { i18n: inst } = useTranslation();
  const lang = inst.language in LANGUAGES ? inst.language : 'en';
  return { lang, dir: LANGUAGES[lang].dir, setLang: l => inst.changeLanguage(l), isRtl: LANGUAGES[lang].dir === 'rtl' };
}

export default i18n;

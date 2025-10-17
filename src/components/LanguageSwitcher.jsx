import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const langs = [{ code: 'en', label: 'EN' }, { code: 'el', label: 'EL' }];

  const setLang = async (lng) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  return (
    <div className="flex gap-2">
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-3 py-1 rounded ${
            i18n.language === l.code ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

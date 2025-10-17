import { useEffect } from 'react';
import i18n from '../i18n';

export function useAutoLanguage() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/geo`, { credentials: 'omit' });
        const json = await res.json();
        const lang = (json?.suggestedLang || 'en').toLowerCase();
        const already = sessionStorage.getItem('app_lang');
        if (!already && mounted) {
          sessionStorage.setItem('app_lang', lang);
          await i18n.changeLanguage(lang);
        }
      } catch {
        // fallback: ignore
      }
    })();

    return () => { mounted = false; };
  }, []);
}

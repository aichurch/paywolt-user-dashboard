import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import elCommon from './locales/el/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      el: { common: elCommon },
    },
    lng: 'en',                 // default, θα γίνει auto-detect
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export default i18n;

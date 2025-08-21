import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './locales/en.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  it: { translation: it },
  es: { translation: es },
};

// Get device language based on platform
const getDeviceLanguage = () => {
  if (Platform.OS === 'web') {
    // For web, use browser language
    const browserLang = navigator.language.split('-')[0];
    return ['en', 'fr', 'it', 'es'].includes(browserLang) ? browserLang : 'en';
  } else {
    // For mobile, we would use react-native-localize but fallback to 'en' for now
    return 'en';
  }
};

// Language persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Get device language
      const deviceLanguage = getDeviceLanguage();
      callback(deviceLanguage);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('app_language', language);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper function to get country from language
export const getCountryFromLanguage = (language: string): string => {
  const countryMap: { [key: string]: string } = {
    'en': 'UK',
    'fr': 'FR',
    'it': 'IT',
    'es': 'ES',
  };
  return countryMap[language] || 'FR';
};

// Helper function to save selected country
export const saveSelectedCountry = async (country: string) => {
  try {
    await AsyncStorage.setItem('selected_country', country);
  } catch (error) {
    console.error('Failed to save country preference:', error);
  }
};

// Helper function to get selected country
export const getSelectedCountry = async (): Promise<string> => {
  try {
    const country = await AsyncStorage.getItem('selected_country');
    return country || getCountryFromLanguage(i18n.language);
  } catch (error) {
    return getCountryFromLanguage(i18n.language);
  }
};
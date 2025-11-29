import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar traduções
import en from './translations/en.json';
import de from './translations/de.json';
import es from './translations/es.json';
import pt from './translations/pt.json';

// Idioma padrão
const DEFAULT_LANGUAGE = 'pt';

// Função para obter idioma guardado
const getStoredLanguage = async (): Promise<string> => {
  try {
    const language = await AsyncStorage.getItem('language');
    return language || DEFAULT_LANGUAGE;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// Função para guardar idioma
export const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('language', language);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

// Configuração do i18next
i18n
  .use(initReactI18next)
  .init({
    // IMPORTANTE: compatibilityJSON v3 para React Native
    compatibilityJSON: 'v4',
    
    // Recursos de tradução
    resources: {
      en: { translation: en },
      de: { translation: de },
      es: { translation: es },
      pt: { translation: pt },
    },
    
    // Idioma inicial
    lng: DEFAULT_LANGUAGE,
    
    // Idioma de fallback
    fallbackLng: 'en',
    
    // Debug (desative em produção)
    debug: __DEV__,
    
    // Interpolação
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    
    // React specific
    react: {
      useSuspense: false, // Importante para React Native
    },
    
    // Cache
    cache: {
      enabled: true,
    },
  });

// Carregar idioma guardado ao inicializar
getStoredLanguage().then((language) => {
  if (language !== i18n.language) {
    i18n.changeLanguage(language);
  }
});

// Listener para mudanças de idioma (guardar automaticamente)
i18n.on('languageChanged', (lng) => {
  setStoredLanguage(lng);
});

export default i18n;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "Account Settings": "Account Settings",
      "Manage your profile, preferences, and premium subscription.": "Manage your profile, preferences, and premium subscription.",
      "Suggest a Feature": "Suggest a Feature",
      "Language": "Language",
      "Interface Language": "Interface Language",
      "English": "English",
      "Italiano": "Italiano",
      "Español": "Español",
      "Français": "Français",
      "Deutsch": "Deutsch"
    }
  },
  it: {
    translation: {
      "Account Settings": "Impostazioni Account",
      "Manage your profile, preferences, and premium subscription.": "Gestisci il tuo profilo, preferenze e l'abbonamento premium.",
      "Suggest a Feature": "Suggerisci una Funzione",
      "Language": "Lingua",
      "Interface Language": "Lingua dell'Interfaccia",
      "English": "English",
      "Italiano": "Italiano",
      "Español": "Español",
      "Français": "Français",
      "Deutsch": "Deutsch"
    }
  },
  es: {
    translation: {
      "Account Settings": "Configuración de Cuenta",
      "Manage your profile, preferences, and premium subscription.": "Gestiona tu perfil, preferencias y suscripción premium.",
      "Suggest a Feature": "Sugerir una Función",
      "Language": "Idioma",
      "Interface Language": "Idioma de la Interfaz",
      "English": "English",
      "Italiano": "Italiano",
      "Español": "Español",
      "Français": "Français",
      "Deutsch": "Deutsch"
    }
  },
  fr: {
    translation: {
      "Account Settings": "Paramètres du compte",
      "Manage your profile, preferences, and premium subscription.": "Gérez votre profil, vos préférences et votre abonnement premium.",
      "Suggest a Feature": "Suggérer une fonctionnalité",
      "Language": "Langue",
      "Interface Language": "Langue de l'interface",
      "English": "English",
      "Italiano": "Italiano",
      "Español": "Español",
      "Français": "Français",
      "Deutsch": "Deutsch"
    }
  },
  de: {
    translation: {
      "Account Settings": "Kontoeinstellungen",
      "Manage your profile, preferences, and premium subscription.": "Verwalten Sie Ihr Profil, Ihre Einstellungen und Ihr Premium-Abonnement.",
      "Suggest a Feature": "Eine Funktion vorschlagen",
      "Language": "Sprache",
      "Interface Language": "Sprache der Benutzeroberfläche",
      "English": "English",
      "Italiano": "Italiano",
      "Español": "Español",
      "Français": "Français",
      "Deutsch": "Deutsch"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('appLanguage') || "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;

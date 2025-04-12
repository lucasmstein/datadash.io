import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadLanguagePreference() {
      try {
        if (!user) return;

        // Get user's language preference from profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle missing profiles gracefully

        if (error) {
          console.error('Error fetching language preference:', error);
          return;
        }

        // If profile exists and has a language preference, use it
        if (profile && profile.language_preference) {
          i18n.changeLanguage(profile.language_preference);
        } else {
          // If no profile or no language preference, use browser language or fallback to 'en'
          const browserLang = navigator.language.split('-')[0];
          const supportedLangs = ['en', 'es', 'pt'];
          const defaultLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
          i18n.changeLanguage(defaultLang);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    }

    loadLanguagePreference();
  }, [user, i18n]);

  const updateLanguage = async (languageCode: string) => {
    try {
      if (!user) return;

      // Update language in database
      const { error } = await supabase.rpc(
        'update_language_preference',
        { 
          user_id: user.id,
          new_language: languageCode
        }
      );

      if (error) throw error;

      // Update i18n instance
      i18n.changeLanguage(languageCode);

      // Store in localStorage as fallback
      localStorage.setItem('preferredLanguage', languageCode);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  };

  return { updateLanguage };
}
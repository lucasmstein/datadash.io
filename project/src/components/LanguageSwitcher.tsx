import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { updateLanguage } = useLanguage();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateLanguage(languageCode);
    } catch (err: any) {
      setError(err.message);
      console.error('Error changing language:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <button 
        disabled={loading}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm">
          {languages.find(lang => lang.code === i18n.language)?.name}
        </span>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg py-1 hidden group-hover:block">
        {error && (
          <div className="px-4 py-2 text-sm text-red-500">
            {error}
          </div>
        )}
        
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            disabled={loading}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50 ${
              i18n.language === language.code ? 'text-blue-500' : 'text-gray-300'
            }`}
          >
            {language.name}
          </button>
        ))}
      </div>
    </div>
  );
}
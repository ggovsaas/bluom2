import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const applyTheme = (themeValue: Theme) => {
    const resolvedTheme = themeValue === 'system' ? getSystemTheme() : themeValue;
    setEffectiveTheme(resolvedTheme);

    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          theme_preference: newTheme,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  useEffect(() => {
    const initializeTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && profile?.theme_preference) {
          setThemeState(profile.theme_preference as Theme);
          applyTheme(profile.theme_preference as Theme);
        } else {
          const systemTheme = getSystemTheme();
          setThemeState('system');
          applyTheme('system');

          await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              theme_preference: 'system',
              updated_at: new Date().toISOString()
            });
        }
      } else {
        const systemTheme = getSystemTheme();
        setThemeState('system');
        applyTheme('system');
      }

      setIsLoading(false);
    };

    initializeTheme();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../utils/apiService';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext) || {};

export const SettingsProvider = ({ children }) => {
  const getStoredSettings = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('hcm_settings');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [settings, setSettings] = useState(() => {
    const stored = getStoredSettings();
    return stored || {
      defaultCurrency: 'USD',
      defaultPhoneCountry: '+1',
      dateFormat: 'DD/MM/YYYY',
      defaultTimezone: 'UTC-08:00 (Pacific Standard Time)',
      masterCurrency: 'USD ($) - US Dollar'
    };
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const { data } = await settingsAPI.getSettings();
      if (data?.data) {
        setSettings(prev => {
          const nextSettings = { ...prev, ...data.data };
          try {
            localStorage.setItem('hcm_settings', JSON.stringify(nextSettings));
          } catch {
            // Ignore localStorage errors
          }
          return nextSettings;
        });
      }
    } catch (error) {
      const fallback = getStoredSettings();
      if (fallback) {
        setSettings(fallback);
      }
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update in-memory state and optionally sync to backend
  // By default, syncBackend is false to prevent infinite loops from background refreshes
  const updateSettings = useCallback(async (newSettings, syncBackend = false) => {
    if (!newSettings) return;

    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('hcm_settings', JSON.stringify(merged));
      } catch {
        // Ignore localStorage errors
      }
      return merged;
    });

    if (syncBackend) {
      try {
        const { data } = await settingsAPI.updateSettings(newSettings);
        if (data?.data) {
          setSettings(prev => {
            const nextSettings = { ...prev, ...data.data };
            try {
              localStorage.setItem('hcm_settings', JSON.stringify(nextSettings));
            } catch {
              // Ignore localStorage errors
            }
            return nextSettings;
          });
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { message: data.message || 'Settings updated successfully.', type: 'success' } }));
        }
      } catch (error) {
        console.warn('Failed to sync settings to global endpoint:', error);
      }
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setSettings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

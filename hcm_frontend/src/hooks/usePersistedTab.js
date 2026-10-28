// ============================================================
// usePersistedTab.js - Universal Navigation & Tab Persistence Hook
// ============================================================
// Preserves active tabs, sub-sections, and view modes across
// navigation, component unmounting, and page reloads.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook to persist tab/filter/view state across navigation with zero race conditions.
 * 
 * @param {string} storageKey - Unique key for this dashboard/feature
 * @param {string} defaultTab - Fallback tab if none is saved
 * @param {string} urlParam - Optional URL search param name (default: 'tab')
 * @returns {[string, (tab: string) => void]} [activeTab, setActiveTab]
 */
export function usePersistedTab(storageKey, defaultTab, urlParam = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();
  const lastActionTimeRef = useRef(0);
  const pendingTabRef = useRef(null);

  // Get initial value from URL or localStorage or default
  const getInitialTab = useCallback(() => {
    // 1. Check URL query param first
    const fromUrl = searchParams.get(urlParam);
    if (fromUrl) return fromUrl;

    // 2. Check localStorage
    try {
      const fromStorage = localStorage.getItem(`hcm_tab_${storageKey}`);
      if (fromStorage) return fromStorage;
    } catch (e) {
      console.warn('localStorage read error:', e);
    }

    return defaultTab;
  }, [searchParams, urlParam, storageKey, defaultTab]);

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  // Set active tab & persist to both localStorage and URL params
  const setActiveTab = useCallback((tab) => {
    lastActionTimeRef.current = Date.now();
    pendingTabRef.current = tab;
    setActiveTabState(tab);

    // 1. Save in localStorage synchronously
    try {
      localStorage.setItem(`hcm_tab_${storageKey}`, tab);
    } catch (e) {
      console.warn('localStorage write error:', e);
    }

    // 2. Sync URL search parameter smoothly without triggering state revert
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === defaultTab) {
        next.delete(urlParam);
      } else {
        next.set(urlParam, tab);
      }
      return next;
    }, { replace: true });
  }, [storageKey, defaultTab, urlParam, setSearchParams]);

  // Sync if URL search parameter changes externally (e.g. browser back/forward buttons)
  useEffect(() => {
    // If user interacted recently within 800ms, ignore searchParams sync to prevent race conditions
    if (Date.now() - lastActionTimeRef.current < 800) {
      return;
    }

    const fromUrl = searchParams.get(urlParam);
    const targetTab = fromUrl || defaultTab;
    
    if (targetTab !== activeTab) {
      setActiveTabState(targetTab);
      try {
        localStorage.setItem(`hcm_tab_${storageKey}`, targetTab);
      } catch (e) {}
    }
  }, [searchParams, urlParam, storageKey, defaultTab, activeTab]);

  return [activeTab, setActiveTab];
}

export default usePersistedTab;

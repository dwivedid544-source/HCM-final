// ============================================================
// useAuth.jsx - Real JWT Authentication Hook
// ============================================================
// PEHLE: Mock login - localStorage mein fake user save karta tha
// AB:    Real login - Backend API call karta hai, JWT token save karta hai

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/apiService';

const AuthContext = createContext();

// Role → Dashboard URL mapping
const ROLE_ROUTES = {
  SUPERADMIN: '/superadmin/dashboard',
  ADMIN: '/admin/dashboard',
  HR: '/hr/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard',
  CANDIDATE: '/candidate/dashboard',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [previewRole, setPreviewRole] = useState(null);
  const navigate = useNavigate();

  // ── Token refresh - /auth/me se fresh data lo ──
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      const freshUser = response.data?.data || response.data;
      if (!freshUser) return null;

      setUser(prev => {
        const merged = { 
          ...prev, 
          ...freshUser,
          name: freshUser.name || freshUser.fullName || freshUser.employeeProfile?.fullName || prev?.name,
          fullName: freshUser.fullName || freshUser.name || freshUser.employeeProfile?.fullName || prev?.fullName,
          avatar: freshUser.avatar || freshUser.avatarUrl || freshUser.employeeProfile?.avatarUrl || prev?.avatar,
          avatarUrl: freshUser.avatarUrl || freshUser.avatar || freshUser.employeeProfile?.avatarUrl || prev?.avatarUrl,
          organization: freshUser.organization || prev?.organization
        };
        sessionStorage.setItem('hcm_user', JSON.stringify(merged));
        localStorage.setItem('hcm_user', JSON.stringify(merged));

        if (merged.organization?.name) {
          const orgData = {
            companyName: merged.organization.name,
            name: merged.organization.name,
            logo: merged.organization.logoUrl || null,
            logoUrl: merged.organization.logoUrl || null
          };
          sessionStorage.setItem('hcm_org_config', JSON.stringify(orgData));
          localStorage.setItem('hcm_org_config', JSON.stringify(orgData));
        }

        return merged;
      });
      return freshUser;
    } catch (err) {
      console.warn('refreshUser failed:', err.message);
    }
  };

  // ── App load hone par check karo ki is tab mein session saved hai ya nahi ──
  useEffect(() => {
    // Each tab maintains its independent session in sessionStorage
    const token = sessionStorage.getItem('hcm_token');
    const savedUser = sessionStorage.getItem('hcm_user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        refreshUser();
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    const storedPreview = sessionStorage.getItem('hcm_preview_role');
    if (storedPreview) setPreviewRole(storedPreview);

    const handleUnauthorized = () => {
      setUser(null);
      setPreviewRole(null);
      sessionStorage.clear();
      localStorage.removeItem('hcm_token');
      localStorage.removeItem('hcm_user');
      navigate('/login', { replace: true });
    };
    window.addEventListener('hcm_unauthorized', handleUnauthorized);

    setLoading(false);
    return () => {
      window.removeEventListener('hcm_unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  // ── REAL LOGIN: Backend API call ──
  const login = async (email, password) => {
    try {
      setAuthError(null);

      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data.data;

      // Clear stale session data for this tab
      sessionStorage.removeItem('hcm_preview_role');
      sessionStorage.removeItem('hcm_current_scope');
      sessionStorage.removeItem('logout_reason');

      if (userData.organization?.name) {
        const orgData = {
          companyName: userData.organization.name,
          name: userData.organization.name,
          logo: userData.organization.logoUrl || null,
          logoUrl: userData.organization.logoUrl || null
        };
        sessionStorage.setItem('hcm_org_config', JSON.stringify(orgData));
        localStorage.setItem('hcm_org_config', JSON.stringify(orgData));
      }

      // Save to this tab's sessionStorage and localStorage for seamless sync
      sessionStorage.setItem('hcm_token', token);
      sessionStorage.setItem('hcm_user', JSON.stringify(userData));
      localStorage.setItem('hcm_token', token);
      localStorage.setItem('hcm_user', JSON.stringify(userData));
      setUser(userData);

      // Only use landingPage if it is a valid absolute path (starts with /)
      const safeLandingPage = userData.landingPage?.startsWith('/') ? userData.landingPage : null;
      const normalizedRole = userData.role?.toUpperCase();
      const route = safeLandingPage || ROLE_ROUTES[normalizedRole] || '/employee/dashboard';
      navigate(route);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // ── LOGOUT ──
  const logout = (reason = null) => {
    setUser(null);
    setPreviewRole(null);
    // Clear this tab's session and localStorage
    sessionStorage.removeItem('hcm_token');
    sessionStorage.removeItem('hcm_user');
    sessionStorage.removeItem('hcm_preview_role');
    sessionStorage.removeItem('hcm_current_scope');
    sessionStorage.removeItem('hcm_scope_role');
    localStorage.removeItem('hcm_token');
    localStorage.removeItem('hcm_user');
    sessionStorage.setItem('logged_out', 'true');
    if (reason) {
      sessionStorage.setItem('logout_reason', reason);
      navigate(`/login?reason=${reason}`);
    } else {
      sessionStorage.removeItem('logout_reason');
      navigate('/login');
    }
  };

  // ── PREVIEW MODE (SuperAdmin kisi aur role ka dashboard preview kare) ──
  const enterPreview = (role) => {
    setPreviewRole(role);
    sessionStorage.setItem('hcm_preview_role', role);
    navigate(ROLE_ROUTES[role.toUpperCase()] || '/employee/dashboard');
  };

  const exitPreview = () => {
    setPreviewRole(null);
    sessionStorage.removeItem('hcm_preview_role');
    const rawRoute = user?.role ? ROLE_ROUTES[user.role] : null;
    navigate(rawRoute || '/login');
  };

  const effectiveRole = previewRole?.toUpperCase() || user?.role;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      setAuthError,
      previewRole,
      effectiveRole,
      login,
      logout,
      enterPreview,
      exitPreview,
      refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || {
    user: null,
    loading: false,
    authError: null,
    previewRole: null,
    effectiveRole: null,
    login: async () => {},
    logout: () => {},
    enterPreview: () => {},
    exitPreview: () => {},
    refreshUser: async () => null,
    isAuthenticated: false,
    setAuthError: () => {}
  };
};

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissionContext } from './PermissionContext';

const ScopeContext = createContext();

const ROLE_ALLOWED_SCOPES = {
  superadmin: ['superadmin', 'admin', 'hr', 'manager', 'employee', 'candidate'],
  admin: ['admin', 'hr', 'manager', 'employee'],
  hr: ['hr'],
  manager: ['manager'],
  employee: ['employee'],
  candidate: ['candidate'],
};

export const ScopeProvider = ({ children }) => {
  const { isAuthenticated, effectiveRole, user } = useAuth();
  const { roleKey, isSuperAdmin, loading: permLoading } = usePermissionContext();
  
  const [currentScope, setCurrentScope] = useState(null);
  
  // Resolve base functional scope from permission or auth
  const resolvedRoleKey = isSuperAdmin ? 'superadmin' : (roleKey || effectiveRole?.toLowerCase() || 'employee');
  
  const allowedScopes = useMemo(() => {
    return ROLE_ALLOWED_SCOPES[resolvedRoleKey] || [resolvedRoleKey];
  }, [resolvedRoleKey]);

  useEffect(() => {
    if (!isAuthenticated || permLoading) return;

    const savedScope = sessionStorage.getItem('hcm_current_scope');
    const savedScopeRole = sessionStorage.getItem('hcm_scope_role'); // track which role set this scope
    const currentUserRole = resolvedRoleKey;

    // If the saved scope was set by a DIFFERENT role (e.g., a previous employee login),
    // discard it and always default to the user's own functional scope.
    const isScopeStaleDueToRoleChange = savedScopeRole && savedScopeRole !== currentUserRole;

    if (savedScope && !isScopeStaleDueToRoleChange && allowedScopes.includes(savedScope)) {
      setCurrentScope(savedScope);
    } else {
      // Default to the user's own role scope
      setCurrentScope(currentUserRole);
      sessionStorage.setItem('hcm_current_scope', currentUserRole);
      sessionStorage.setItem('hcm_scope_role', currentUserRole);
    }
  }, [isAuthenticated, permLoading, resolvedRoleKey, allowedScopes]);
  
  const switchScope = (newScope) => {
    if (allowedScopes.includes(newScope)) {
      setCurrentScope(newScope);
      sessionStorage.setItem('hcm_current_scope', newScope);
      sessionStorage.setItem('hcm_scope_role', resolvedRoleKey);
    }
  };
  
  const canSwitchScope = allowedScopes.length > 1;

  const activeScope = (currentScope && allowedScopes.includes(currentScope)) 
    ? currentScope 
    : resolvedRoleKey;

  return (
    <ScopeContext.Provider value={{ 
      currentScope: activeScope, 
      switchScope,
      baseFunctionalScope: resolvedRoleKey,
      canSwitchScope,
      allowedScopes
    }}>
      {children}
    </ScopeContext.Provider>
  );
};

export const useScope = () => useContext(ScopeContext);

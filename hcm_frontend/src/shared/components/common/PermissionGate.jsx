import React from 'react';
import { usePermission } from '../../../hooks/usePermission';

/**
 * A wrapper component that conditionally renders its children based on permissions.
 *
 * @param {string} module - The module to check (e.g. 'users')
 * @param {string} action - The action required (e.g. 'create', 'edit', 'delete')
 * @param {ReactNode} children - The element to render if permitted
 * @param {ReactNode} fallback - Optional element to render if denied
 */
const PermissionGate = ({ module, action = 'view', children, fallback = null }) => {
  const { check, loading } = usePermission(module);

  // If user already has permission (e.g. during background sync), render immediately
  if (check(action)) {
    return <>{children}</>;
  }

  // While initial loading permissions, don't render to prevent UI flicker
  if (loading) return null;

  return fallback ? <>{fallback}</> : null;
};

export default PermissionGate;

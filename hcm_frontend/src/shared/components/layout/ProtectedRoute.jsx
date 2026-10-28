import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionContext } from '../../../context/PermissionContext';
import { getFirstAccessibleRoute, PATH_TO_MODULE } from '../../../utils/permissionUtils';
import AccessDenied from '../common/AccessDenied';
import PlanRestricted from '../common/PlanRestricted';
import { Loader2 } from 'lucide-react';
import { useScope } from '../../../context/ScopeContext';
import { useAuth } from '../../../hooks/useAuth';

const MODULE_TO_FEATURE_MAP = {
  payroll: 'payroll_operations',
  payroll_center: 'payroll_operations',
  payroll_operations: 'payroll_operations',
  attendance: 'attendance_leave',
  attendance_review: 'attendance_leave',
  leave: 'attendance_leave',
  leave_approval: 'attendance_leave',
  shift_management: 'shifts_calendars',
  overtime_rules: 'shifts_calendars',
  holidays: 'shifts_calendars',
  benefits: 'benefits_insurance',
  benefits_config: 'benefits_insurance',
  job_posts: 'recruitment_pipeline',
  candidates: 'recruitment_pipeline',
  interviews: 'recruitment_pipeline',
  hiring_pipeline: 'recruitment_pipeline',
  offer_management: 'recruitment_pipeline',
  ai_score: 'ai_resume_scoring',
  performance: 'performance_kpi',
  kpi_tracking: 'performance_kpi',
  reviews: 'performance_kpi',
  approval_workflows: 'approval_workflows',
  documents: 'documents_vault',
  help_desk: 'support_tickets',
  offboarding_resignations: 'offboarding_exit',
  resignations: 'offboarding_exit',
  team_resignations: 'offboarding_exit',
  resignation: 'offboarding_exit',
  reports: 'advanced_reports',
  audit_logs: 'audit_compliance',
  compliance: 'audit_compliance',
  backup: 'backup_center',
};

/**
 * Route guard that ensures the user has permission and subscription plan entitlement.
 */
const ProtectedRoute = ({ children, customModule = null, requiredFeature = null }) => {
  const { permissions, loading, isSuperAdmin, roleKey, hasModuleAccess, hasEntitlement } = usePermissionContext();
  const { currentScope, switchScope, allowedScopes, baseFunctionalScope } = useScope();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  // Wait for both auth and permissions to load
  if (loading || authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // --- Scope Guard ---
  // Ensure the user does not manually visit a URL outside their currently selected Scope.
  const segments = location.pathname.split('/').filter(Boolean);
  const pathScope = segments[0]?.toLowerCase();
  const validScopes = ['superadmin', 'admin', 'hr', 'manager', 'employee', 'candidate'];

  if (permissions && validScopes.includes(pathScope) && pathScope !== currentScope) {
    if (allowedScopes && allowedScopes.includes(pathScope)) {
      switchScope(pathScope);
    } else {
      const targetScope = (allowedScopes && allowedScopes.includes(currentScope)) ? currentScope : baseFunctionalScope;
      return <Navigate to={`/${targetScope}/dashboard`} replace />;
    }
  }

  // Determine which module this path requires
  let moduleToCheck = customModule;
  if (!moduleToCheck) {
    moduleToCheck = PATH_TO_MODULE[location.pathname];
  }
  
  if (!moduleToCheck) {
    // Try to match base path (e.g. /admin/users/123 -> /admin/users)
    if (segments.length >= 2) {
      const basePath = `/${segments[0]}/${segments[1]}`;
      moduleToCheck = PATH_TO_MODULE[basePath];
    }
  }

  // 1. Subscription Plan Feature Entitlement Check (bypassed for SuperAdmin)
  if (!isSuperAdmin) {
    const featureToCheck = requiredFeature || MODULE_TO_FEATURE_MAP[moduleToCheck] || (location.pathname.includes('/backup') ? 'backup_center' : null);
    if (featureToCheck && !hasEntitlement(featureToCheck)) {
      return <PlanRestricted moduleName={moduleToCheck} featureId={featureToCheck} />;
    }
  }

  // If we couldn't infer the module, allow access
  if (!moduleToCheck) {
    return <>{children}</>;
  }

  // ── SPECIAL CASE: 'dashboard' module is always accessible for any authenticated user ──
  if (moduleToCheck === 'dashboard') {
    return <>{children}</>;
  }

  // If permissions haven't loaded yet (null), allow access rather than flash Access Denied
  if (permissions === null) {
    return <>{children}</>;
  }

  // Check role-based access
  if (hasModuleAccess(moduleToCheck, currentScope)) {
    return <>{children}</>;
  }

  // Access Denied handling:
  const isDashboard = location.pathname.endsWith('/dashboard');
  
  if (isDashboard) {
    const firstRoute = getFirstAccessibleRoute(roleKey, permissions, isSuperAdmin);
    if (firstRoute && firstRoute !== location.pathname) {
      return <Navigate to={firstRoute} replace />;
    }
  }

  // Otherwise, render 403 page
  return <AccessDenied />;
};

export default ProtectedRoute;

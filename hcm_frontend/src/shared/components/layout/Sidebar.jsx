import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissionContext } from '../../../context/PermissionContext';
import { useScope } from '../../../context/ScopeContext';
import { sidebarConfig } from '../../../data/sidebarConfig';
import { cn } from '../../../utils/cn';
import { adminAPI } from '../../../utils/apiService';

const GroupTitle = ({ title, isExpanded }) => {
  if (!isExpanded) return <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-2" />;
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {title}
    </h3>
  );
};

const MenuItem = ({ item, isExpanded, activeItemRef, onItemClick, isCurrentActive }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path !== '/'}
      ref={isCurrentActive ? activeItemRef : null}
      onClick={(e) => {
        if (onItemClick) onItemClick(e);
      }}
      className={({ isActive }) =>
        cn(
          "sidebar-item group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 select-none cursor-pointer text-sm font-medium",
          isCurrentActive
            ? "sidebar-item-active"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-primary-600 dark:hover:text-primary-400",
          !isExpanded && "justify-center px-2 py-2.5"
        )
      }
    >
      <Icon 
        size={19} 
        className={cn(
          "shrink-0 transition-colors duration-150", 
          isCurrentActive ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        )} 
      />
      {isExpanded && (
        <span className="truncate flex-1 text-left tracking-tight">
          {item.label}
        </span>
      )}

      {isExpanded && isCurrentActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400 shrink-0 ml-auto" />
      )}

      {!isExpanded && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-xl border border-slate-700">
          {item.label}
        </div>
      )}
    </NavLink>
  );
};

const PERM_TO_FEATURE_MAP = {
  // Payroll
  payroll: 'payroll_operations',
  payroll_center: 'payroll_operations',
  payroll_operations: 'payroll_operations',
  // Attendance & Leaves
  attendance: 'attendance_leave',
  attendance_review: 'attendance_leave',
  leave: 'attendance_leave',
  leave_approval: 'attendance_leave',
  // Shifts & Work Calendars
  shift_management: 'shifts_calendars',
  overtime_rules: 'shifts_calendars',
  holidays: 'shifts_calendars',
  // Benefits
  benefits: 'benefits_insurance',
  benefits_config: 'benefits_insurance',
  // Recruitment
  job_posts: 'recruitment_pipeline',
  candidates: 'recruitment_pipeline',
  interviews: 'recruitment_pipeline',
  hiring_pipeline: 'recruitment_pipeline',
  offer_management: 'recruitment_pipeline',
  // AI
  ai_score: 'ai_resume_scoring',
  // Performance
  performance: 'performance_kpi',
  kpi_tracking: 'performance_kpi',
  reviews: 'performance_kpi',
  // Approvals
  approval_workflows: 'approval_workflows',
  // Documents
  documents: 'documents_vault',
  // Offboarding
  offboarding_resignations: 'offboarding_exit',
  resignations: 'offboarding_exit',
  team_resignations: 'offboarding_exit',
  resignation: 'offboarding_exit',
  // Reports
  reports: 'advanced_reports',
  // Security & Audit
  audit_logs: 'audit_compliance',
  compliance: 'audit_compliance',
  // Backups
  backup: 'backup_center',
};

const Sidebar = ({ collapsed, setCollapsed, allRoles, onItemClick, isMobile = false, className }) => {
  const { logout, effectiveRole, user } = useAuth();
  const { hasModuleAccess, roleName, hasEntitlement } = usePermissionContext();
  const location = useLocation();
  const isExpanded = !collapsed;

  const navContainerRef = useRef(null);
  const activeItemRef = useRef(null);

  const isSuperAdmin = effectiveRole?.toLowerCase() === 'superadmin';

  const { currentScope, baseFunctionalScope } = useScope();
  const baseItems = sidebarConfig[currentScope] || sidebarConfig.employee || [];

  const [expandedGroups, setExpandedGroups] = useState({
    'Super Admin': true,
    'Admin Modules': false,
    'HR Modules': false,
    'Manager Modules': false,
    'Employee Modules': false,
    'Candidate Modules': false,
    'Additional Modules': true,
  });

  const isSuperAdminScope = isSuperAdmin || currentScope === 'superadmin';

  const [orgBrand, setOrgBrand] = useState(() => {
    if (isSuperAdminScope) {
      return { logo: null, name: 'HCM Platform' };
    }
    if (user?.organization?.name) {
      return {
        logo: user.organization.logoUrl || null,
        name: user.organization.name
      };
    }
    try {
      const cached = sessionStorage.getItem('hcm_org_config') || localStorage.getItem('hcm_org_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          logo: parsed.logo || parsed.logoUrl || null,
          name: parsed.companyName || parsed.name || 'HCM.ai'
        };
      }
    } catch (err) {
      void err;
    }
    return { logo: null, name: 'HCM.ai' };
  });

  useEffect(() => {
    let isMounted = true;
    const roleUpper = (effectiveRole || user?.role || '').toUpperCase();
    const isSuperAdminUser = roleUpper === 'SUPERADMIN' || currentScope === 'superadmin';

    // SuperAdmin is a separate SaaS platform entity and does not inherit tenant brand
    if (isSuperAdminUser) {
      setOrgBrand({ logo: null, name: 'HCM Platform' });
      return;
    }

    // Direct company from user payload (works for ALL roles: Admin, HR, Manager, Employee, Candidate)
    if (user?.organization?.name) {
      setOrgBrand({
        logo: user.organization.logoUrl || null,
        name: user.organization.name
      });
    }

    const canFetchAdminOrg = ['ADMIN', 'HR'].includes(roleUpper) || ['admin', 'hr'].includes(currentScope);

    const fetchOrg = async () => {
      if (!canFetchAdminOrg) return;
      try {
        const res = await adminAPI.getOrganization();
        const org = res.data?.data;
        if (org && isMounted) {
          setOrgBrand({
            logo: org.logoUrl || null,
            name: org.name || 'HCM.ai'
          });
          const orgData = {
            companyName: org.name,
            name: org.name,
            logoUrl: org.logoUrl || null,
            logo: org.logoUrl || null
          };
          sessionStorage.setItem('hcm_org_config', JSON.stringify(orgData));
          localStorage.setItem('hcm_org_config', JSON.stringify(orgData));
        }
      } catch (e) {
        // Fallback to cache or defaults
      }
    };

    if (canFetchAdminOrg) {
      fetchOrg();
    }

    const handleSync = (e) => {
      if (isSuperAdminUser) return;
      try {
        if (e && e.detail) {
          if (e.detail.logoUrl !== undefined || e.detail.logo !== undefined) {
            const logo = e.detail.logoUrl || e.detail.logo || null;
            const name = e.detail.name || e.detail.companyName || undefined;
            setOrgBrand(prev => ({
              logo,
              name: name || prev.name
            }));
            return;
          }
        }
        const cached = sessionStorage.getItem('hcm_org_config') || localStorage.getItem('hcm_org_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          setOrgBrand({
            logo: parsed.logo || parsed.logoUrl || null,
            name: parsed.companyName || parsed.name || 'HCM.ai'
          });
        } else if (canFetchAdminOrg) {
          fetchOrg();
        }
      } catch {
        if (canFetchAdminOrg) {
          fetchOrg();
        }
      }
    };

    window.addEventListener('hcm_global_sync', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('hcm_global_sync', handleSync);
    };
  }, [effectiveRole, user?.role, user?.organization, currentScope]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isItemPermitted = (item) => {
    // 1. Subscription Plan Feature Entitlement Check
    const path = item.path || '';
    const featureId = item.feature || PERM_TO_FEATURE_MAP[item.permission] || (path.includes('/backup') ? 'backup_center' : null);
    if (featureId && !hasEntitlement(featureId)) {
      return false;
    }

    // 2. Self-service modules in employee workspace are always accessible
    if (currentScope === 'employee') {
      return true;
    }

    // 3. Custom Role Permission Check
    const permKey = item.permission;
    if (!permKey || permKey === 'always') return true;
    return hasModuleAccess(permKey, currentScope);
  };

  let roleItems = baseItems;

  // Filter sidebar items by feature entitlements and permissions, except for SuperAdmin.
  if (!isSuperAdmin) {
    roleItems = baseItems.map(item => {
      if (item.group && item.items) {
        const filteredSubItems = item.items.filter(sub => isItemPermitted(sub));
        return { ...item, items: filteredSubItems };
      } else {
        return isItemPermitted(item) ? item : null;
      }
    }).filter(item => {
      if (!item) return false;
      if (item.group && item.items && item.items.length === 0) return false;
      return true;
    });
  }

  // Calculate the single exact active path for the menu to prevent multiple item highlights
  const activePath = React.useMemo(() => {
    const allFlattenedItems = [];
    roleItems.forEach(item => {
      if (item.items) allFlattenedItems.push(...item.items);
      else if (item.path) allFlattenedItems.push(item);
    });
    
    // 1. Exact match has highest priority
    const exact = allFlattenedItems.find(it => it.path === location.pathname);
    if (exact) return exact.path;
    
    // 2. Fallback for nested subpaths: find longest matching path prefix
    const matches = allFlattenedItems.filter(it => 
      it.path && it.path !== '/' && location.pathname.startsWith(it.path + '/')
    );
    if (matches.length > 0) {
      matches.sort((a, b) => b.path.length - a.path.length);
      return matches[0].path;
    }
    return location.pathname;
  }, [roleItems, location.pathname]);

  // Auto-expand group of current active path
  useEffect(() => {
    let activeGroup = null;
    roleItems.forEach(item => {
      if (item.group && item.items) {
        const hasActiveChild = item.items.some(subItem => subItem.path === activePath);
        if (hasActiveChild) {
          activeGroup = item.group;
        }
      }
    });

    if (activeGroup) {
      setExpandedGroups(prev => ({
        ...prev,
        [activeGroup]: true
      }));
    }
  }, [activePath, roleItems]);

  // After route change, smoothly ensure active item is visible in viewport only if out of bounds
  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const activeEl = activeItemRef.current || container.querySelector('.sidebar-item-active');
      if (!activeEl) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const isAbove = activeRect.top < containerRect.top;
      const isBelow = activeRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Compute active item information for Scope Indicator
  const getActiveItemInfo = () => {
    let activeLabel = '';
    let activeGroupLabel = '';

    roleItems.forEach(item => {
      if (item.group && item.items) {
        item.items.forEach(subItem => {
          if (location.pathname === subItem.path || (subItem.path !== '/' && location.pathname.startsWith(subItem.path + '/'))) {
            activeLabel = subItem.label;
            activeGroupLabel = item.group;
          }
        });
      } else if (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))) {
        activeLabel = item.label;
      }
    });

    return { activeLabel, activeGroupLabel };
  };

  const { activeLabel, activeGroupLabel } = getActiveItemInfo();

  return (
    <aside
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col select-none",
        isMobile
          ? "relative h-full w-full shadow-2xl"
          : "fixed left-0 top-0 h-screen z-[60] shadow-sm transition-all duration-200 ease-in-out",
        !isMobile && (isExpanded ? "w-64" : "w-20"),
        className
      )}
    >
      {/* Logo Section */}
      <div className={cn("px-5 py-4 flex items-center gap-3 shrink-0 border-b border-slate-100 dark:border-slate-800/60", !isExpanded ? "justify-center" : "justify-start")}>
        {isSuperAdminScope ? (
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 text-white font-black text-sm tracking-wider">
            HCM
          </div>
        ) : orgBrand.logo ? (
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm p-1 overflow-hidden">
            <img 
              src={orgBrand.logo} 
              alt={orgBrand.name}onError={() => setOrgBrand(prev => ({ ...prev, logo: null }))}
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20 text-white">
            <Building2 size={20} />
          </div>
        )}
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}title={isSuperAdminScope ? 'HCM Platform' : orgBrand.name}
          >
            {isSuperAdminScope ? 'HCM Platform' : (orgBrand.name || 'HCM.ai')}
          </motion.span>
        )}
      </div>

      {/* Dynamic Scope & Module Indicator */}
      {isExpanded && (
        <div className="mx-3 mt-3 mb-1 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-left shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current Scope</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>

          <div className="flex items-center gap-1.5 mt-1">
             <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize truncate">
                {currentScope === baseFunctionalScope ? (roleName || currentScope) : currentScope} Console
             </h4>
          </div>
          {activeLabel && (
            <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mt-0.5 truncate">
              {activeGroupLabel && `${activeGroupLabel} • `}{activeLabel}
            </p>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div ref={navContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {roleItems.map((item, index) => {
          if (item.group) {
            const isGroupExpanded = expandedGroups[item.group] ?? true;
            return (
              <div key={index}>
                <div
                  onClick={() => isExpanded && toggleGroup(item.group)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer select-none group/title transition-all duration-150 mt-3 first:mt-0",
                    !isExpanded ? "hidden" : "cursor-pointer"
                  )}
                >
                  <GroupTitle title={item.group} isExpanded={isExpanded} />
                  {isExpanded && (
                    <ChevronDown
                      size={14}
                      className={cn(
                        "text-slate-400 group-hover/title:text-slate-600 dark:group-hover/title:text-slate-300 transition-transform duration-200",
                        isGroupExpanded ? "transform rotate-0" : "transform -rotate-90"
                      )}
                    />
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {(isGroupExpanded || !isExpanded) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}>
                      {item.items.map((subItem, idx) => (
                        <MenuItem 
                          key={idx} 
                          item={subItem} 
                          isExpanded={isExpanded} 
                          activeItemRef={activeItemRef} 
                          isCurrentActive={activePath === subItem.path}
                          onItemClick={onItemClick} 
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <MenuItem 
              key={index} 
              item={item} 
              isExpanded={isExpanded} 
              activeItemRef={activeItemRef} 
              isCurrentActive={activePath === item.path}
              onItemClick={onItemClick} 
            />
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className={cn(
          "flex items-center gap-2",
          !isExpanded ? "justify-center" : "justify-between"
        )}>
          {isExpanded && (
            <div className="flex-1 min-w-0 text-left pr-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Signed in as</p>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase truncate">
                {effectiveRole || user?.role || 'User'}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title="Sign out of account"
            aria-label="Logout"
            className={cn(
              "relative shrink-0 flex items-center justify-center transition-all cursor-pointer rounded-xl font-bold shadow-xs active:scale-95",
              "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white hover:border-rose-600",
              isExpanded ? "gap-2 px-3.5 py-2 text-xs" : "p-2.5"
            )}
          >
            <LogOut size={18} />
            {isExpanded && <span>Logout</span>}
            {!isExpanded && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-xl">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-2 w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[36px]"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

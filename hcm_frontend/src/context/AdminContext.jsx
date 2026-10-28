// ============================================================
// AdminContext.jsx - Real API Integration & Demo Fallback
// ============================================================
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { applyTranslation } from '../utils/translationHelper';
import api, { adminAPI, settingsAPI, hrAPI } from '../utils/apiService';
import { useCurrency } from '../hooks/useCurrency';

const AdminContext = createContext();

export const useAdmin = () => {
  const { formatCurrency, getSymbol, getIcon, masterCurrency } = useCurrency();

  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children, user }) => {
  const { getSymbol } = useCurrency();
  // --- PERSISTENCE HELPERS ---
  const loadInitialData = (key, defaultData) => {
    const saved = localStorage.getItem(`hcm_admin_${key}`);
    return saved ? JSON.parse(saved) : defaultData;
  };

  const usePersistedState = (key, defaultData) => {
    const [state, setState] = useState(() => loadInitialData(key, defaultData));
    useEffect(() => {
      localStorage.setItem(`hcm_admin_${key}`, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
  };

  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ACTIONS ---
  const showToast = useCallback((message, type = 'success') => {
    const safeMessage = typeof message === 'object' && message !== null ? (message.message || JSON.stringify(message)) : String(message || '');
    if (!safeMessage) return;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      // Prevent duplicate identical toasts from piling up
      if (prev.some(t => t.message === safeMessage && t.type === type)) {
        return prev;
      }
      // Keep at most 1 previous active toast
      const trimmed = prev.slice(-1);
      return [...trimmed, { id, message: safeMessage, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    const handleAppToast = (e) => {
      if (e.detail) {
        showToast(e.detail.message, e.detail.type);
      }
    };
    window.addEventListener('app_toast', handleAppToast);
    return () => {
      window.removeEventListener('app_toast', handleAppToast);
    };
  }, [showToast]);

  // --- STATE FOR API MIGRATED RESOURCES ---
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [orgChartData, setOrgChartData] = useState(null);
  const [payrollList, setPayrollList] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleHistory, setRoleHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [overtimePolicies, setOvertimePolicies] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [aiModules, setAiModules] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [incrementRequests, setIncrementRequests] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [deductionRules, setDeductionRules] = useState([]);

  // --- FETCH FUNCTIONS ---
  const fetchPayrollConfig = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const [compRes, dedRes] = await Promise.all([
        adminAPI.getSalaryComponents(),
        adminAPI.getDeductions()
      ]);
      setSalaryComponents(compRes.data || []);
      setDeductionRules(dedRes.data || []);
    } catch (e) {
      console.error('Failed to fetch payroll config:', e);
    }
  }, []);
  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminAPI.getAllUsers();
      const roleMap = {
        'SUPERADMIN': 'Super Admin',
        'ADMIN': 'Admin',
        'HR': 'HR Manager',
        'MANAGER': 'Manager',
        'EMPLOYEE': 'Employee',
        'CANDIDATE': 'Candidate'
      };
      const mapped = (res.data.data || []).map(u => {
        const isCandidate = u.role === 'CANDIDATE' || u.role === 'Candidate';
        const fullName = u.employeeProfile?.fullName || u.candidateProfile?.fullName || u.email.split('@')[0] || 'System User';
        return {
          ...u,
          name: fullName,
          role: roleMap[u.role] || u.role,
          department: u.employeeProfile?.department?.name || (isCandidate ? 'Talent Acquisition' : 'None'),
          status: (u.employeeProfile?.lifecycleStatus === 'RESIGNED' || u.employeeProfile?.lifecycleStatus === 'TERMINATED') 
                  ? (u.employeeProfile.lifecycleStatus === 'RESIGNED' ? 'Resigned' : 'Terminated')
                  : (u.status || (u.isActive ? 'Active' : 'Inactive')),
          empId: u.employeeProfile?.employeeId || (isCandidate ? 'CAND-' + u.id.slice(0, 3).toUpperCase() : 'EMP-' + u.id.slice(0, 3).toUpperCase()),
          profileId: u.employeeProfile?.id || u.candidateProfile?.id,
          phone: u.employeeProfile?.phone || u.candidateProfile?.phone || '',
          joinDate: u.employeeProfile?.joiningDate?.split('T')[0] || u.createdAt?.split('T')[0] || '',
          empType: u.employeeProfile?.employmentType || (isCandidate ? 'Candidate' : 'Full-time'),
          manager: u.employeeProfile?.manager?.fullName || 'None',
          lastLogin: u.lastLoginAt 
            ? new Date(u.lastLoginAt).toLocaleDateString() + ' ' + new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : u.updatedAt 
            ? new Date(u.updatedAt).toLocaleDateString() + ' ' + new Date(u.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Never',
          img: u.employeeProfile?.avatarUrl || u.candidateProfile?.avatarUrl || '',
          baseSalary: u.employeeProfile?.compensationProfile?.baseSalary || u.employeeProfile?.baseSalary || u.baseSalary || 0,
          monthlyCTC: u.employeeProfile?.compensationProfile?.monthlyCTC || u.employeeProfile?.monthlyCTC || u.monthlyCTC || 0,
          salaryType: u.employeeProfile?.salaryType || 'Monthly',
          hourlyRate: u.employeeProfile?.hourlyRate || '',
          shiftId: u.employeeProfile?.shiftId || '',
          overtimePolicyId: u.employeeProfile?.overtimePolicyId || ''
        };
      });
      setUsers(mapped);
    } catch (err) {
      console.error(err);
      setUsers([]);
      showToast('Failed to load users from server', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const mapDepartment = (d) => ({
    id: d.id,
    name: d.name,
    code: d.code || (d.name ? d.name.slice(0, 3).toUpperCase() : 'GEN'),
    head: d.head && d.head !== 'None' ? d.head : '',
    parent: d.parent || d.parentDept?.name || 'Corporate',
    parentId: d.parentId || null,
    description: d.description || '',
    color: d.color || '#4f46e5',
    status: d.status || 'Active',
    employees: d._count?.employees ?? d.employees ?? 0,
    subDepartmentsCount: d._count?.subDepartments ?? 0,
  });

  const fetchDepartments = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getDepartments();
      setDepartments((res.data.data || []).map(mapDepartment));
    } catch (err) {
      console.error(err);
      setDepartments([]);
      showToast('Failed to load departments', 'error');
    }
  }, []);

  const fetchOrgChart = useCallback(async (departmentId = null, showToastOnSuccess = false) => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return null;
    setLoading(true);
    try {
      const params = departmentId ? { departmentId } : {};
      const res = await adminAPI.getOrgChart(params);
      const data = res.data?.data || null;
      setOrgChartData(data);
      if (showToastOnSuccess) {
        showToast('Organization chart refreshed successfully', 'success');
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch org chart:', err);
      showToast('Failed to load organization chart', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayroll = useCallback(async (monthName) => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await hrAPI.getPayrollSnapshots(monthName ? { month: monthName } : undefined);
      const payslipsArray = res.data?.data || res.data || [];
      const mapped = payslipsArray.map(p => {
        const basicItem = (p.items || []).find(i => i.code?.toLowerCase() === 'basic' || i.code?.toLowerCase() === 'base' || i.name?.toLowerCase().includes('basic'));
        const bonusItem = (p.items || []).find(i => i.code?.toLowerCase() === 'bonus' || i.name?.toLowerCase().includes('bonus'));
        const taxItem = (p.items || []).find(i => i.code?.toLowerCase().startsWith('tax') || i.name?.toLowerCase().includes('tax'));
        
        return {
          ...p,
          name: p.employee?.fullName || 'System Employee',
          userId: p.employee?.userId,
          employeeId: p.employeeId,
          basic: basicItem ? basicItem.amount : (p.grossSalary || 0),
          bonus: bonusItem ? bonusItem.amount : 0,
          deductions: p.totalDeductions || 0,
          tax: taxItem ? taxItem.amount : 0,
          net: p.netSalary || 0,
          status: p.status === 'Paid' || p.status === 'PAID' ? 'Processed' : p.status,
          img: p.employee?.avatarUrl || p.employee?.user?.avatarUrl || ''
        };
      });
      setPayrollList(mapped);
    } catch (err) {
      console.error("Failed to fetch payroll snapshots", err);
      setPayrollList([]);
    }
  }, []);

  const fetchIncrementRequests = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await hrAPI.getIncrementRequests();
      setIncrementRequests(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch increment requests:', e);
    }
  }, []);

  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const fetchAuditLogs = useCallback(async (params = {}) => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getAuditLogs(params);
      const mapped = res.data?.data || res.data || [];
      // The backend now performs the mapping (level, module) directly.
      setSystemLogs(mapped);
      if (res.data?.pagination) {
        setAuditPagination(res.data.pagination);
      }
      return res.data;
    } catch (err) {
      console.error(err);
      setSystemLogs([]);
      showToast('Failed to load audit logs', 'error');
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getPolicies();
      setPolicies(res.data.data || []);
    } catch (err) {
      console.error(err);
      setPolicies([]);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getRoles();
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  }, []);

  const fetchRoleHistory = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getRoleHistory();
      setRoleHistory(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch role history:', err);
      setRoleHistory([]);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await adminAPI.getHolidays();
      setHolidays(res.data?.data || []);
    } catch (e) { console.error('Failed to fetch holidays:', e); }
  }, []);

  const fetchCalendars = useCallback(async () => {
    try {
      const res = await adminAPI.getCalendars();
      setCalendars(res.data?.data || []);
    } catch (e) { console.error('Failed to fetch calendars:', e); }
  }, []);

  const fetchShifts = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getShifts();
      setShifts(res.data || []);
    } catch (e) { console.error('Failed to fetch shifts:', e); }
  }, []);

  const fetchOvertimePolicies = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getOvertimePolicies();
      setOvertimePolicies(res.data || []);
    } catch (e) { console.error('Failed to fetch overtime policies:', e); }
  }, []);

  const fetchBenefits = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getBenefits();
      setBenefits(res.data.data || []);
    } catch (err) {
      console.error(err);
      setBenefits([]);
    }
  }, []);

  const fetchAiModules = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getAiModules();
      setAiModules(res.data.data || []);
    } catch (err) {
      console.error(err);
      setAiModules([]);
    }
  }, []);

  const fetchAiLogs = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getAiLogs();
      setAiLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      setAiLogs([]);
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getIntegrations();
      setIntegrations(res.data.data || []);
    } catch (err) {
      console.error(err);
      setIntegrations([]);
    }
  }, []);

  const fetchBillingPlan = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getBillingPlan();
      setBillingPlan(res.data.data || initialBillingPlan);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getInvoices();
      setInvoices(res.data.data || []);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    }
  }, []);

  const [paymentMethod, setPaymentMethod] = usePersistedState('paymentMethod', {
    type: 'Visa',
    last4: '4242',
    expiry: '12/28',
    cardholder: 'Enterprise Client'
  });

  const fetchPaymentMethod = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;
    try {
      const res = await adminAPI.getPaymentMethod();
      if (res.data?.data) {
        setPaymentMethod(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment method:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!user || !(user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'HR')) return;
    try {
      await Promise.all([
        fetchUsers(),
        fetchDepartments(),
        fetchPayroll(),
        fetchAuditLogs(),
        fetchPolicies(),
        fetchRoles(),
        fetchRoleHistory(),
        fetchHolidays(),
        fetchCalendars(),
        fetchShifts(),
        fetchOvertimePolicies(),
        fetchBenefits(),
        fetchAiModules(),
        fetchAiLogs(),
        fetchIntegrations(),
        fetchBillingPlan(),
        fetchInvoices(),
        fetchPaymentMethod(),
        fetchPayrollConfig(),
        fetchIncrementRequests()
      ]);
    } catch (e) {
      console.error('Error during auto-refresh:', e);
    }
  }, [user, fetchUsers, fetchDepartments, fetchPayroll, fetchAuditLogs, fetchPolicies, fetchRoles, fetchRoleHistory, fetchHolidays, fetchCalendars, fetchShifts, fetchOvertimePolicies, fetchBenefits, fetchAiModules, fetchAiLogs, fetchIntegrations, fetchBillingPlan, fetchInvoices, fetchPaymentMethod, fetchPayrollConfig, fetchIncrementRequests]);

  // Fetch all resources when user logs in and set up background sync
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'HR')) {
      refreshAll();

      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          refreshAll();
        }
      };

      const handleDataUpdate = () => {
        refreshAll();
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('permissions_updated', handleDataUpdate);
      window.addEventListener('department_updated', handleDataUpdate);
      window.addEventListener('user_updated', handleDataUpdate);

      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshAll();
        }
      }, 15000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('permissions_updated', handleDataUpdate);
        window.removeEventListener('department_updated', handleDataUpdate);
        window.removeEventListener('user_updated', handleDataUpdate);
        clearInterval(interval);
      };
    }
  }, [user, refreshAll]);


  // User Actions
  const addUser = async (userData) => {
    try {
      const res = await adminAPI.createUser(userData);
      await fetchUsers();
      window.dispatchEvent(new CustomEvent('user_updated'));
      showToast(`User ${userData.name} added successfully`, 'success');
      return res.data?.data;
    } catch (err) {
      console.error('Failed to create user:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create user';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateUser = async (id, updatedData) => {
    try {
      await adminAPI.updateUser(id, updatedData);
      await fetchUsers();
      window.dispatchEvent(new CustomEvent('user_updated'));
      showToast(`User profile updated successfully`, 'success');
    } catch (err) {
      console.error('Failed to update user:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update user profile';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      await adminAPI.deleteUser(id);
      await Promise.all([
        fetchUsers(),
        fetchDepartments(),
        fetchRoleHistory(),
        fetchAuditLogs()
      ]);
      window.dispatchEvent(new CustomEvent('user_updated'));
      window.dispatchEvent(new CustomEvent('department_updated'));
      window.dispatchEvent(new CustomEvent('permissions_updated'));
      showToast(`User ${user?.employeeProfile?.fullName || user?.name || ''} removed`);
      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast(err.response?.data?.error?.message || 'Failed to delete user', 'error');
      return false;
    }
  };

  const bulkUpdateUsersStatus = async (ids, status) => {
    try {
      for (const id of ids) {
        await adminAPI.toggleUserActive(id);
      }
      await Promise.all([fetchUsers(), fetchDepartments()]);
      window.dispatchEvent(new CustomEvent('user_updated'));
      showToast(`Updated status of ${ids.length} users`);
    } catch (err) {
      console.error('Failed to bulk update status:', err);
      showToast(err.response?.data?.error?.message || 'Failed to update user status', 'error');
    }
  };

  const bulkDeleteUsers = async (ids) => {
    try {
      for (const id of ids) {
        await adminAPI.deleteUser(id);
      }
      await Promise.all([fetchUsers(), fetchDepartments(), fetchRoleHistory()]);
      window.dispatchEvent(new CustomEvent('user_updated'));
      window.dispatchEvent(new CustomEvent('department_updated'));
      showToast(`Deleted ${ids.length} users`);
    } catch (err) {
      console.error('Failed to bulk delete users:', err);
      showToast(err.response?.data?.error?.message || 'Failed to delete users', 'error');
    }
  };

  // Department Actions
  const addDepartment = async (dept) => {
    try {
      const orgRes = await adminAPI.getOrganization();
      const organizationId = orgRes.data?.data?.id;

      await adminAPI.createDepartment({
        name: dept.name?.trim(),
        organizationId,
        parentId: dept.parentId || null,
        code: dept.code?.trim() || null,
        head: dept.head?.trim() || null,
        parent: dept.parent || 'Corporate',
        description: dept.description?.trim() || null,
        color: dept.color || '#4f46e5',
        status: dept.status || 'Active',
      });
      await Promise.all([fetchDepartments(), fetchOrgChart(), fetchUsers()]);
      window.dispatchEvent(new CustomEvent('department_updated'));
      showToast(`Department "${dept.name}" created successfully`, 'success');
      return true;
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create department';
      showToast(message, 'error');
      throw err;
    }
  };

  const updateDepartment = async (id, updatedData) => {
    try {
      await adminAPI.updateDepartment(id, {
        name: updatedData.name?.trim(),
        parentId: updatedData.parentId || null,
        code: updatedData.code?.trim() || null,
        head: updatedData.head?.trim() || null,
        parent: updatedData.parent || 'Corporate',
        description: updatedData.description?.trim() || null,
        color: updatedData.color || '#4f46e5',
        status: updatedData.status || 'Active',
      });
      await Promise.all([fetchDepartments(), fetchOrgChart(), fetchUsers()]);
      window.dispatchEvent(new CustomEvent('department_updated'));
      showToast(`Department "${updatedData.name || 'record'}" updated successfully`, 'success');
      return true;
    } catch (err) {
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update department';
      showToast(message, 'error');
      throw err;
    }
  };

  const deleteDepartment = async (id) => {
    const dept = departments.find(d => d.id === id);
    if (dept && (dept.employees > 0 || dept.subDepartmentsCount > 0)) {
      const reason = dept.employees > 0
        ? `Cannot delete: ${dept.employees} employee(s) are assigned to this department.`
        : `Cannot delete: Department has ${dept.subDepartmentsCount} sub-department(s).`;
      showToast(reason, 'error');
      return false;
    }
    try {
      await adminAPI.deleteDepartment(id);
      await Promise.all([fetchDepartments(), fetchOrgChart(), fetchUsers()]);
      window.dispatchEvent(new CustomEvent('department_updated'));
      showToast(`Department removed successfully`, 'success');
      return true;
    } catch (err) {
      console.error('Failed to delete department:', err);
      showToast(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete department', 'error');
      return false;
    }
  };

  // Role Actions
  const addRole = async (role) => {
    try {
      const res = await adminAPI.createRole(role);
      await Promise.all([fetchRoles(), fetchRoleHistory()]);
      window.dispatchEvent(new CustomEvent('permissions_updated'));
      showToast(`Custom role ${role.name} created`);
      return res.data?.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create role';
      showToast(msg, 'error');
      throw err;
    }
  };

  const updateRole = async (id, updatedData) => {
    try {
      const res = await adminAPI.updateRole(id, updatedData);
      await Promise.all([fetchRoles(), fetchUsers(), fetchRoleHistory()]);
      window.dispatchEvent(new CustomEvent('permissions_updated'));
      showToast(`Role permissions updated and synced`);
      return res.data?.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update role permissions';
      showToast(msg, 'error');
      throw err;
    }
  };

  const changeUserRole = async (id, roleData) => {
    try {
      const payload = typeof roleData === 'string' ? { role: roleData } : roleData;
      const res = await adminAPI.changeUserRole(id, payload);
      await Promise.all([fetchUsers(), fetchDepartments(), fetchRoles(), fetchRoleHistory()]);
      window.dispatchEvent(new CustomEvent('permissions_updated'));
      showToast('User role updated successfully');
      return res.data?.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update user role';
      showToast(msg, 'error');
      throw err;
    }
  };

  const revokeUserRole = async (id) => {
    try {
      const res = await adminAPI.revokeUserRole(id);
      await Promise.all([fetchUsers(), fetchDepartments(), fetchRoles(), fetchRoleHistory()]);
      window.dispatchEvent(new CustomEvent('permissions_updated'));
      showToast(res.data?.message || 'Role revoked successfully');
      return res.data?.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to revoke role';
      showToast(msg, 'error');
      throw err;
    }
  };

  const deleteRole = async (id) => {
    const role = roles.find(r => r.id === id);
    if (role && !role.isCustom) {
      showToast('Cannot delete system roles', 'error');
      return;
    }
    try {
      await adminAPI.deleteRole(id);
      setRoles(prev => prev.filter(r => r.id !== id));
      showToast(`Role deleted`);
    } catch (err) {
      console.error('Failed to delete role:', err);
      showToast(err.response?.data?.error?.message || 'Failed to delete role', 'error');
    }
  };
  
  const duplicateRole = async (id) => {
    try {
      const res = await adminAPI.duplicateRole(id);
      setRoles(prev => [...prev, res.data.data]);
      showToast('Role duplicated successfully');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to duplicate role', 'error');
    }
  };

  const archiveRole = async (id) => {
    try {
      const res = await adminAPI.archiveRole(id);
      setRoles(prev => prev.map(r => r.id === id ? res.data.data : r));
      showToast('Role archived successfully');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to archive role', 'error');
    }
  };

  const restoreRole = async (id) => {
    try {
      const res = await adminAPI.restoreRole(id);
      setRoles(prev => prev.map(r => r.id === id ? res.data.data : r));
      showToast('Role restored successfully');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to restore role', 'error');
    }
  };

  const exportRole = async (id) => {
    try {
      window.open(`/api/admin/roles/${id}/export`, '_blank');
      showToast('Role template exported');
    } catch (err) {
      showToast('Failed to export role template', 'error');
    }
  };

  const importRole = async (data) => {
    try {
      const res = await adminAPI.importRole(data);
      setRoles(prev => [...prev, res.data.data]);
      showToast('Role template imported successfully');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to import role template', 'error');
    }
  };

  // AUTO UPDATES FOR EMPLOYEES COUNT
  useEffect(() => {
    setDepartments(prev => prev.map(dept => ({
      ...dept,
      employees: users.filter(u => u.department === dept.name).length
    })));
  }, [users]);

  // Holiday Actions
  const addHoliday = async (holiday) => {
    try {
      const res = await adminAPI.createHoliday(holiday);
      await fetchHolidays();
      showToast(`Holiday ${holiday.name} added successfully`);
    } catch (err) {
      console.error('Failed to create holiday:', err);
      showToast(err.response?.data?.message || 'Failed to add holiday', 'error');
    }
  };

  const updateHoliday = async (id, updatedData) => {
    try {
      await adminAPI.updateHoliday(id, updatedData);
      await fetchHolidays();
      showToast(`Holiday updated successfully`);
    } catch (err) {
      console.error('Failed to update holiday:', err);
      showToast(err.response?.data?.message || 'Failed to update holiday', 'error');
    }
  };

  const deleteHoliday = async (id) => {
    try {
      await adminAPI.deleteHoliday(id);
      await fetchHolidays();
      showToast('Holiday deleted successfully');
    } catch (e) {
      console.error('Error deleting holiday:', e);
      showToast('Error deleting holiday', 'error');
    }
  };

  // Calendar Actions
  const createCalendar = async (calendar) => {
    try {
      await adminAPI.createCalendar(calendar);
      await fetchCalendars();
      showToast(`Calendar created successfully`);
    } catch (e) {
      console.error('Error creating calendar:', e);
      showToast('Error creating calendar', 'error');
    }
  };

  const updateCalendar = async (id, updatedData) => {
    try {
      await adminAPI.updateCalendar(id, updatedData);
      await fetchCalendars();
      showToast(`Calendar updated successfully`);
    } catch (e) {
      console.error('Error updating calendar:', e);
      showToast('Error updating calendar', 'error');
    }
  };

  const deleteCalendar = async (id) => {
    try {
      await adminAPI.deleteCalendar(id);
      await fetchCalendars();
      showToast('Calendar deleted successfully');
    } catch (e) {
      console.error('Error deleting calendar:', e);
      showToast('Error deleting calendar', 'error');
    }
  };

  const assignCalendar = async (assignmentData) => {
    try {
      await adminAPI.assignCalendar(assignmentData);
      await fetchCalendars();
      showToast('Calendar assigned successfully');
    } catch (e) {
      console.error('Error assigning calendar:', e);
      showToast('Error assigning calendar', 'error');
    }
  };

  const removeAssignment = async (id) => {
    try {
      await adminAPI.removeAssignment(id);
      await fetchCalendars();
      showToast('Assignment removed successfully');
    } catch (e) {
      console.error('Error removing assignment:', e);
      showToast('Error removing assignment', 'error');
    }
  };

  const createShift = async (data) => {
    try {
      const res = await adminAPI.createShift(data);
      const shiftData = res.data?.data || res.data;
      setShifts(prev => [shiftData, ...prev]);
      showToast('Shift created successfully');
      return true;
    } catch (e) { 
      console.error(e); 
      const msg = e.response?.data?.message || 'Error creating shift';
      showToast(msg, 'error'); 
      return false;
    }
  };

  const updateShift = async (id, data) => {
    try {
      const res = await adminAPI.updateShift(id, data);
      const shiftData = res.data?.data || res.data;
      setShifts(prev => prev.map(s => s.id === id ? shiftData : s));
      showToast('Shift updated successfully');
      return true;
    } catch (e) { 
      console.error(e); 
      const msg = e.response?.data?.message || 'Error updating shift';
      showToast(msg, 'error'); 
      return false;
    }
  };

  const deleteShift = async (id) => {
    try {
      await adminAPI.deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
      showToast('Shift deleted successfully');
      return true;
    } catch (e) { 
      console.error(e); 
      const msg = e.response?.data?.message || 'Error deleting shift';
      showToast(msg, 'error'); 
      return false;
    }
  };

  const createOvertimePolicy = async (data) => {
    try {
      const res = await adminAPI.createOvertimePolicy(data);
      setOvertimePolicies(prev => [res.data, ...prev]);
      showToast('Overtime Policy created successfully');
    } catch (e) { console.error(e); showToast('Error creating overtime policy', 'error'); }
  };

  const updateOvertimePolicy = async (id, data) => {
    try {
      const res = await adminAPI.updateOvertimePolicy(id, data);
      setOvertimePolicies(prev => prev.map(p => p.id === id ? res.data : p));
      showToast('Overtime Policy updated successfully');
    } catch (e) { console.error(e); showToast('Error updating overtime policy', 'error'); }
  };

  const deleteOvertimePolicy = async (id) => {
    try {
      await adminAPI.deleteOvertimePolicy(id);
      setOvertimePolicies(prev => prev.filter(p => p.id !== id));
      showToast('Overtime Policy deleted successfully');
    } catch (e) { console.error(e); showToast('Error deleting overtime policy', 'error'); }
  };

  // Benefit Actions
  const addBenefit = async (benefit) => {
    try {
      const res = await adminAPI.createBenefit(benefit);
      await fetchBenefits();
      showToast(`Benefit plan ${benefit.name} added successfully`);
    } catch (err) {
      console.error('Failed to add benefit plan:', err);
      showToast(err.response?.data?.message || 'Failed to add benefit plan', 'error');
    }
  };

  const updateBenefit = async (id, updatedData) => {
    try {
      await adminAPI.updateBenefit(id, updatedData);
      await fetchBenefits();
      showToast(`Benefit plan updated successfully`);
    } catch (err) {
      console.error('Failed to update benefit plan:', err);
      showToast(err.response?.data?.message || 'Failed to update benefit plan', 'error');
    }
  };

  const deleteBenefit = async (id) => {
    try {
      await adminAPI.deleteBenefit(id);
      await fetchBenefits();
      showToast(`Benefit plan deleted successfully`);
    } catch (err) {
      console.error('Failed to delete benefit plan:', err);
      showToast(err.response?.data?.message || 'Failed to delete benefit plan', 'error');
    }
  };


  const initialTaxRules = [
    { id: 1, name: 'Standard Federal Tax', region: 'Global', slabType: 'Progressive', percentage: '20', minSalary: '50000', maxSalary: '100000', effectiveDate: '2026-01-01', status: 'Active' },
    { id: 2, name: 'State Base Tax', region: 'USA', slabType: 'Flat', percentage: '5', minSalary: '0', maxSalary: '999999', effectiveDate: '2026-01-01', status: 'Active' },
  ];
  const [taxRules, setTaxRules] = usePersistedState('taxRules', initialTaxRules);

  const addTaxRule = (rule) => {
    setTaxRules(prev => [...prev, { ...rule, id: Date.now() }]);
    showToast(`Tax rule ${rule.name} added`);
  };

  const updateTaxRule = (id, updatedData) => {
    setTaxRules(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    showToast(`Tax rule updated`);
  };

  const deleteTaxRule = (id) => {
    setTaxRules(prev => prev.filter(r => r.id !== id));
    showToast(`Tax rule deleted`);
  };

  const runPayroll = async (monthName, customEmployeeIds = null, status = 'Paid') => {
    const targetMonth = monthName || new Date().toLocaleString('default', { month: 'long' });
    try {
      let employeeIds;
      if (Array.isArray(customEmployeeIds) && customEmployeeIds.length > 0) {
        employeeIds = customEmployeeIds;
      } else {
        const eligibleUsers = users.filter(u => {
          const roleStr = (u.role || '').toLowerCase().replace(/\s/g, '');
          const isNotAdmin = roleStr !== 'admin' && roleStr !== 'superadmin';
          const isInactiveStatus = ['suspended', 'inactive', 'terminated'].includes((u.status || '').toLowerCase());
          return isNotAdmin && !isInactiveStatus;
        });
        employeeIds = eligibleUsers.map(u => u.profileId || u.id).filter(Boolean);
      }

      if (employeeIds.length === 0) {
        showToast('No eligible employees found for payroll processing', 'warning');
        return { success: false, snapshots: [] };
      }

      const res = await hrAPI.runPayrollBatch({
        employeeIds,
        month: targetMonth,
        status: status || 'Paid'
      });

      await fetchPayroll(targetMonth);
      showToast(`Payroll processed successfully for ${employeeIds.length} employee(s)`, 'success');
      return res?.data || { success: true, count: employeeIds.length };
    } catch (err) {
      console.error("Run payroll error:", err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to process payroll batch';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  const updatePayrollDetails = async (id, data, monthName) => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;

    let targetUser = users.find(u => u.id === id);
    const profileId = targetUser?.profileId || id;
    const targetMonth = monthName || new Date().toLocaleString('default', { month: 'long' });

    // If status is changing to 'Processed' or 'Paid', process individual employee directly
    if (data.status === 'Processed' || data.status === 'Paid') {
      try {
        await hrAPI.runPayroll({
          employeeId: profileId,
          month: targetMonth,
          status: 'Paid'
        });
        await fetchPayroll(targetMonth);
        showToast(`Payroll processed successfully for ${targetUser?.name || 'Employee'}`);
        return;
      } catch (err) {
        console.error('Failed to process individual payroll:', err);
        showToast(err.response?.data?.message || 'Failed to process individual payroll', 'error');
        return;
      }
    }

    const exists = payrollList.find(p => p.id === id || p.userId === id || p.employeeId === id || p.employeeId === profileId);

    if (!targetUser) {
      targetUser = users.find(u => u.id === id || u.profileId === profileId);
    }
    const basic = data.basic !== undefined ? Number(data.basic) : (exists?.basic || targetUser?.baseSalary || 0);
    const bonus = data.bonus !== undefined ? Number(data.bonus) : (exists?.bonus || 0);

    // Deductions sent by the modal represent pre-tax deductions (excluding tax)
    const pf = data.deductions !== undefined ? Number(data.deductions) : (exists?.deductions || 0);

    // Calculate tax dynamically from taxRules
    let taxVal = 0;
    const grossVal = basic + bonus;
    if (Array.isArray(taxRules) && taxRules.length > 0) {
      const rule = taxRules[0];
      let slabs = [];
      try {
        slabs = typeof rule.slabs === 'string' ? JSON.parse(rule.slabs) : rule.slabs;
      } catch (e) { }
      if (Array.isArray(slabs)) {
        const sorted = [...slabs].sort((a, b) => a.min - b.min);
        for (const slab of sorted) {
          const min = Number(slab.min) || 0;
          const max = Number(slab.max) || Infinity;
          const rate = Number(slab.rate) || 0;
          if (grossVal > min) {
            const taxableInThisSlab = Math.min(grossVal - min, max - min);
            taxVal += (taxableInThisSlab * rate) / 100;
          }
        }
      }
    }
    const tax = Math.round(taxVal);

    try {
      if (!profileId) throw new Error("Employee profile ID not found for user.");
      await adminAPI.generatePayslip({
        employeeId: profileId,
        month: monthName || exists?.month || new Date().toLocaleString('default', { month: 'long' }),
        basic: basic,
        hra: 0,
        allowance: 0,
        bonus: bonus,
        pf: pf,
        tax: tax
      });
      await fetchPayroll(monthName);
      showToast('Salary details saved successfully');
    } catch (err) {
      console.error('Failed to save payroll details to backend:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save salary details', 'error');
    }
  };

  const approveIncrementRequest = async (id) => {
    try {
      await hrAPI.approveIncrement(id);
      showToast('Increment request approved and implemented');
      await fetchIncrementRequests();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to approve request', 'error');
    }
  };

  const rejectIncrementRequest = async (id) => {
    try {
      await hrAPI.rejectIncrement(id);
      showToast('Increment request rejected');
      await fetchIncrementRequests();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to reject request', 'error');
    }
  };

  // --- AI ACTIONS ---
  const updateAiModule = async (id, data) => {
    try {
      const res = await adminAPI.updateAiModule(id, data);
      setAiModules(prev => prev.map(m => m.id === id ? res.data.data : m));
      showToast('AI Module updated successfully');
    } catch (err) {
      console.error('Failed to update AI module:', err);
      showToast(err.response?.data?.message || 'Failed to update AI Module', 'error');
    }
  };

  const addAiLog = async (log) => {
    try {
      const res = await adminAPI.createAiLog(log);
      setAiLogs(prev => [res.data.data, ...prev]);
    } catch (err) {
      console.error('Failed to create AI log:', err);
    }
  };

  const [policies, setPolicies] = usePersistedState('policies', []);

  const addPolicy = async (policy) => {
    try {
      const res = await adminAPI.createPolicy(policy);
      await fetchPolicies();
      showToast('Policy published successfully');
    } catch (err) {
      console.error('Failed to create policy:', err);
      showToast(err.response?.data?.message || 'Failed to publish policy', 'error');
    }
  };

  const updatePolicy = async (id, data) => {
    try {
      if (data.status === 'Archived' || (data.status === 'Active' && !data.name)) {
        await adminAPI.toggleArchivePolicy(id);
      } else {
        await adminAPI.updatePolicy(id, data);
      }
      await fetchPolicies();
      showToast('Policy updated');
    } catch (err) {
      console.error('Failed to update policy:', err);
      showToast(err.response?.data?.message || 'Failed to update policy', 'error');
    }
  };

  const resolvePolicy = async (id) => {
    try {
      await adminAPI.resolvePolicy(id);
      await fetchPolicies();
      showToast('Policy status updated');
    } catch (err) {
      console.error('Failed to resolve policy:', err);
      showToast(err.response?.data?.message || 'Failed to update policy status', 'error');
    }
  };

  const renewPolicy = async (id, data) => {
    try {
      await adminAPI.renewPolicy(id, data);
      await fetchPolicies();
      showToast('Policy renewed successfully');
    } catch (err) {
      console.error('Failed to renew policy:', err);
      showToast(err.response?.data?.message || 'Failed to renew policy', 'error');
    }
  };

  const sendPolicyReminder = async (id) => {
    try {
      const res = await adminAPI.sendPolicyReminder(id);
      showToast(res.data?.message || 'Reminder sent');
    } catch (err) {
      console.error('Failed to send policy reminder:', err);
      showToast(err.response?.data?.message || 'Failed to send reminder', 'error');
    }
  };

  const deletePolicy = async (id) => {
    try {
      await adminAPI.deletePolicy(id);
      await fetchPolicies();
      showToast('Policy deleted');
    } catch (err) {
      console.error('Failed to delete policy:', err);
      showToast(err.response?.data?.message || 'Failed to delete policy', 'error');
    }
  };

  const addIntegration = async (integration) => {
    try {
      const res = await adminAPI.createIntegration({
        ...integration,
        health: '100%',
        sync: 'Real-time'
      });
      setIntegrations(prev => [...prev, res.data.data]);
      showToast('Integration connected successfully');
    } catch (err) {
      console.error('Failed to add integration:', err);
      showToast(err.response?.data?.message || 'Failed to connect integration', 'error');
    }
  };

  const updateIntegration = async (id, data) => {
    try {
      const res = await adminAPI.updateIntegration(id, data);
      setIntegrations(prev => prev.map(i => i.id === id ? res.data.data : i));
      showToast('Integration updated');
    } catch (err) {
      console.error('Failed to update integration:', err);
      showToast(err.response?.data?.message || 'Failed to update integration', 'error');
    }
  };

  const deleteIntegration = async (id) => {
    try {
      await adminAPI.deleteIntegration(id);
      setIntegrations(prev => prev.filter(i => i.id !== id));
      showToast('Integration disconnected');
    } catch (err) {
      console.error('Failed to delete integration:', err);
      showToast(err.response?.data?.message || 'Failed to disconnect integration', 'error');
    }
  };

  // --- SETTINGS ---
  const initialSettings = {
    general: { language: 'English (US) - Primary', timezone: 'UTC-08:00 (Pacific Standard Time)', dateFormat: 'DD/MM/YYYY', defaultCurrency: 'USD ($) - US Dollar', multiCurrency: true },
    security: { twoFactor: true, sessionTimeout: '15 Minutes', passwordPolicy: ['Min 12 Characters'] },
    branding: { brandName: 'Global Tech', primaryColor: '#4f46e5', accentColor: '#0ea5e9' },
    notifications: { emailAlerts: true, pushAlerts: true, weeklyReports: false },
    backup: { autoBackup: true, frequency: '24 Hours', lastBackup: 'Oct 20, 2026, 04:28 PM' }
  };
  const [appSettings, setAppSettings] = usePersistedState('settings', initialSettings);

  const updateSettings = (category, data) => {
    setAppSettings(prev => {
      const next = { ...prev, [category]: { ...prev[category], ...data } };
      if (category === 'general') {
        const defaultCurrency = next.general.defaultCurrency;
        const countryCode = next.general.countryCode;

        let phoneCode = '+1';
        if (countryCode) {
          const match = countryCode.match(/\(([^)]+)\)$/);
          if (match) {
            phoneCode = match[1];
          } else {
            phoneCode = countryCode;
          }
        }

        // Sync to backend DB
        settingsAPI.updateSettings({
          defaultCurrency: defaultCurrency || 'INR (₹)',
          defaultPhoneCountry: phoneCode || '+91',
          dateFormat: next.general.dateFormat || 'DD/MM/YYYY'
        }).catch(err => console.error('Failed to sync settings to DB:', err));

        // Sync to hcm_settings localStorage
        localStorage.setItem('hcm_settings', JSON.stringify({
          defaultCurrency: defaultCurrency || 'INR (₹)',
          defaultPhoneCountry: phoneCode || '+91',
          dateFormat: next.general.dateFormat || 'DD/MM/YYYY'
        }));
      }

      if (category === 'security' && data.sessionTimeout) {
        localStorage.setItem('hcm_session_timeout', data.sessionTimeout);
      }

      if (category === 'general' && data.language) {
        applyTranslation(data.language);
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
      return next;
    });
  };

  const resetSettings = () => {
    setAppSettings(initialSettings);
    applyTranslation(initialSettings.general.language);
    showToast('Settings reset to defaults');
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  // --- BILLING STATE ---
  const initialBillingPlan = { name: 'Enterprise Plan', price: 4280, cycle: 'Monthly', users: 500, addons: ['AI Engine', 'Security+'] };
  const [billingPlan, setBillingPlan] = usePersistedState('billingPlan', initialBillingPlan);

  const initialInvoices = [
    { id: 'INV-4820', date: 'Oct 01, 2026', amount: `${getSymbol()}4,280.00`, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-4712', date: 'Sep 01, 2026', amount: `${getSymbol()}4,280.00`, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-4601', date: 'Aug 01, 2026', amount: `${getSymbol()}4,200.00`, status: 'Paid', method: 'Visa •••• 4242' },
    { id: 'INV-4521', date: 'Jul 01, 2026', amount: `${getSymbol()}4,200.00`, status: 'Refunded', method: 'Visa •••• 4242' },
  ];
  const [invoices, setInvoices] = usePersistedState('invoices', initialInvoices);

  const updatePlan = async (planData) => {
    try {
      if (billingPlan?.id) {
        const res = await adminAPI.updateBillingPlan(billingPlan.id, planData);
        setBillingPlan(res.data?.data || { ...billingPlan, ...planData });
      } else {
        setBillingPlan(prev => ({ ...prev, ...planData }));
      }
      showToast('Subscription plan updated successfully', 'success');
    } catch (err) {
      console.warn('API plan update failed, applying locally:', err);
      setBillingPlan(prev => ({ ...prev, ...planData }));
      showToast('Subscription plan updated successfully', 'success');
    }
  };

  const updateInvoice = async (id, data) => {
    try {
      const res = await adminAPI.updateInvoice(id, data);
      setInvoices(prev => prev.map(inv => inv.id === id ? res.data.data : inv));
      showToast('Invoice updated');
    } catch (err) {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    }
  };



  const savePaymentMethod = async (pmData) => {
    try {
      const res = await adminAPI.savePaymentMethod(pmData);
      if (res.data?.data) {
        setPaymentMethod(res.data.data);
      } else {
        setPaymentMethod(prev => ({ ...prev, ...pmData }));
      }
      showToast('Payment method updated successfully');
    } catch (err) {
      console.error('Failed to save payment method:', err);
      setPaymentMethod(prev => ({ ...prev, ...pmData }));
      showToast('Payment method saved locally');
    }
  };

  const exportInvoices = async () => {
    try {
      const res = await adminAPI.exportInvoices();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Invoices exported successfully');
    } catch (err) {
      showToast('Failed to export invoices', 'error');
    }
  };

  // --- AUDIT LOGS STATE ---
  const addSystemLog = (log) => {
    setSystemLogs(prev => [{ ...log, id: Date.now(), time: 'Just now' }, ...prev]);
  };

  const updateSystemLog = (id, updatedFields) => {
    setSystemLogs(prev => prev.map(l => (String(l.id) === String(id) ? { ...l, ...updatedFields } : l)));
  };

  // --- REPORTS STATE (database-backed) ---
  const [reportSchedules, setReportSchedules] = usePersistedState('reportSchedules', []);
  const [customReports, setCustomReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchCustomReports = useCallback(async () => {
    const token = localStorage.getItem('hcm_token');
    if (!token) return;

    let role = user?.role;
    if (!role) {
      try {
        const stored = localStorage.getItem('hcm_user');
        if (stored) role = JSON.parse(stored)?.role;
      } catch (e) {}
    }

    // Only administrators and HR personnel have access to /api/admin/reports
    if (role && !['ADMIN', 'SUPERADMIN', 'HR'].includes(role)) {
      setCustomReports([]);
      return;
    }

    setReportsLoading(true);
    try {
      const res = await adminAPI.getReports({ limit: 50 });
      setCustomReports(res.data?.data || []);
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.warn('Could not load reports from DB:', err?.response?.status);
      }
      setCustomReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let role = user?.role;
    if (!role) {
      try {
        const stored = localStorage.getItem('hcm_user');
        if (stored) role = JSON.parse(stored)?.role;
      } catch (e) {}
    }

    if (!role || ['ADMIN', 'SUPERADMIN', 'HR'].includes(role)) {
      fetchCustomReports();
    }
  }, [user, fetchCustomReports]);

  const addReportSchedule = (schedule) => {
    setReportSchedules(prev => [...prev, { ...schedule, id: Date.now() }]);
    showToast(`Report schedule "${schedule.name}" created`);
  };

  const addCustomReport = async (report) => {
    try {
      const res = await adminAPI.createReport(report);
      const saved = res.data?.data;
      if (saved) {
        setCustomReports(prev => [saved, ...prev]);
        return saved;
      }
    } catch (err) {
      console.error('Failed to save report to DB:', err);
      // Fallback: add locally
      const local = { ...report, id: `RPT-${Date.now()}`, createdAt: new Date().toISOString() };
      setCustomReports(prev => [local, ...prev]);
      return local;
    }
  };

  const deleteCustomReport = async (id) => {
    setCustomReports(prev => prev.filter(r => r.id !== id));
    try {
      await adminAPI.deleteReport(id);
    } catch (err) {
      console.error('Failed to delete report from DB:', err);
    }
    showToast('Report removed from history');
  };

  // Computed total active employees (excluding candidates and inactive)
  const totalActiveEmployees = useMemo(() => {
    return users.filter(u => u.status === 'Active' && u.role !== 'Candidate').length;
  }, [users]);

  const value = {
    users, addUser, updateUser, deleteUser, bulkUpdateUsersStatus, bulkDeleteUsers, fetchUsers, changeUserRole, revokeUserRole,
    departments, addDepartment, updateDepartment, deleteDepartment,
    orgChartData, fetchOrgChart,
    roles, addRole, updateRole, deleteRole, duplicateRole, archiveRole, restoreRole, exportRole, importRole,
    roleHistory, fetchRoleHistory,
    toasts, showToast,
    holidays, fetchHolidays, addHoliday, updateHoliday, deleteHoliday,
    calendars, fetchCalendars, createCalendar, updateCalendar, deleteCalendar, assignCalendar, removeAssignment,
    shifts, fetchShifts, createShift, updateShift, deleteShift,
    overtimePolicies, fetchOvertimePolicies, createOvertimePolicy, updateOvertimePolicy, deleteOvertimePolicy,
    benefits, fetchBenefits, addBenefit, updateBenefit, deleteBenefit,
    taxRules, addTaxRule, updateTaxRule, deleteTaxRule,
    aiModules, updateAiModule, aiLogs, addAiLog,
    payrollList, runPayroll, updatePayrollDetails, fetchPayroll,
    salaryComponents, deductionRules, fetchPayrollConfig,
    incrementRequests, approveIncrementRequest, rejectIncrementRequest, fetchIncrementRequests,
    policies, fetchPolicies, addPolicy, updatePolicy, deletePolicy, renewPolicy, resolvePolicy, sendPolicyReminder, totalActiveEmployees,
    integrations, addIntegration, updateIntegration, deleteIntegration,
    appSettings, updateSettings, resetSettings,
    billingPlan, invoices, updatePlan, updateInvoice, exportInvoices, fetchBillingPlan, fetchInvoices,
    paymentMethod, fetchPaymentMethod, savePaymentMethod,
    systemLogs, addSystemLog, updateSystemLog, fetchAuditLogs, auditPagination,
    reportSchedules, addReportSchedule,
    customReports, addCustomReport, deleteCustomReport, fetchCustomReports, reportsLoading,
    loading
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

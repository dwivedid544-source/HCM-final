// ============================================================
// HCM API Service Layer
// ============================================================
// Ye file backend se baat karne ka EKTAUTA raasta hai.
// Saare contexts is file ki functions use karenge.
// localStorage directly koi context access nahi karega API calls ke liye.
// ============================================================

import axios from 'axios';

// ── Base Axios Instance ──
const getBaseURL = () => {
  // If VITE_API_URL is explicitly configured, always prioritize it
  if (import.meta.env?.VITE_API_URL) {
    const clean = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  // In development (Vite) fallback to localhost:5001 if no VITE_API_URL provided
  if (import.meta.env && import.meta.env.DEV) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5001/api`;
  }
  // In production same-origin
  const base = `${window.location.origin}`;
  const clean = base.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const getBackendURL = () => {
  const url = getBaseURL();
  return url.endsWith('/api') ? url.slice(0, -4) : url;
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Dedicated Axios Instance for Multipart / File Uploads (no default Content-Type header)
export const UploadAPI = axios.create({
  baseURL: getBaseURL(),
});

export const getActiveToken = () => {
  return sessionStorage.getItem('hcm_token') || localStorage.getItem('hcm_token');
};

// ── Request Interceptor: Har request mein token attach karo ──
const attachToken = (config) => {
  const token = getActiveToken();
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // If payload is FormData, do not let Axios force application/json
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
};

// ── Response Interceptor: 401 handling without hard page reload ──
const handle401 = (error) => {
  if (error.response?.status === 401) {
    sessionStorage.removeItem('hcm_token');
    sessionStorage.removeItem('hcm_user');
    localStorage.removeItem('hcm_token');
    localStorage.removeItem('hcm_user');
    window.dispatchEvent(new CustomEvent('hcm_unauthorized'));
  }
  return Promise.reject(error);
};

API.interceptors.request.use(attachToken);
API.interceptors.response.use((response) => response, handle401);

UploadAPI.interceptors.request.use((config) => {
  return attachToken(config);
});
UploadAPI.interceptors.response.use((response) => response, handle401);

// ============================================================
// AUTH APIs
// ============================================================
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
  changePassword: (data) => API.post('/auth/change-password', data),
  getMyPermissions: () => API.get('/auth/my-permissions'),
  resetForgottenPassword: (data) => API.post('/auth/reset-forgotten-password', data),
};

// ============================================================
// EMPLOYEE APIs
// ============================================================
export const employeeAPI = {
  getDashboard: () => API.get('/employee/dashboard'),
  getProfile: () => API.get('/employee/profile'),
  updateProfile: (data) => API.put('/employee/profile', data),

  clockIn: (data) => API.post('/attendance/check-in', data).catch(() => API.post('/employee/attendance/clock-in', data)),
  clockOut: () => API.post('/attendance/check-out').catch(() => API.post('/employee/attendance/clock-out')),
  checkIn: (data) => API.post('/attendance/check-in', data).catch(() => API.post('/employee/attendance/clock-in', data)),
  checkOut: () => API.post('/attendance/check-out').catch(() => API.post('/employee/attendance/clock-out')),
  getCurrentAttendance: () => API.get('/attendance/current').catch(() => API.get('/employee/attendance/current')),
  getAttendanceHistory: (params) => API.get('/attendance/history', { params }).catch(() => API.get('/employee/attendance/history', { params })),
  getAttendance: (params) => API.get('/attendance/history', { params }).catch(() => API.get('/employee/attendance', { params })),

  getLeaveSummary: () => API.get('/employee/leaves/summary'),

  // --- AI ENDPOINTS ---
  // Phase 1: Resume Scoring is integrated directly into publicAPI.submitCareerApplication (backend handles it)
  // Phase 2: Resume Builder
  aiBuildResume: (details) => API.post('/employee/ai/resume-builder', { details }),
  // Phase 3: Policy Assistant
  aiPolicyAssistant: (query, history = [], pageContext = '/employee/help') => API.post('/employee/ai/policy-assistant', { query, history, pageContext }),
  // Phase 4: Attendance Insights (Manager)
  aiAttendanceInsights: () => API.get('/manager/ai/attendance-insights'),
  // Phase 5: Payroll Insights
  aiPayrollInsights: (employeeId, payslipData) => API.post('/employee/ai/payroll-insights', { employeeId, payslipData }),
  // Phase 6: Leave Recommendations (Manager)
  aiLeaveRecommendations: (employeeId, leaveHistory) => API.post('/manager/ai/leave-recommendations', { employeeId, leaveHistory }),
  // Phase 7: Performance Review Summary (Manager)
  aiPerformanceSummaries: (kpis, feedback) => API.post('/manager/ai/performance-summaries', { kpis, feedback }),
  // Phase 8: Document OCR
  aiDocumentAnalyze: (formData) => UploadAPI.post('/employee/ai/document-analyze', formData),
  // Phase 9: Natural Language Analytics (SuperAdmin)
  aiAnalytics: (query) => API.post('/superadmin/ai/analytics', { query }),
  // Phase 10: Letter Generator
  aiGenerateLetter: (letterType, contextData) => API.post('/employee/ai/generate-letter', { letterType, contextData }),
  // HCM Copilot
  aiCopilotChat: (message, history, pageContext, conversationId) => 
    API.post('/ai/chat', { message, history, pageContext, conversationId }).catch(() => API.post('/copilot/chat', { message, history, pageContext, conversationId })),

  getLeaveBalance: () => API.get('/employee/leaves/balance'),
  getLeaves: (params) => API.get('/employee/leaves', { params }),
  requestLeave: (data) => API.post('/employee/leaves/request', data).catch(() => API.post('/employee/leaves', data)),
  applyLeave: (data) => API.post('/employee/leaves/request', data).catch(() => API.post('/employee/leaves', data)),
  cancelLeave: (id) => API.delete(`/employee/leaves/${id}`).catch(() => API.patch(`/employee/leaves/${id}/cancel`)),

  getPayslips: () => API.get('/employee/payslips'),
  getPerformance: () => API.get('/employee/performance'),
  getBenefits: () => API.get('/employee/benefits'),
  submitBenefitClaim: (data) => API.post('/employee/benefits/claims', data),
  enrollBenefitPlan: (data) => API.post('/employee/benefits/enroll', data),
  unenrollBenefitPlan: (data) => API.post('/employee/benefits/unenroll', data),
  getTasks: () => API.get('/employee/tasks'),

  getTickets: () => API.get('/employee/tickets'),
  createTicket: (data) => API.post('/employee/tickets', data),
  replyTicket: (id, text, attachmentBase64) => API.post(`/employee/tickets/${id}/reply`, { text, attachmentBase64 }),
  deleteTicketMessage: (id, msgId) => API.delete(`/employee/tickets/${id}/messages/${msgId}`),
  getHolidays: () => API.get('/employee/holidays'),
  getAnnouncements: () => API.get('/employee/announcements'),

  getDocuments: () => API.get('/employee/documents', { params: { _t: Date.now() } }),
  uploadDocument: (data) => API.post('/employee/documents', data),
  uploadDocumentFile: async (formData) => {
    const token = getActiveToken();
    const res = await fetch(`${getBaseURL()}/employee/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || errJson?.message || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },
  deleteDocument: (id) => API.delete(`/employee/documents/${id}`),

  submitResignation: (data) => API.post('/employee/resignation', data),
  getResignation: () => API.get('/employee/resignation'),

  createGoal: (data) => API.post('/employee/performance/goals', data),
  updateGoal: (id, data) => API.patch(`/employee/performance/goals/${id}`, data),
  updateGoalProgress: (id, progress) => API.post(`/employee/performance/goals/${id}/progress`, { progress }),
  deleteGoal: (id) => API.delete(`/employee/performance/goals/${id}`),
  upsertSkill: (data) => API.post('/employee/performance/skills', data),
  deleteSkill: (id) => API.delete(`/employee/performance/skills/${id}`),
  resign: (data) => API.post('/employee/resign', data),

  getPolicies: () => API.get('/employee/policies'),
  acknowledgePolicy: (id) => API.post(`/employee/policies/${id}/acknowledge`),
  acceptPolicy: (id) => API.post(`/employee/policies/${id}/accept`),

  // Settings & Password
  getSettings: () => API.get('/employee/settings'),
  updateSettings: (data) => API.put('/employee/settings', data),
  updatePassword: (data) => API.put('/employee/password', data),

  // Compensation
  requestIncrement: (data) =>
    API.post('/employee/compensation/increment-request', data)
      .catch(() => API.post('/employee/increment-request', data)),
};

// ============================================================
// MANAGER APIs
// ============================================================
export const managerAPI = {
  getDashboard: () => API.get('/manager/dashboard'),
  getTeam: () => API.get('/manager/team'),
  addTeamMember: (data) => API.post('/manager/team', data),
  getOrgEmployees: () => API.get('/manager/org-employees'),
  getTeamAttendance: () => API.get('/manager/attendance'),
  addManualAttendance: (data) => API.post('/manager/attendance', data),
  getAiAttendanceSummary: () => API.get('/manager/ai/attendance-insights'),

  getTeamLeaves: () => API.get('/manager/leaves'),
  addTeamLeaveRequest: (data) => API.post('/manager/leaves', data),
  reviewLeave: (id, data) => API.patch(`/manager/leaves/${id}`, data),

  getTeamTasks: () => API.get('/manager/tasks'),
  assignTask: (data) => API.post('/manager/tasks', data),
  updateTask: (id, data) => API.patch(`/manager/tasks/${id}`, data),
  deleteTask: (id) => API.delete(`/manager/tasks/${id}`),


  getTeamPerformance: () => API.get('/manager/performance'),
  addPerformanceGoal: (data) => API.post('/manager/performance', data),
  updatePerformanceGoal: (id, data) => API.patch(`/manager/performance/${id}`, data),
  deletePerformanceGoal: (id) => API.delete(`/manager/performance/${id}`),

  getTeamReviews: () => API.get('/manager/reviews'),
  createTeamReview: (data) => API.post('/manager/reviews', data),
  updateTeamReview: (id, data) => API.patch(`/manager/reviews/${id}`, data),
  deleteTeamReview: (id) => API.delete(`/manager/reviews/${id}`),

  getIncrementRequests: () => API.get('/manager/increments'),
  requestSalaryIncrement: (data) => API.post('/manager/increments', data),
  approveIncrementRequest: (id, data) => API.patch(`/manager/increments/${id}/approve`, data),
  rejectIncrementRequest: (id, data) => API.patch(`/manager/increments/${id}/reject`, data),

  getResignations: () => API.get('/manager/resignations'),
  reviewResignation: (id, data) => API.patch(`/manager/resignations/${id}`, data),

  getManagerReimbursements: () => API.get('/manager/reimbursements'),
  reviewManagerReimbursement: (id, data) => API.patch(`/manager/reimbursements/${id}/review`, data),
};

// ============================================================
// HR APIs
// ============================================================
export const hrAPI = {
  // ... (keep existing methods unchanged, adding new ones below if needed)
  getJobs: () => API.get('/hr/jobs'),
  createJob: (data) => API.post('/hr/jobs', data),
  updateJob: (id, data) => API.put(`/hr/jobs/${id}`, data),
  deleteJob: (id) => API.delete(`/hr/jobs/${id}`),

  getApplications: () => API.get('/hr/applications'),
  createApplication: (data) => API.post('/hr/applications', data),
  updateApplicationStatus: (id, data) => API.patch(`/hr/applications/${id}/status`, data),
  trackCandidateProfile: (id, data) => API.patch(`/hr/applications/${id}/track`, data),
  deleteApplication: (id) => API.delete(`/hr/applications/${id}`),

  getInterviews: () => API.get('/hr/interviews'),
  scheduleInterview: (data) => API.post('/hr/interviews', data),
  updateInterview: (id, data) => API.put(`/hr/interviews/${id}`, data),
  deleteInterview: (id) => API.delete(`/hr/interviews/${id}`),
  updateInterviewStatus: (id, data) => API.patch(`/hr/interviews/${id}/status`, data),
  submitInterviewFeedback: (id, data) => API.patch(`/hr/interviews/${id}/feedback`, data),

  getAllEmployees: () => API.get('/hr/employees'),
  onboardEmployee: (data) => API.post('/hr/employees', data),
  deactivateEmployee: (id) => API.patch(`/hr/employees/${id}/deactivate`),

  getAllLeaves: () => API.get('/hr/leaves'),
  createLeave: (data) => API.post('/hr/leaves', data),
  reviewLeave: (id, data) => API.patch(`/hr/leaves/${id}`, data),

  getAllTickets: () => API.get('/hr/tickets'),
  createTicket: (data) => API.post('/hr/tickets', data),
  replyTicket: (id, data) => {
    if (data instanceof FormData) {
      return UploadAPI.post(`/hr/tickets/${id}/reply`, data);
    }
    return API.post(`/hr/tickets/${id}/reply`, data);
  },
  updateTicketStatus: (id, data) => API.patch(`/hr/tickets/${id}/status`, data),

  getOffers: () => API.get('/hr/offers'),
  createOffer: (data) => API.post('/hr/offers', data),
  updateOffer: (id, data) => API.put(`/hr/offers/${id}`, data),
  deleteOffer: (id) => API.delete(`/hr/offers/${id}`),

  getOnboarding: () => API.get('/hr/onboarding'),
  createOnboarding: (data) => API.post('/hr/onboarding', data),
  updateOnboarding: (id, data) => API.put(`/hr/onboarding/${id}`, data),
  deleteOnboarding: (id) => API.delete(`/hr/onboarding/${id}`),
  remindManager: (id) => API.post(`/hr/onboarding/${id}/remind-manager`),
  sendWelcomeEmail: (data) => API.post(`/hr/onboarding/send-welcome`, data),
  getReports: (params) => API.get('/hr/reports', { params }),

  getIncrementRequests: () => API.get('/hr/payroll/increments'),
  approveIncrement: (id) => API.patch(`/hr/payroll/increments/${id}/approve`),
  rejectIncrement: (id) => API.patch(`/hr/payroll/increments/${id}/reject`),
  getPayrollSnapshots: (params) => API.get('/hr/payroll/snapshots', { params }),
  runPayroll: (data) => API.post('/hr/payroll/run', data),
  runPayrollBatch: (data) => API.post('/hr/payroll/run-batch', data),
  finalizePayroll: (id) => API.patch(`/hr/payroll/${id}/finalize`),

  getCandidateAiSummary: (data) => API.post('/hr/ai/candidate-summary', data),

  promoteCandidate: (id, data) => API.post(`/hr/onboarding/${id}/promote`, data),
  initiateTermination: (data) => API.post('/hr/terminate', data),
  getExits: () => API.get('/hr/exits'),
  updateClearanceStatus: (id, data) => API.patch(`/hr/exits/${id}/clearance`, data),
  finalizeExit: (id) => API.patch(`/hr/exits/${id}/finalize`),
  reviewResignationHr: (id, data) => API.patch(`/hr/resignations/${id}/approve`, data),
  confirmProbation: (id) => API.patch(`/hr/employees/${id}/confirm-probation`),
  extendProbation: (id, data) => API.patch(`/hr/employees/${id}/extend-probation`, data),
};

// ============================================================
// ADMIN APIs
// ============================================================
export const adminAPI = {
  // Org setup
  completeOrgSetup: (orgId) => API.post(`/admin/organizations/${orgId}/complete-setup`),
  // Analytics & Dashboard
  getDashboardStats: (timeRange) => API.get('/admin/dashboard', { params: { timeRange } }),

  getStats: () => API.get('/admin/stats'),

  getOrganization: () => API.get('/admin/organization'),
  createOrganization: (data) => API.post('/admin/organization', data),
  updateOrganization: (id, data) => API.put(`/admin/organization/${id}`, data),
  uploadOrganizationLogo: (formData) => UploadAPI.patch('/admin/organization/logo', formData),
  deleteOrganizationLogo: () => API.delete('/admin/organization/logo'),
  getSettings: () => API.get('/admin/settings'),
  updateSettings: (data) => API.put('/admin/settings', data),
  resetSettings: () => API.post('/admin/settings/reset'),

  getDepartments: () => API.get('/admin/departments'),
  createDepartment: (data) => API.post('/admin/departments', data),
  updateDepartment: (id, data) => API.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => API.delete(`/admin/departments/${id}`),

  getOrgChart: (params) => API.get('/admin/org-chart', { params }),

  getAllUsers: () => API.get('/admin/users'),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  changeUserRole: (id, data) => API.patch(`/admin/users/${id}/role`, data),
  revokeUserRole: (id) => API.post(`/admin/users/${id}/revoke-role`),
  toggleUserActive: (id) => API.patch(`/admin/users/${id}/toggle-active`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),

  getAllPayslips: (params) => API.get('/admin/payslips', { params }),
  generatePayslip: (data) => API.post('/admin/payslips', data),
  markPayslipPaid: (id) => API.patch(`/hr/payroll/${id}/finalize`),

  getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),

  getPolicies: () => API.get('/admin/policies'),
  createPolicy: (data) => API.post('/admin/policies', data),
  updatePolicy: (id, data) => API.put(`/admin/policies/${id}`, data),
  deletePolicy: (id) => API.delete(`/admin/policies/${id}`),
  toggleArchivePolicy: (id) => API.patch(`/admin/policies/${id}/archive`),
  renewPolicy: (id, data) => API.post(`/admin/policies/${id}/renew`, data),
  sendPolicyReminder: (id) => API.post(`/admin/policies/${id}/remind`),
  resolvePolicy: (id) => API.patch(`/admin/policies/${id}/resolve`),

  getRoles: () => API.get('/admin/roles'),
  getRoleHistory: () => API.get('/admin/roles/history'),
  createRole: (data) => API.post('/admin/roles', data),
  updateRole: (id, data) => API.put(`/admin/roles/${id}`, data),
  deleteRole: (id) => API.delete(`/admin/roles/${id}`),
  duplicateRole: (id) => API.post(`/admin/roles/${id}/duplicate`),
  archiveRole: (id) => API.post(`/admin/roles/${id}/archive`),
  restoreRole: (id) => API.post(`/admin/roles/${id}/restore`),
  exportRole: (id) => API.get(`/admin/roles/${id}/export`),
  importRole: (data) => API.post('/admin/roles/import', data),

  getHolidays: () => API.get('/admin/holidays'),
  createHoliday: (data) => API.post('/admin/holidays', data),
  updateHoliday: (id, data) => API.put(`/admin/holidays/${id}`, data),
  deleteHoliday: (id) => API.delete(`/admin/holidays/${id}`),

  // Work Calendar & Weekend Rules
  getCalendars: () => API.get('/admin/calendars'),
  createCalendar: (data) => API.post('/admin/calendars', data),
  updateCalendar: (id, data) => API.put(`/admin/calendars/${id}`, data),
  deleteCalendar: (id) => API.delete(`/admin/calendars/${id}`),
  assignCalendar: (data) => API.post('/admin/calendars/assign', data),
  removeAssignment: (id) => API.delete(`/admin/calendars/assignments/${id}`),

  getShifts: () => API.get('/admin/shifts'),
  createShift: (data) => API.post('/admin/shifts', data),
  updateShift: (id, data) => API.put(`/admin/shifts/${id}`, data),
  deleteShift: (id) => API.delete(`/admin/shifts/${id}`),

  getOvertimePolicies: () => API.get('/admin/overtime-policies'),
  createOvertimePolicy: (data) => API.post('/admin/overtime-policies', data),
  updateOvertimePolicy: (id, data) => API.put(`/admin/overtime-policies/${id}`, data),
  deleteOvertimePolicy: (id) => API.delete(`/admin/overtime-policies/${id}`),

  getBenefits: () => API.get('/admin/benefits'),
  createBenefit: (data) => API.post('/admin/benefits', data),
  updateBenefit: (id, data) => API.put(`/admin/benefits/${id}`, data),
  deleteBenefit: (id) => API.delete(`/admin/benefits/${id}`),

  getAiModules: () => API.get('/admin/ai/modules'),
  updateAiModule: (id, data) => API.put(`/admin/ai/modules/${id}`, data),
  getAiLogs: () => API.get('/admin/ai/logs'),
  createAiLog: (data) => API.post('/admin/ai/logs', data),

  getIntegrations: () => API.get('/admin/integrations'),
  createIntegration: (data) => API.post('/admin/integrations', data),
  updateIntegration: (id, data) => API.put(`/admin/integrations/${id}`, data),
  deleteIntegration: (id) => API.delete(`/admin/integrations/${id}`),

  getBillingPlan: () => API.get('/admin/billing/plan'),
  updateBillingPlan: (id, data) => API.put(`/admin/billing/plan/${id}`, data),
  getInvoices: () => API.get('/admin/billing/invoices'),
  createInvoice: (data) => API.post('/admin/billing/invoices', data),
  updateInvoice: (id, data) => API.put(`/admin/billing/invoices/${id}`, data),
  deleteInvoice: (id) => API.delete(`/admin/billing/invoices/${id}`),
  exportInvoices: () => API.get('/admin/billing/invoices/export', { responseType: 'blob' }),
  getPaymentMethod: () => API.get('/admin/billing/payment-method'),
  savePaymentMethod: (data) => API.post('/admin/billing/payment-method', data),

  getAllAttendance: (params) => API.get('/admin/attendance', { params }),
  addManualAttendance: (data) => API.post('/admin/attendance', data),
  updateAttendance: (id, data) => API.put(`/admin/attendance/${id}`, data),
  deleteAttendance: (id) => API.delete(`/admin/attendance/${id}`),
  getAllLeaves: () => API.get('/admin/leaves'),
  reviewLeave: (id, data) => API.patch(`/admin/leaves/${id}`, data),
  getSalaryComponents: () => API.get('/admin/payroll-config/components'),
  getDeductions: () => API.get('/admin/payroll-config/deductions'),

  getResignations: () => API.get('/admin/resignations'),
  overrideResignation: (id, data) => API.patch(`/admin/resignations/${id}/override`, data),

  // Generated Reports
  getReports: (params) => API.get('/admin/reports', { params }),
  createReport: (data) => API.post('/admin/reports', data),
  deleteReport: (id) => API.delete(`/admin/reports/${id}`),
  getReportData: (modules) => API.get('/admin/reports/data', { params: { modules: Array.isArray(modules) ? modules.join(',') : modules } }),
};

// ============================================================
// SUPERADMIN APIs
// ============================================================
export const superAdminAPI = {
  getPlatformStats: () => API.get('/superadmin/stats'),
  getSystemHealth: () => API.get('/superadmin/system-health'),
  getAnalytics: (timeRange) => API.get('/superadmin/analytics', { params: { timeRange } }),
  exportAnalytics: (timeRange) => API.get('/superadmin/analytics/export', { params: { timeRange }, responseType: 'blob' }),

  getAllOrganizations: (params) => API.get('/superadmin/organizations', { params }),
  createOrganization: (data) => API.post('/superadmin/organizations', data),
  provisionOrganization: (data) => API.post('/superadmin/organizations/provision', data),
  getOrganizationDetails: (id) => API.get(`/superadmin/organizations/${id}`),
  updateOrganization: (id, data) => API.put(`/superadmin/organizations/${id}`, data),
  deleteOrganization: (id) => API.delete(`/superadmin/organizations/${id}`),
  suspendOrganization: (id) => API.patch(`/superadmin/organizations/${id}/suspend`),
  activateOrganization: (id) => API.patch(`/superadmin/organizations/${id}/activate`),
  getOrgSubscriptions: (id) => API.get(`/superadmin/organizations/${id}/subscriptions`),
  getOrgSetupProgress: (id) => API.get(`/superadmin/organizations/${id}/setup-progress`),
  resendOrgInvitation: (id) => API.post(`/superadmin/invitations/${id}/resend`),
  createAdminForOrg: (orgId, data) => API.post(`/superadmin/organizations/${orgId}/create-admin`, data),

  getAllPlatformUsers: (params) => API.get('/superadmin/users', { params }),
  createUser: (data) => API.post('/superadmin/users', data),
  updateUser: (id, data) => API.put(`/superadmin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/superadmin/users/${id}`),
  changeAnyUserRole: (id, data) => API.patch(`/superadmin/users/${id}/role`, data),
  revokeAnyUserRole: (id) => API.post(`/superadmin/users/${id}/revoke-role`),
  toggleAnyUserActive: (id) => API.patch(`/superadmin/users/${id}/toggle-active`),
  sendPasswordReset: (id) => API.post(`/superadmin/users/${id}/reset-password`),
  resetUserPassword: (id) => API.post(`/superadmin/users/${id}/reset-password`),

  getAllPlatformDepartments: () => API.get('/superadmin/departments'),
  createPlatformDepartment: (data) => API.post('/superadmin/departments', data),
  updatePlatformDepartment: (id, data) => API.put(`/superadmin/departments/${id}`, data),
  deletePlatformDepartment: (id) => API.delete(`/superadmin/departments/${id}`),

  getPlatformAuditLogs: (params) => API.get('/superadmin/audit-logs', { params }),

  getPayrollHistory: () => API.get('/superadmin/payroll'),
  getPayrollSettings: () => API.get('/superadmin/payroll/settings'),
  updatePayrollSettings: (data) => API.put('/superadmin/payroll/settings', data),
  createPayslip: (data) => API.post('/superadmin/payroll', data),
  generatePayroll: (data) => API.post('/superadmin/payroll/generate', data),
  updatePayslip: (id, data) => API.put(`/superadmin/payroll/${id}`, data),
  deletePayslip: (id) => API.delete(`/superadmin/payroll/${id}`),
  bulkApprovePayslips: (ids) => API.patch('/superadmin/payroll/bulk-approve', { ids }),

  // Pricing Management
  getAdminPricingPlans: () => API.get('/pricing?all=true'),
  createPricingPlan: (data) => API.post('/pricing', data),
  updatePricingPlan: (id, data) => API.put(`/pricing/${id}`, data),
  deletePricingPlan: (id) => API.delete(`/pricing/${id}`),
  togglePricingPlanStatus: (id) => API.patch(`/pricing/${id}/status`),
  reorderPricingPlans: (ids) => API.put('/pricing/reorder', { ids }),

  getSystemSettings: () => API.get('/superadmin/settings'),
  updateSystemSettings: (data) => API.put('/superadmin/settings', data),
  resetSystemSettings: () => API.post('/superadmin/settings/reset'),

  updateOrgSubscription: (id, data) => API.put(`/superadmin/organizations/${id}/subscription`, data),

  // SaaS Usage & Feature Management
  getGlobalUsage: () => API.get('/superadmin/usage'),
  getPlatformFeatures: () => API.get('/superadmin/features'),
  updatePlatformFeatures: (data) => API.put('/superadmin/features', data),
  togglePlatformFeature: (data) => API.post('/superadmin/features/toggle', data),

  // SuperAdmin AI Natural Language Analytics
  aiAnalytics: (query, filters, config) => API.post('/superadmin/ai/analytics', { query, filters }, config),
};

// ============================================================
// CANDIDATE APIs
// ============================================================
export const candidateAPI = {
  getAvailableJobs: () => API.get('/candidate/jobs'),
  applyToJob: (jobId, data) => API.post(`/candidate/jobs/${jobId}/apply`, data),
  getMyApplications: () => API.get('/candidate/applications'),
  withdrawApplication: (appId) => API.delete(`/candidate/applications/${appId}`),
  getCandidateProfile: () => API.get('/candidate/profile'),
  updateCandidateProfile: (data) => API.put('/candidate/profile', data),
  getSettings: () => API.get('/candidate/settings'),
  updateSettings: (data) => API.put('/candidate/settings', data),
  getDashboardStats: () => API.get('/candidate/dashboard'),
  toggleSaveJob: (jobId) => API.post(`/candidate/jobs/${jobId}/save`),
  getSavedJobs: () => API.get('/candidate/saved-jobs'),
  
  getOffers: () => API.get('/candidate/offers'),
  respondToOffer: (id, data) => API.patch(`/candidate/offers/${id}/respond`, data),
  aiBuildResume: (details) => API.post('/candidate/ai/resume-builder', { details }).catch(() => API.post('/employee/ai/resume-builder', { details })),
  getIndustryProfiles: () => API.get('/candidate/ai/industry-profiles'),
  analyzeResumeScore: (data) => API.post('/candidate/ai/resume-score', data),
  getResumeScoreHistory: () => API.get('/candidate/ai/resume-score/history'),
  clearResumeScoreHistory: () => API.delete('/candidate/ai/resume-score/history'),
  getInterviews: () => API.get('/candidate/interviews'),
  rescheduleInterview: (id, data) => API.post(`/candidate/interviews/${id}/reschedule`, data),
  cancelInterview: (id, data) => API.patch(`/candidate/interviews/${id}/cancel`, data),
  getChecklist: () => API.get('/candidate/checklist'),
  updateChecklist: (checklist) => API.put('/candidate/checklist', { checklist }),
};


// ============================================================
// GLOBAL SETTINGS APIs
// ============================================================
export const settingsAPI = {
  getSettings: () => API.get("/settings"),
  updateSettings: (data) => API.put("/settings", data),
};

// ============================================================
// NOTIFICATION APIs
// ============================================================
export const notificationAPI = {
  getNotifications: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
  clearAllNotifications: () => API.delete('/notifications'),
};

// ============================================================
// Reimbursement APIs (Final Approver)
// ============================================================
export const reimbursementAPI = {
  // Fetch all claims for org with optional tab filter and search query
  getFinalApprovals: (params = {}) => API.get('/reimbursements/approvals', { params }),
  reviewFinalApproval: (id, data) => API.patch(`/reimbursements/${id}/approve`, data),
  processPayment: (id, data) => API.patch(`/reimbursements/${id}/process-payment`, data),
};

// ============================================================
// PUBLIC APIs (No authentication required)
// ============================================================
export const publicAPI = {
  bookDemo: (data) => API.post('/public/demo-booking', data),
  submitContact: (data) => API.post('/public/contact', data),
  submitCareerApplication: (data) => API.post('/public/career-apply', data),
  getAvailableJobs: () => API.get('/public/jobs'),
  getPlatformStats: () => API.get('/public/platform-stats'),
  getPricingPlans: () => API.get('/pricing'),
  registerOrganization: (data) => API.post('/public/register-organization', data),
  setupPassword: (data) => API.post('/public/setup-password', data),
  validateInvitation: (data) => API.post('/public/validate-invitation', data),
};

// ============================================================
// UPLOAD APIs (Cloud file uploads — Cloudinary/ImageKit)
// ============================================================
export const uploadAPI = {
  uploadImage: (file, folder = 'hcm/images') => {
    const formData = new FormData();
    formData.append('file', file);
    return UploadAPI.post(`/upload/image?folder=${encodeURIComponent(folder)}`, formData);
  },
  uploadImageFile: (file, folder = 'hcm/images') => uploadAPI.uploadImage(file, folder),
  uploadDocument: (file, folder = 'hcm/documents') => {
    const formData = new FormData();
    formData.append('file', file);
    return UploadAPI.post(`/upload/document?folder=${encodeURIComponent(folder)}`, formData);
  },
  uploadDocumentFile: (file, folder = 'hcm/documents') => uploadAPI.uploadDocument(file, folder),
  uploadAuto: (file, folder = 'hcm/uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    return UploadAPI.post(`/upload/auto?folder=${encodeURIComponent(folder)}`, formData);
  },
  uploadFile: (file, folder = 'hcm/uploads') => uploadAPI.uploadAuto(file, folder),
};

// ============================================================
// BACKUP & DATA EXPORT APIs (Organization-scoped)
// ============================================================
export const backupAPI = {
  getModules: () => API.get('/admin/backups/modules'),
  getOverview: () => API.get('/admin/backups/overview'),
  getBackups: () => API.get('/admin/backups'),
  createBackup: (data) => API.post('/admin/backups', data),
  getStatus: (id) => API.get(`/admin/backups/${id}/status`),
  deleteBackup: (id) => API.delete(`/admin/backups/${id}`),
  sendEmail: (id, data) => API.post(`/admin/backups/${id}/email`, data),
  saveToGoogleDrive: (id) => API.post(`/admin/backups/${id}/google-drive`),
  downloadBackupUrl: (id) => `${getBaseURL()}/admin/backups/${id}/download`,
};

// ============================================================
// GOOGLE DRIVE INTEGRATION APIs
// ============================================================
export const googleDriveAPI = {
  getStatus: () => API.get('/admin/google-drive/status'),
  getConnectUrl: () => API.get('/admin/google-drive/connect'),
  disconnect: () => API.post('/admin/google-drive/disconnect'),
};

// ============================================================
// PAYROLL CONFIGURATION APIs (Enterprise CTC, Structures, Components, Taxes)
// ============================================================
export const payrollConfigAPI = {
  getStructures: () => API.get('/admin/salary-structures'),
  createStructure: (data) => API.post('/admin/salary-structures', data),
  updateStructure: (id, data) => API.put(`/admin/salary-structures/${id}`, data),
  deleteStructure: (id) => API.delete(`/admin/salary-structures/${id}`),
  setDefaultStructure: (id) => API.patch(`/admin/salary-structures/${id}/default`),

  getComponents: () => API.get('/admin/payroll-config/components'),
  createComponent: (data) => API.post('/admin/payroll-config/components', data),
  updateComponent: (id, data) => API.put(`/admin/payroll-config/components/${id}`, data),
  deleteComponent: (id) => API.delete(`/admin/payroll-config/components/${id}`),

  getDeductions: () => API.get('/admin/payroll-config/deductions'),
  createDeduction: (data) => API.post('/admin/payroll-config/deductions', data),
  updateDeduction: (id, data) => API.put(`/admin/payroll-config/deductions/${id}`, data),
  deleteDeduction: (id) => API.delete(`/admin/payroll-config/deductions/${id}`),

  getTaxes: () => API.get('/admin/payroll-config/taxes'),
  createTax: (data) => API.post('/admin/payroll-config/taxes', data),
  updateTax: (id, data) => API.put(`/admin/payroll-config/taxes/${id}`, data),
  deleteTax: (id) => API.delete(`/admin/payroll-config/taxes/${id}`),
};

// ============================================================
// APPROVAL WORKFLOW APIs
// ============================================================
export const approvalWorkflowAPI = {
  getWorkflows: () => API.get('/approval-workflows'),
  getWorkflowByModule: (module) => API.get(`/approval-workflows/module/${module}`),
  createWorkflow: (data) => API.post('/approval-workflows', data),
  updateWorkflow: (id, data) => API.put(`/approval-workflows/${id}`, data),
  toggleStatus: (id, isActive, status) => API.patch(`/approval-workflows/${id}/status`, { isActive, status }),
  archiveWorkflow: (id) => API.delete(`/approval-workflows/${id}`),
  unarchiveWorkflow: (id) => API.put(`/approval-workflows/${id}/unarchive`),
  hardDeleteWorkflow: (id) => API.delete(`/approval-workflows/${id}/hard`),
  getTimeline: (module, entityId) => API.get(`/approvals/${module}/${entityId}/timeline`),
  getCurrentStep: (module, entityId) => API.get(`/approvals/${module}/${entityId}/current-step`),
  approveEntity: (module, entityId, comments) => API.post(`/approvals/${module}/${entityId}/approve`, { comments }),
  rejectEntity: (module, entityId, comments) => API.post(`/approvals/${module}/${entityId}/reject`, { comments }),
};

// ============================================================
// AI COPILOT APIs
// ============================================================
export const aiCopilotAPI = {
  chat: ({ message, conversationId, context, history, pageContext }) => 
    API.post('/ai/chat', { 
      message, 
      conversationId, 
      context, 
      history, 
      pageContext: pageContext || (context && context.page) 
    }).catch(() => 
      API.post('/copilot/chat', { 
        message, 
        conversationId, 
        context, 
        history, 
        pageContext: pageContext || (context && context.page) 
      })
    ),
  getHistory: (conversationId) => 
    API.get(`/ai/history/${conversationId}`).catch(() => API.get(`/copilot/history/${conversationId}`)),
  getSuggestions: (params) => 
    API.get('/ai/suggestions', { params }).catch(() => API.get('/copilot/suggestions', { params })),
};

export default API;

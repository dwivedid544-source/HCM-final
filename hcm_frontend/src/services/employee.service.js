import API, { employeeAPI } from '../utils/apiService';

export const employeeService = {
  // Dashboard
  getDashboard: () => employeeAPI.getDashboard(),

  // Profile
  getProfile: () => employeeAPI.getProfile(),
  updateProfile: (data) => employeeAPI.updateProfile(data),

  // Attendance
  getCurrentAttendance: () => employeeAPI.getCurrentAttendance(),
  getAttendanceHistory: (params) => employeeAPI.getAttendanceHistory(params),
  getAttendance: (params) => employeeAPI.getAttendance(params),
  clockIn: (data) => employeeAPI.clockIn(data),
  clockOut: () => employeeAPI.clockOut(),
  checkIn: (data) => employeeAPI.checkIn(data),
  checkOut: () => employeeAPI.checkOut(),

  // Leaves
  getLeaveBalance: () => employeeAPI.getLeaveBalance(),
  getLeaves: (params) => employeeAPI.getLeaves(params),
  getLeaveSummary: () => employeeAPI.getLeaveSummary(),
  requestLeave: (data) => employeeAPI.requestLeave(data),
  applyLeave: (data) => employeeAPI.applyLeave(data),
  cancelLeave: (id) => employeeAPI.cancelLeave(id),

  // Payroll
  getPayroll: () => API.get('/employee/payroll'),
  downloadPayslip: (id) => API.get(`/employee/payslip/${id}/download`, { responseType: 'blob' }),
  getPayslips: () => employeeAPI.getPayslips(),
  getCompensation: () => API.get('/employee/compensation').catch(() => ({ data: null })),
  getPayrollSnapshots: () => API.get('/employee/payroll/snapshots'),

  // Performance
  getPerformance: () => API.get('/employee/performance'),
  createGoal: (data) => API.post('/employee/performance/goals', data),
  updateGoal: (id, data) => API.patch(`/employee/performance/goals/${id}`, data),
  deleteGoal: (id) => API.delete(`/employee/performance/goals/${id}`),
  updateGoalProgress: (id, progress) => API.post(`/employee/performance/goals/${id}/progress`, { progress }),
  upsertSkill: (data) => API.post('/employee/performance/skills', data),
  deleteSkill: (id) => API.delete(`/employee/performance/skills/${id}`),
  requestReview: (data) => API.post('/employee/performance/request-review', data),

  // Benefits
  getBenefits: () => employeeAPI.getBenefits(),
  enrollBenefitPlan: (data) => employeeAPI.enrollBenefitPlan(data),
  enrollBenefitById: (id) => API.post(`/employee/benefits/${id}/enroll`),
  unenrollBenefitPlan: (data) => employeeAPI.unenrollBenefitPlan(data),
  unenrollBenefitById: (id) => API.post(`/employee/benefits/${id}/unenroll`),
  getReimbursements: () => API.get('/employee/reimbursements'),
  submitReimbursement: (data) => API.post('/employee/reimbursements', data),
  submitBenefitClaim: (data) => API.post('/employee/benefits/claims', data),


  // Tasks
  getTasks: () => employeeAPI.getTasks(),

  // HelpDesk & Tickets
  getTickets: () => employeeAPI.getTickets(),
  createTicket: (data) => employeeAPI.createTicket(data),
  replyTicket: (id, text, attachmentBase64) => employeeAPI.replyTicket(id, text, attachmentBase64),
  deleteTicketMessage: (id, msgId) => employeeAPI.deleteTicketMessage(id, msgId),

  // Holidays & Announcements
  getHolidays: () => employeeAPI.getHolidays(),
  getAnnouncements: () => employeeAPI.getAnnouncements(),

  // Documents
  getDocuments: (params) => API.get('/employee/documents', { params }),
  getDocumentsDashboard: () => API.get('/employee/documents/dashboard'),
  getDocumentCategories: () => API.get('/employee/document-categories'),
  uploadDocument: (formData) => API.post('/employee/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (id) => API.delete(`/employee/documents/${id}`),
  downloadDocument: (id) => `${API.defaults?.baseURL || ''}/employee/documents/${id}/download`,
  aiDocumentAnalyze: (formData) => API.post('/employee/ai/document-analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),


  // Resignation
  getResignation: () => employeeAPI.getResignation(),
  submitResignation: (data) => employeeAPI.submitResignation(data),

  // Compliance Policies
  getPolicies: () => employeeAPI.getPolicies(),
  acknowledgePolicy: (id) => employeeAPI.acknowledgePolicy(id),

  // Account Settings & Security
  getSettings: () => employeeAPI.getSettings(),
  updateSettings: (data) => employeeAPI.updateSettings(data),
  updatePassword: (data) => employeeAPI.updatePassword(data),

  // AI Endpoints
  aiBuildResume: (details) => employeeAPI.aiBuildResume(details),
  aiPolicyAssistant: (query, history, pageContext) => employeeAPI.aiPolicyAssistant(query, history, pageContext),
  aiPayrollInsights: (employeeId, payslipData) => employeeAPI.aiPayrollInsights(employeeId, payslipData),
  aiGenerateLetter: (letterType, contextData) => employeeAPI.aiGenerateLetter(letterType, contextData),
};

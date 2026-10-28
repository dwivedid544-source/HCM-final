import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  Users, 
  Building2, 
  DollarSign, 
  Gift, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Calendar,
  Layers,
  Printer,
  Loader2
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { adminAPI } from '../../../utils/apiService';
import { generateReportPDF } from '../../../utils/reportPdfGenerator';
import { cn } from '../../../utils/cn';

const ReportPreviewModal = ({ isOpen, onClose, report }) => {
  const adminContext = useAdmin();
  const { 
    users = [], 
    departments = [], 
    payrollList = [], 
    benefits = [], 
    shifts = [], 
    holidays = [],
    policies = [],
    systemLogs = [], 
    aiModules = [],
    showToast 
  } = adminContext || {};

  const [downloading, setDownloading] = useState(false);

  if (!report) return null;

  const modules = Array.isArray(report.modules) && report.modules.length > 0
    ? report.modules
    : [report.category || 'General Analytics'];

  const totalPayrollVal = payrollList.reduce((acc, p) => acc + (parseFloat(p.netSalary || p.salary || p.monthlyCTC || 0) || 0), 0);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const moduleList = Array.isArray(report.modules) ? report.modules : [];
      const res = await adminAPI.getReportData(moduleList);
      const realData = res.data?.data || {};

      generateReportPDF(report, {
        users: realData.users || users,
        departments: realData.departments || departments,
        payrollList: realData.payrollSnapshots || realData.payslips || payrollList,
        benefits: realData.benefitPlans || benefits,
        shifts,
        holidays,
        policies: realData.policies || policies,
        systemLogs: realData.auditLogs || systemLogs,
        aiModules
      });
      showToast('PDF report downloaded successfully');
    } catch (err) {
      console.warn('Backend report data fetch fallback:', err);
      try {
        generateReportPDF(report, {
          users,
          departments,
          payrollList,
          benefits,
          shifts,
          holidays,
          policies,
          systemLogs,
          aiModules
        });
        showToast('PDF report downloaded successfully');
      } catch (e) {
        showToast('Failed to download PDF', 'error');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                  <FileText size={26} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {report.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Generated {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {report.format || 'Full Analytics'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                  id="preview-download-pdf-btn"
                >
                  {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  id="preview-close-btn"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body / Report Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50/30 dark:bg-slate-900/30">
              {/* Modules Tags Banner */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Included Modules:</span>
                {modules.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50"
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* 1. Executive Summary KPI Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16}/>
                  1. Executive Organization Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Workforce</span>
                      <Users size={16} className="text-indigo-500"/>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{users.length || 0}</p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active Staff</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
                      <Building2 size={16} className="text-blue-500"/>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{departments.length || 0}</p>
                    <span className="text-[10px] font-bold text-slate-400">Operational Units</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Payroll</span>
                      <DollarSign size={16} className="text-emerald-500"/>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      ${totalPayrollVal > 0 ? totalPayrollVal.toLocaleString() : '0'}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Disbursal Pool</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benefit Plans</span>
                      <Gift size={16} className="text-rose-500"/>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{benefits.length || 0}</p>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Configured Packages</span>
                  </div>
                </div>
              </div>

              {/* 2. Workforce Dataset Table */}
              {modules.some(m => m.toLowerCase().includes('workforce') || m.toLowerCase().includes('employee') || m.toLowerCase().includes('user')) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={16}/>
                    2. Workforce Roster & Deployment
                  </h3>
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="hcm-table-container">
                      <table className="w-full text-left border-collapse text-xs hcm-table">
                        <thead className="hcm-thead">
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hcm-tr">
                            <th className="p-3.5 pl-5 hcm-th">Employee Name</th>
                            <th className="p-3.5 hcm-th">Email</th>
                            <th className="p-3.5 hcm-th">Department</th>
                            <th className="p-3.5 hcm-th">Role</th>
                            <th className="p-3.5 text-right pr-5 hcm-th">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {users.length > 0 ? (
                            users.slice(0, 8).map((u, i) => (
                              <tr key={i}>
                                <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white hcm-td">{u.name || (u.email ? u.email.split('@')[0] : 'Employee')}</td>
                                <td className="p-3.5 text-slate-500 hcm-td">{u.email || 'N/A'}</td>
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 hcm-td">{u.department || (typeof u.department === 'object' ? u.department?.name : 'General')}</td>
                                <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400 hcm-td">{u.role || 'STAFF'}</td>
                                <td className="p-3.5 text-right pr-5 hcm-td">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    {u.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">No workforce records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Financials & Payroll Dataset Table */}
              {modules.some(m => m.toLowerCase().includes('financial') || m.toLowerCase().includes('payroll') || m.toLowerCase().includes('compensation')) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={16}/>
                    3. Compensation & Payroll Disbursals
                  </h3>
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="hcm-table-container">
                      <table className="w-full text-left border-collapse text-xs hcm-table">
                        <thead className="hcm-thead">
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hcm-tr">
                            <th className="p-3.5 pl-5 hcm-th">Recipient</th>
                            <th className="p-3.5 hcm-th">Payroll Cycle</th>
                            <th className="p-3.5 hcm-th">Gross Pay</th>
                            <th className="p-3.5 hcm-th">Deductions</th>
                            <th className="p-3.5 hcm-th">Net Disbursed</th>
                            <th className="p-3.5 text-right pr-5 hcm-th">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {payrollList.length > 0 ? (
                            payrollList.slice(0, 6).map((p, i) => (
                              <tr key={i}>
                                <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white hcm-td">{p.employee?.fullName || p.employeeName || p.name || 'Staff Member'}</td>
                                <td className="p-3.5 text-slate-500 hcm-td">{p.monthYear || p.period || 'Current Cycle'}</td>
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono hcm-td">${parseFloat(p.grossSalary || p.gross || p.monthlyCTC || 0).toLocaleString()}</td>
                                <td className="p-3.5 text-rose-500 font-mono hcm-td">-${parseFloat(p.totalDeductions || p.deductions || 0).toLocaleString()}</td>
                                <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono hcm-td">${parseFloat(p.netSalary || p.salary || p.monthlyCTC || 0).toLocaleString()}</td>
                                <td className="p-3.5 text-right pr-5 hcm-td">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    {p.status || 'Processed'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400">No payroll records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Benefits Dataset */}
              {modules.some(m => m.toLowerCase().includes('benefit') || m.toLowerCase().includes('health') || m.toLowerCase().includes('wellness')) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Gift size={16}/>
                    4. Corporate Benefits & Health Packages
                  </h3>
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="hcm-table-container">
                      <table className="w-full text-left border-collapse text-xs hcm-table">
                        <thead className="hcm-thead">
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hcm-tr">
                            <th className="p-3.5 pl-5 hcm-th">Plan Name</th>
                            <th className="p-3.5 hcm-th">Category</th>
                            <th className="p-3.5 hcm-th">Provider</th>
                            <th className="p-3.5 hcm-th">Employer Contribution</th>
                            <th className="p-3.5 text-right pr-5 hcm-th">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {benefits.length > 0 ? (
                            benefits.map((b, i) => (
                              <tr key={i}>
                                <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white hcm-td">{b.name}</td>
                                <td className="p-3.5 text-slate-500 hcm-td">{b.category}</td>
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 hcm-td">{b.provider}</td>
                                <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono hcm-td">${parseFloat(b.contribution || b.employerContribution || 0).toLocaleString()}</td>
                                <td className="p-3.5 text-right pr-5 hcm-td">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    {b.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">No benefit packages configured</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Compliance & Audits Dataset */}
              {modules.some(m => m.toLowerCase().includes('compliance') || m.toLowerCase().includes('audit') || m.toLowerCase().includes('hiring') || m.toLowerCase().includes('ai')) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16}/>
                    5. Security & Compliance Audit Traces
                  </h3>
                  <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="hcm-table-container">
                      <table className="w-full text-left border-collapse text-xs hcm-table">
                        <thead className="hcm-thead">
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hcm-tr">
                            <th className="p-3.5 pl-5 hcm-th">Event Action</th>
                            <th className="p-3.5 hcm-th">Module Context</th>
                            <th className="p-3.5 hcm-th">Actor</th>
                            <th className="p-3.5 hcm-th">Client IP</th>
                            <th className="p-3.5 text-right pr-5 hcm-th">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {systemLogs.length > 0 ? (
                            systemLogs.slice(0, 6).map((l, i) => (
                              <tr key={i}>
                                <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white hcm-td">{l.action}</td>
                                <td className="p-3.5 text-slate-500 hcm-td">{l.module || 'System Core'}</td>
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 hcm-td">{typeof l.user === 'object' && l.user !== null ? l.user.email : (l.user || 'Administrator')}</td>
                                <td className="p-3.5 font-mono text-slate-500 hcm-td">{l.ip || '127.0.0.1'}</td>
                                <td className="p-3.5 text-right pr-5 hcm-td">
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                    {l.status || 'Success'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400">No system audit records logged</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
              <span className="text-xs text-slate-400 font-medium">
                Confidential Enterprise Report • Generated by HCM.ai
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="btn-secondary w-full sm:w-auto text-xs"
                  id="preview-footer-close-btn"
                >
                  Close Preview
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary w-full sm:w-auto text-xs flex items-center justify-center gap-1.5"
                  id="preview-footer-download-btn"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Download Official PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportPreviewModal;

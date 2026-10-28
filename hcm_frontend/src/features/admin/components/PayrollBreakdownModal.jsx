import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, X, Loader2, CheckCircle2, Download, Printer,
  User, Briefcase, AlertCircle, ChevronRight
} from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { useCurrency } from '../../../hooks/useCurrency';
import { cn } from '../../../utils/cn';
import { downloadPayslipPDF } from '../../../utils/printAndPdfUtils';

// ──────────────────────────────────────────
// Styled input for this modal
// ──────────────────────────────────────────
const NumInput = ({ label, value, onChange, icon: Icon, sub }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-0.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm font-bold">
          {Icon}
        </div>
      )}
      <input
        type="number"
        min={0}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full h-11 rounded-xl border text-sm font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400',
          'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all',
          Icon ? 'pl-8' : 'pl-4', 'pr-4'
        )}
      />
    </div>
    {sub && <p className="text-[10px] text-slate-400 px-0.5">{sub}</p>}
  </div>
);

// ──────────────────────────────────────────
// Payslip printable content (used both in the preview and in print)
// ──────────────────────────────────────────
const PayslipContent = ({ employee, formData, formatCurrency, defaultCurrency, selectedMonth }) => {
  const basicVal        = parseInt(formData.basic)      || 0;
  const bonusVal        = parseInt(formData.bonus)       || 0;
  const customDeductions = parseInt(formData.deductions) || 0;

  const fedTax        = Math.round(basicVal * 0.12);
  const socialSecurity = Math.round(basicVal * 0.062);
  const medicare      = Math.round(basicVal * 0.0145);
  const stateTax      = Math.round(basicVal * 0.04);
  const totalTax      = fedTax + socialSecurity + medicare + stateTax;
  const totalEarnings = basicVal + bonusVal;
  const netPayable    = totalEarnings - customDeductions - totalTax;

  const companyName = 'GlobalTech Solutions';
  const now = new Date();

  return (
    <div className="space-y-5 text-left">
      {/* Payslip Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{companyName}</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enterprise Employee Paystub</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold font-mono text-slate-400">
            PAYSLIP: #{employee.id?.slice(0, 8).toUpperCase() || 'DRAFT'}
          </span>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Month: <strong className="text-slate-700 dark:text-slate-300">{selectedMonth || employee.month || '—'}</strong>
          </p>
          <p className="text-[10px] text-slate-400">
            Generated: {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employee Details</p>
          <p className="font-black text-slate-800 dark:text-slate-200">{employee.name}</p>
          <p className="text-slate-400 font-mono mt-0.5">{employee.employeeId || employee.empId || '—'}</p>
          <p className="text-slate-500 mt-0.5">{employee.role || 'Employee'} • {employee.department || 'N/A'}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Attendance Summary</p>
          <p className="text-slate-600 dark:text-slate-400">Working Days: <strong>{employee.totalWorkingDays ?? 0}</strong></p>
          <p className="text-slate-600 dark:text-slate-400">Days Present: <strong>{employee.presentDays ?? 0}</strong></p>
          <p className="text-slate-600 dark:text-slate-400">Paid Leaves: <strong>{employee.paidLeaveDays ?? 0}</strong></p>
          <p className="text-slate-600 dark:text-slate-400">LOP Days: <strong>{employee.unpaidLeaveDays ?? 0}</strong></p>
        </div>
      </div>

      {/* Earnings vs Deductions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5 text-xs">
          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">
            Earnings
          </h4>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Basic Salary</span>
            <span className="font-bold">{formatCurrency(basicVal, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Bonus &amp; Allowances</span>
            <span className="font-bold">{formatCurrency(bonusVal, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1.5 font-black border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 mt-1">
            <span>Gross Earnings</span>
            <span>{formatCurrency(totalEarnings, defaultCurrency)}</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">
            Deductions
          </h4>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Federal Income Tax (12%)</span>
            <span className="font-bold text-rose-500">−{formatCurrency(fedTax, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Social Security (6.2%)</span>
            <span className="font-bold text-rose-500">−{formatCurrency(socialSecurity, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Medicare (1.45%)</span>
            <span className="font-bold text-rose-500">−{formatCurrency(medicare, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>State Tax (4%)</span>
            <span className="font-bold text-rose-500">−{formatCurrency(stateTax, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
            <span>Custom Deductions</span>
            <span className="font-bold text-rose-500">−{formatCurrency(customDeductions, defaultCurrency)}</span>
          </div>
          <div className="flex justify-between py-1.5 font-black border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 mt-1">
            <span>Total Withheld</span>
            <span className="text-rose-500">−{formatCurrency(totalTax + customDeductions, defaultCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Net Salary Payable</span>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            {formatCurrency(netPayable, defaultCurrency)}
          </h3>
        </div>
        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 uppercase tracking-wide">
          Draft
        </span>
      </div>

      {/* Footer */}
      <p className="text-center text-[9px] text-slate-400 dark:text-slate-600 border-t pt-3 border-slate-100 dark:border-slate-800">
        Computer-generated document — no physical signature required. {companyName} © {new Date().getFullYear()}
      </p>
    </div>
  );
};

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────
const PayrollBreakdownModal = ({ isOpen, onClose, employee, selectedMonth }) => {
  const { formatCurrency, getIcon }                      = useCurrency();
  const { updatePayrollDetails, showToast, appSettings } = useAdmin();
  const defaultCurrency = appSettings?.general?.defaultCurrency;
  const CurrencyIcon    = getIcon(defaultCurrency);
  const printRef        = useRef(null);

  const [formData, setFormData] = useState({ basic: 0, bonus: 0, deductions: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        basic:      employee.basic      || 0,
        bonus:      employee.bonus      || 0,
        deductions: employee.deductions || 0,
      });
    }
    setIsSuccess(false);
    setIsSaving(false);
  }, [employee, isOpen]);

  // Close on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!employee) return null;

  const basicVal         = parseInt(formData.basic)      || 0;
  const bonusVal         = parseInt(formData.bonus)       || 0;
  const customDeductions = parseInt(formData.deductions) || 0;
  const fedTax           = Math.round(basicVal * 0.12);
  const socialSecurity   = Math.round(basicVal * 0.062);
  const medicare         = Math.round(basicVal * 0.0145);
  const stateTax         = Math.round(basicVal * 0.04);
  const totalTax         = fedTax + socialSecurity + medicare + stateTax;
  const totalEarnings    = basicVal + bonusVal;
  const netPayable       = totalEarnings - customDeductions - totalTax;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePayrollDetails(employee.id, {
        basic:      basicVal,
        bonus:      bonusVal,
        deductions: customDeductions,
        net:        netPayable,
      });
      showToast(`Salary details saved for ${employee.name} — Net: ${formatCurrency(netPayable, defaultCurrency)}`, 'success');
      setIsSuccess(true);
      setTimeout(() => { setIsSuccess(false); onClose(); }, 800);
    } catch (err) {
      showToast('Failed to save salary details. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Proper isolated print — only the payslip content
  const handlePrint = () => {
    if (!printRef.current) { window.print(); return; }
    setIsPrinting(true);
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip — ${employee.name} — ${selectedMonth || employee.month || ''}</title>
        <meta charset="utf-8" />
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1e293b; background: white; }
          .space-y-5 > * + * { margin-top: 20px; }
          .space-y-1\\.5 > * + * { margin-top: 6px; }
          .grid { display: grid; gap: 16px; }
          .grid-cols-2 { grid-template-columns: 1fr 1fr; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .gap-3 { gap: 12px; }
          .gap-5 { gap: 20px; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 13px; }
          .text-base { font-size: 15px; }
          .text-2xl { font-size: 22px; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .font-mono { font-family: monospace; }
          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.025em; }
          .tracking-widest { letter-spacing: 0.1em; }
          .border-b { border-bottom: 1px solid #e2e8f0; }
          .border-t { border-top: 1px solid #e2e8f0; }
          .pb-4 { padding-bottom: 16px; }
          .pb-1\\.5 { padding-bottom: 6px; }
          .pt-3 { padding-top: 12px; }
          .mt-0\\.5 { margin-top: 2px; }
          .mt-1 { margin-top: 4px; }
          .mt-1\\.5 { margin-top: 6px; }
          .py-1 { padding: 4px 0; }
          .py-1\\.5 { padding: 6px 0; }
          .p-4 { padding: 16px; }
          .px-3 { padding: 0 12px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .rounded-xl { border-radius: 12px; }
          .rounded-full { border-radius: 9999px; }
          .border { border: 1px solid #e2e8f0; }
          .bg-emerald { background: #f0fdf4; }
          .text-emerald-700 { color: #15803d; }
          .text-emerald-600 { color: #16a34a; }
          .text-rose-500 { color: #ef4444; }
          .text-slate-400 { color: #94a3b8; }
          .text-slate-500 { color: #64748b; }
          .text-slate-600 { color: #475569; }
          .text-slate-700 { color: #334155; }
          .text-slate-800 { color: #1e293b; }
          .text-slate-900 { color: #0f172a; }
          .text-amber-800 { color: #92400e; }
          .net-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
          .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 4px 12px; border-radius: 9999px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
          .footer { text-align: center; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
      setIsPrinting(false);
    }, 400);
  };

  // Real client-side PDF download using jsPDF
  const handleDownload = () => {
    try {
      const record = {
        ...employee,
        month: selectedMonth || employee.month,
        basic: basicVal,
        bonus: bonusVal,
        deductions: customDeductions + totalTax,
        net: netPayable,
        grossSalary: totalEarnings
      };
      downloadPayslipPDF(record, {
        companyName: 'GlobalTech Solutions',
        currency: defaultCurrency
      });
      showToast(`Payslip PDF downloaded for ${employee.name}`, 'success');
    } catch (err) {
      console.error('Direct PDF error, falling back to print:', err);
      handlePrint();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-[1.1rem] bg-slate-900 dark:bg-primary-600 text-white flex items-center justify-center shadow-lg shrink-0">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    Payroll &amp; Tax Calculator
                  </h2>
                  <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 mt-1 uppercase tracking-wider">
                    {employee.name} · {selectedMonth || employee.month || 'Current Period'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── BODY (scrollable) ── */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">

                  {/* ── LEFT: Inputs ── */}
                  <div className="px-5 sm:px-8 py-6 space-y-5">
                    {/* Employee mini card */}
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                        {(employee.name || 'EM').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{employee.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{employee.employeeId || employee.empId || '—'} · {employee.role}</p>
                      </div>
                      <span className="ml-auto text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                        {employee.status || 'Active'}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Salary Inputs</p>
                      <div className="space-y-3">
                        <NumInput
                          label="Basic Salary"
                          value={formData.basic}
                          onChange={(e) => setFormData(p => ({ ...p, basic: e.target.value }))}
                          icon={<CurrencyIcon size={14} />}
                          sub="Monthly fixed component before allowances"
                        />
                        <NumInput
                          label="Bonus & Allowances"
                          value={formData.bonus}
                          onChange={(e) => setFormData(p => ({ ...p, bonus: e.target.value }))}
                          icon={<CurrencyIcon size={14} />}
                          sub="Variable pay, HRA, travel, performance bonus"
                        />
                        <NumInput
                          label="Custom Deductions"
                          value={formData.deductions}
                          onChange={(e) => setFormData(p => ({ ...p, deductions: e.target.value }))}
                          icon={<CurrencyIcon size={14} />}
                          sub="Loan repayment, advance, miscellaneous"
                        />
                      </div>
                    </div>

                    {/* Live computation summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 space-y-2 text-xs">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Calculation</p>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Gross Earnings</span>
                        <span className="font-bold">{formatCurrency(totalEarnings, defaultCurrency)}</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>Statutory Taxes ({formatCurrency(totalTax, defaultCurrency)})</span>
                        <span className="font-bold">−{((totalTax / (totalEarnings || 1)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-rose-400">
                        <span>Custom Deductions</span>
                        <span className="font-bold">−{formatCurrency(customDeductions, defaultCurrency)}</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span>Net Take-Home</span>
                        <span>{formatCurrency(netPayable, defaultCurrency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT: Payslip Preview ── */}
                  <div className="px-5 sm:px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payslip Preview</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrint}
                          disabled={isPrinting}
                          className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Printer size={11} />
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={isPrinting}
                          className="h-7 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Download size={11} />
                          PDF
                        </button>
                      </div>
                    </div>

                    <div
                      ref={printRef}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm"
                    >
                      <PayslipContent
                        employee={employee}
                        formData={formData}
                        formatCurrency={formatCurrency}
                        defaultCurrency={defaultCurrency}
                        selectedMonth={selectedMonth}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div className="shrink-0 px-5 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  {isSuccess && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 size={13} /> Saved!
                    </span>
                  )}
                  {!isSuccess && (
                    <span className="text-slate-400">
                      Net payable: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(netPayable, defaultCurrency)}</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isSuccess}
                    className={cn(
                      'h-10 px-5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all cursor-pointer',
                      isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20',
                      (isSaving || isSuccess) && 'opacity-80 cursor-not-allowed'
                    )}
                  >
                    {isSaving ? (
                      <><Loader2 size={14} className="animate-spin" /><span>Saving…</span></>
                    ) : isSuccess ? (
                      <><CheckCircle2 size={14} /><span>Saved!</span></>
                    ) : (
                      <><span>Save Changes</span><ChevronRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PayrollBreakdownModal;

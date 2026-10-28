import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Enterprise PDF & Print Utility for HCM.ai
 * Provides high-fidelity PDF generation and isolated print dialogs
 * across all modules (Admin, Superadmin, Employee, HR).
 */

/**
 * Format currency amount with currency code or symbol
 */
const formatAmount = (val, currency = 'USD') => {
  const num = parseFloat(val) || 0;
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥'
  };
  const sym = symbolMap[currency] || (currency ? `${currency} ` : '$');
  return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Generate and download an enterprise-grade Payslip PDF using jsPDF + autoTable
 * @param {Object} record - Payroll record or employee payroll object
 * @param {Object} options - Configuration options (companyName, currency, etc.)
 */
export const downloadPayslipPDF = (record, options = {}) => {
  if (!record) return;

  const companyName = options.companyName || 'GlobalTech Solutions';
  const currency = options.currency || record.currency || 'USD';
  const month = record.month || options.month || 'Current Period';
  const empName = record.name || record.employeeName || record.employee?.fullName || 'Employee';
  const empId = record.employeeId || record.displayId || record.employee?.employeeId || record.id?.slice(0, 8) || 'N/A';
  const designation = record.designation || record.role || record.employee?.designation || 'Specialist';
  const department = record.department || record.employee?.department || 'Operations';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // ── Header Banner ──
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, 12, contentWidth, 26, 3, 3, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin + 8, 23);

  // Subtitle
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Official Confidential Employee Paystub', margin + 8, 30);

  // Payslip ID & Period (Right aligned)
  const payslipId = (record.id ? `PAY-${record.id.slice(0, 8).toUpperCase()}` : `PAY-${Math.floor(100000 + Math.random() * 900000)}`);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 250, 252);
  doc.text(payslipId, pageWidth - margin - 8, 22, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Period: ${month}`, pageWidth - margin - 8, 29, { align: 'right' });

  let curY = 44;

  // ── Employee Details & Attendance Cards ──
  // Card 1: Employee Details
  const colWidth = (contentWidth - 6) / 2;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, curY, colWidth, 34, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('EMPLOYEE DETAILS', margin + 6, curY + 6);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(empName, margin + 6, curY + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Employee ID: ${empId}`, margin + 6, curY + 21);
  doc.text(`Designation: ${designation}`, margin + 6, curY + 26);
  doc.text(`Department: ${department}`, margin + 6, curY + 31);

  // Card 2: Attendance & Status
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, curY, colWidth, 34, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDANCE & DISBURSAL', rightColX + 6, curY + 6);

  const workDays = record.totalWorkingDays ?? 22;
  const presentDays = record.presentDays ?? record.attendancePresent ?? 22;
  const paidLeaves = record.paidLeaveDays ?? 0;
  const lopDays = record.unpaidLeaveDays ?? record.attendanceAbsent ?? 0;
  const status = record.status || 'Processed';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Working Days:`, rightColX + 6, curY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${workDays} days`, rightColX + colWidth - 6, curY + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Days Present / Paid:`, rightColX + 6, curY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${presentDays} days`, rightColX + colWidth - 6, curY + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Loss of Pay (LOP):`, rightColX + 6, curY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(lopDays > 0 ? 225 : 71, lopDays > 0 ? 29 : 85, lopDays > 0 ? 72 : 105);
  doc.text(`${lopDays} days`, rightColX + colWidth - 6, curY + 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Status:`, rightColX + 6, curY + 31);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(status, rightColX + colWidth - 6, curY + 31, { align: 'right' });

  curY += 40;

  // ── Calculate Earnings & Deductions Tables ──
  const basicVal = parseFloat(record.basic || 0);
  const allowanceVal = parseFloat(record.allowance || 0);
  const bonusVal = parseFloat(record.bonus || 0);
  const overtimeVal = parseFloat(record.overtimeAmount || 0);

  // Check if items array is provided
  let earningsRows = [];
  let deductionsRows = [];

  if (Array.isArray(record.items) && record.items.length > 0) {
    record.items
      .filter(i => ['Earning', 'Allowance', 'Variable Pay'].includes(i.type))
      .forEach(i => {
        earningsRows.push([i.name, formatAmount(i.amount, currency)]);
      });

    record.items
      .filter(i => i.type === 'Deduction')
      .forEach(i => {
        deductionsRows.push([i.name, formatAmount(i.amount, currency)]);
      });
  }

  if (earningsRows.length === 0) {
    earningsRows = [
      ['Basic Salary', formatAmount(basicVal, currency)],
      ['House Rent & Special Allowance', formatAmount(allowanceVal, currency)],
      ['Performance Bonus & Incentives', formatAmount(bonusVal, currency)]
    ];
    if (overtimeVal > 0) {
      earningsRows.push([`Overtime (${record.overtimeHours?.toFixed(1) || '0'} hrs)`, formatAmount(overtimeVal, currency)]);
    }
  }

  const taxVal = parseFloat(record.tax || 0);
  const pfVal = parseFloat(record.pf || 0);
  const lopDeductVal = parseFloat(record.lopDeductionAmount || 0);
  const customDeductVal = parseFloat(record.deductions || 0);

  if (deductionsRows.length === 0) {
    if (taxVal > 0) deductionsRows.push(['Income Tax Withholding (TDS)', formatAmount(taxVal, currency)]);
    if (pfVal > 0) deductionsRows.push(['Provident Fund / Social Security', formatAmount(pfVal, currency)]);
    if (lopDeductVal > 0) deductionsRows.push(['Loss of Pay (LOP) Deduction', formatAmount(lopDeductVal, currency)]);
    if (customDeductVal > 0 && taxVal === 0 && pfVal === 0) {
      deductionsRows.push(['Standard Statutory Deductions', formatAmount(customDeductVal, currency)]);
    }
    if (deductionsRows.length === 0) {
      deductionsRows.push(['Standard Withholding', formatAmount(customDeductVal || 0, currency)]);
    }
  }

  const grossEarnings = parseFloat(record.grossSalary || record.gross) || (basicVal + allowanceVal + bonusVal + overtimeVal);
  const totalDeductions = parseFloat(record.totalDeductions || record.deductions || 0) || (taxVal + pfVal + lopDeductVal + customDeductVal);
  const netPayable = parseFloat(record.net || record.netSalary) || (grossEarnings - totalDeductions);

  // Render Earnings AutoTable (Left side)
  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin + colWidth + 6 },
    tableWidth: colWidth,
    head: [['Earnings Category', 'Amount']],
    body: earningsRows,
    foot: [['Gross Earnings', formatAmount(grossEarnings, currency)]],
    theme: 'plain',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: colWidth * 0.65 },
      1: { cellWidth: colWidth * 0.35, halign: 'right', fontStyle: 'bold' }
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3
    }
  });

  const earningsTableEndY = doc.lastAutoTable.finalY;

  // Render Deductions AutoTable (Right side)
  autoTable(doc, {
    startY: curY,
    margin: { left: rightColX, right: margin },
    tableWidth: colWidth,
    head: [['Deductions / Taxes', 'Amount']],
    body: deductionsRows,
    foot: [['Total Deductions', formatAmount(totalDeductions, currency)]],
    theme: 'plain',
    headStyles: {
      fillColor: [225, 29, 72], // Rose 600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: colWidth * 0.65 },
      1: { cellWidth: colWidth * 0.35, halign: 'right', fontStyle: 'bold' }
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3
    }
  });

  const deductionsTableEndY = doc.lastAutoTable.finalY;
  curY = Math.max(earningsTableEndY, deductionsTableEndY) + 8;

  // ── Net Disbursal Callout Box ──
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, curY, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY PAYABLE (DIRECT DEPOSIT)', margin + 8, curY + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(formatAmount(netPayable, currency), margin + 8, curY + 18);

  // Status badge on right of banner
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(pageWidth - margin - 36, curY + 6, 28, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED', pageWidth - margin - 22, curY + 13.5, { align: 'center' });

  curY += 32;

  // ── Legal Disclaimer & System Verification ──
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, curY, pageWidth - margin, curY);

  curY += 6;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a digitally generated document created by HCM.ai. No physical signature is required.',
    pageWidth / 2,
    curY,
    { align: 'center' }
  );
  doc.text(
    `Generated on ${new Date().toLocaleString()} • Authorized by HR & Payroll Operations`,
    pageWidth / 2,
    curY + 4,
    { align: 'center' }
  );

  // Save the PDF
  const safeName = empName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMonth = month.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Payslip_${safeName}_${safeMonth}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Open an isolated, perfectly formatted print window for a payslip
 * @param {Object} record - Payroll record object
 * @param {Object} options - Custom options (companyName, currency, etc.)
 */
export const printPayslipIsolated = (record, options = {}) => {
  if (!record) return;

  const companyName = options.companyName || 'GlobalTech Solutions';
  const currency = options.currency || record.currency || 'USD';
  const month = record.month || options.month || 'Current Period';
  const empName = record.name || record.employeeName || record.employee?.fullName || 'Employee';
  const empId = record.employeeId || record.displayId || record.employee?.employeeId || record.id?.slice(0, 8) || 'N/A';
  const designation = record.designation || record.role || record.employee?.designation || 'Staff';
  const department = record.department || record.employee?.department || 'Operations';

  const basicVal = parseFloat(record.basic || 0);
  const allowanceVal = parseFloat(record.allowance || 0);
  const bonusVal = parseFloat(record.bonus || 0);
  const overtimeVal = parseFloat(record.overtimeAmount || 0);

  const taxVal = parseFloat(record.tax || 0);
  const pfVal = parseFloat(record.pf || 0);
  const lopDeductVal = parseFloat(record.lopDeductionAmount || 0);
  const customDeductVal = parseFloat(record.deductions || 0);

  const grossEarnings = parseFloat(record.grossSalary || record.gross) || (basicVal + allowanceVal + bonusVal + overtimeVal);
  const totalDeductions = parseFloat(record.totalDeductions || record.deductions || 0) || (taxVal + pfVal + lopDeductVal + customDeductVal);
  const netPayable = parseFloat(record.net || record.netSalary) || (grossEarnings - totalDeductions);

  const workDays = record.totalWorkingDays ?? 22;
  const presentDays = record.presentDays ?? record.attendancePresent ?? 22;
  const paidLeaves = record.paidLeaveDays ?? 0;
  const lopDays = record.unpaidLeaveDays ?? record.attendanceAbsent ?? 0;

  const payslipId = (record.id ? `PAY-${record.id.slice(0, 8).toUpperCase()}` : `PAY-${Math.floor(100000 + Math.random() * 900000)}`);

  const printWin = window.open('', '_blank', 'width=840,height=900');
  if (!printWin) {
    // Popup blocked, fallback to standard window.print
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Payslip — ${empName} (${month})</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 36px;
          max-width: 800px;
          margin: 0 auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header {
          background: #0f172a;
          color: #ffffff;
          padding: 24px 28px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .header h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .header-meta { text-align: right; }
        .badge-id { font-family: monospace; font-size: 12px; font-weight: 700; color: #f8fafc; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
        }
        .card-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        .card h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .row-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 4px 0;
          color: #334155;
        }
        .row-item span:last-child { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        th.earnings { background: #4f46e5; color: white; border-top-left-radius: 10px; border-top-right-radius: 10px; }
        th.deductions { background: #e11d48; color: white; border-top-left-radius: 10px; border-top-right-radius: 10px; }
        td {
          padding: 9px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        td.amt { text-align: right; font-weight: 700; }
        .table-foot td {
          background: #f1f5f9;
          font-weight: 800;
          color: #0f172a;
          border-bottom: none;
        }
        .net-card {
          background: #0f172a;
          color: white;
          padding: 20px 28px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          margin-bottom: 24px;
        }
        .net-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .net-val { font-size: 24px; font-weight: 900; margin-top: 4px; color: #ffffff; }
        .status-pill {
          background: #10b981;
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .footer-note {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          line-height: 1.5;
        }
        @media print {
          body { padding: 0; }
          @page { margin: 1.2cm; size: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${companyName}</h1>
          <p>Official Confidential Employee Paystub</p>
        </div>
        <div class="header-meta">
          <div class="badge-id">${payslipId}</div>
          <p>Period: <strong>${month}</strong></p>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-label">Employee Details</div>
          <h3>${empName}</h3>
          <div class="row-item"><span>Employee ID:</span><span>${empId}</span></div>
          <div class="row-item"><span>Designation:</span><span>${designation}</span></div>
          <div class="row-item"><span>Department:</span><span>${department}</span></div>
        </div>

        <div class="card">
          <div class="card-label">Attendance & Working Summary</div>
          <div class="row-item"><span>Total Working Days:</span><span>${workDays} days</span></div>
          <div class="row-item"><span>Days Present / Paid:</span><span>${presentDays} days</span></div>
          <div class="row-item"><span>Paid Leaves:</span><span>${paidLeaves} days</span></div>
          <div class="row-item">
            <span>Loss of Pay (LOP):</span>
            <span style="color: ${lopDays > 0 ? '#e11d48' : '#334155'}">${lopDays} days</span>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" style="padding: 0; overflow: hidden; background: white;">
          <table>
            <thead><tr><th class="earnings" colspan="2">Earnings & Allowances</th></tr></thead>
            <tbody>
              <tr><td>Basic Salary</td><td class="amt">${formatAmount(basicVal, currency)}</td></tr>
              <tr><td>House Rent & Special Allowance</td><td class="amt">${formatAmount(allowanceVal, currency)}</td></tr>
              <tr><td>Performance Bonus & Incentives</td><td class="amt">${formatAmount(bonusVal, currency)}</td></tr>
              ${overtimeVal > 0 ? `<tr><td>Overtime Pay (${record.overtimeHours?.toFixed(1) || 0} hrs)</td><td class="amt">${formatAmount(overtimeVal, currency)}</td></tr>` : ''}
            </tbody>
            <tfoot>
              <tr class="table-foot"><td>Gross Earnings</td><td class="amt">${formatAmount(grossEarnings, currency)}</td></tr>
            </tfoot>
          </table>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; background: white;">
          <table>
            <thead><tr><th class="deductions" colspan="2">Withholdings & Deductions</th></tr></thead>
            <tbody>
              <tr><td>Income Tax Withholding (TDS)</td><td class="amt">${formatAmount(taxVal, currency)}</td></tr>
              <tr><td>Provident Fund / Social Security</td><td class="amt">${formatAmount(pfVal, currency)}</td></tr>
              ${lopDeductVal > 0 ? `<tr><td style="color: #e11d48; font-weight: 600;">Loss of Pay (LOP) Deduction</td><td class="amt" style="color: #e11d48;">${formatAmount(lopDeductVal, currency)}</td></tr>` : ''}
              ${customDeductVal > 0 && taxVal === 0 ? `<tr><td>Other Statutory Deductions</td><td class="amt">${formatAmount(customDeductVal, currency)}</td></tr>` : ''}
            </tbody>
            <tfoot>
              <tr class="table-foot"><td>Total Withholdings</td><td class="amt">${formatAmount(totalDeductions, currency)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="net-card">
        <div>
          <div class="net-label">Net Salary Disbursal (Direct Deposit)</div>
          <div class="net-val">${formatAmount(netPayable, currency)}</div>
        </div>
        <div>
          <span class="status-pill">${record.status || 'Disbursed'}</span>
        </div>
      </div>

      <div class="footer-note">
        <p>This is a computer-generated document authorized by HCM.ai Payroll Operations and requires no physical signature.</p>
        <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 800);
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
};

/**
 * Print an isolated HTML document or container in a clean popup window
 * @param {string} htmlContent - Body HTML content
 * @param {string} title - Window title
 */
export const printIsolatedHTML = (htmlContent, title = 'Document Print') => {
  const printWin = window.open('', '_blank', 'width=840,height=900');
  if (!printWin) {
    window.print();
    return;
  }

  const completeHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
          padding: 32px;
          margin: 0 auto;
          max-width: 800px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          body { padding: 0; }
          @page { margin: 1cm; size: auto; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 600);
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(completeHtml);
  printWin.document.close();
};

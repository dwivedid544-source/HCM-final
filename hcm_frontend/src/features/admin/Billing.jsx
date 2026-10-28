import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   CreditCard,
   Download,
   Plus,
   CheckCircle2,
   Search,
   History,
   FileText,
   ShieldCheck,
   Zap,
   Calendar,
   ArrowUpRight,
   MoreVertical,
   Filter,
   Info,
   DollarSign,
   PieChart,
   BarChart3,
   Star,
   Mail,
   RefreshCw,
   Eye,
   CornerDownLeft,
   Loader2,
   AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../context/AdminContext';
import { useCurrency } from '../../hooks/useCurrency';
import { useDateFormat } from '../../hooks/useDateFormat';
import UpgradePlanModal from '../../features/admin/components/UpgradePlanModal';
import ExportHistoryModal from '../../features/admin/components/ExportHistoryModal';
import ManageAddonsModal from '../../features/admin/components/ManageAddonsModal';
import InvoiceDrawer from '../../features/admin/components/InvoiceDrawer';
import ActionDropdown from './components/ActionDropdown';
import OpenTicketModal from '../../features/admin/components/OpenTicketModal';
import ConfirmDialog from '../../features/admin/components/ConfirmDialog';
import PageHeader from '../../shared/components/ui/PageHeader';

const Billing = () => {
   const {
      billingPlan,
      invoices = [],
      paymentMethod,
      updatePlan,
      updateInvoice,
      exportInvoices,
      showToast,
      totalActiveEmployees,
      fetchBillingPlan,
      fetchInvoices,
      fetchPaymentMethod
   } = useAdmin();

   const { formatCurrency } = useCurrency();
   const { formatDate } = useDateFormat();
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState('ALL');
   const [isLoading, setIsLoading] = useState(false);

   const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
   const [isExportOpen, setIsExportOpen] = useState(false);
   const [isAddonsOpen, setIsAddonsOpen] = useState(false);
   const [invoiceToView, setInvoiceToView] = useState(null);
   const [isTicketOpen, setIsTicketOpen] = useState(false);
   const [invoiceToRefund, setInvoiceToRefund] = useState(null);

   useEffect(() => {
      let isMounted = true;
      const loadData = async () => {
         setIsLoading(true);
         try {
            await Promise.all([
               fetchBillingPlan?.(),
               fetchInvoices?.(),
               fetchPaymentMethod?.()
            ]);
         } catch (err) {
            console.error('Error fetching billing data:', err);
         } finally {
            if (isMounted) setIsLoading(false);
         }
      };
      loadData();
      return () => { isMounted = false; };
   }, [fetchBillingPlan, fetchInvoices, fetchPaymentMethod]);

   const cleanAmount = (amt) => {
      if (!amt) return 0;
      const num = parseFloat(String(amt).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
   };

   // Filtering invoices
   const filteredInvoices = (invoices || []).filter(inv => {
      const matchSearch = !searchTerm ||
         (inv.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (inv.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (inv.amount || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (inv.method || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchStatus;
   });

   const activePlanName = billingPlan?.name || 'Professional';
   const activePrice = billingPlan?.price !== undefined ? billingPlan.price : 29;
   const activeCycle = billingPlan?.cycle || 'Monthly';
   const activeUsersLimit = billingPlan?.users || totalActiveEmployees || 42;
   let activeAddonsList = ['Premium Support'];
   if (Array.isArray(billingPlan?.addons)) {
      activeAddonsList = billingPlan.addons;
   } else if (typeof billingPlan?.addons === 'string') {
      try {
         activeAddonsList = JSON.parse(billingPlan.addons || '[]');
      } catch (e) {
         activeAddonsList = ['Premium Support'];
      }
   }

   const activeAddonsText = activeAddonsList.length > 0 ? activeAddonsList.join(', ').toUpperCase() : 'NONE';

   const handleDownloadInvoice = (inv) => {
      const dateStr = inv.date ? formatDate(inv.date) : new Date().toLocaleDateString();
      const printWindow = window.open('', '_blank');
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tax Invoice ${inv.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-b: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .inv-id { font-size: 14px; font-weight: 700; color: #64748b; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; }
            th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; }
            .total { font-size: 18px; font-weight: 800; text-align: right; margin-top: 24px; color: #0f172a; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .paid { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">TAX INVOICE</div>
              <div class="inv-id">Invoice #${inv.id}</div>
            </div>
            <div style="text-align: right;">
              <strong>Date:</strong> ${dateStr}<br/>
              <strong>Status:</strong> <span class="badge paid">${inv.status || 'PAID'}</span>
            </div>
          </div>

          <div class="grid">
            <div>
              <strong>Billed To:</strong><br/>
              Enterprise Organization<br/>
              Tax ID: TX-9920148<br/>
              United States
            </div>
            <div style="text-align: right;">
              <strong>Payment Method:</strong><br/>
              ${inv.method || 'Visa •••• 4242'}<br/>
              Transaction Ref: TXN-${inv.id}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty / Cycle</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${activePlanName} Plan Subscription</strong><br/><small style="color: #64748b;">Includes full HCM platform access and support</small></td>
                <td>1 ${activeCycle}</td>
                <td style="text-align: right;">${formatCurrency(cleanAmount(inv.amount), 'USD')}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Paid: ${formatCurrency(cleanAmount(inv.amount), 'USD')}
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
      showToast(`Invoice ${inv.id} printable PDF ready`, 'success');
   };

   return (
      <div className="space-y-8 pb-12 animate-fade-in focus:outline-none">
         {/* Page Header */}
         <PageHeader
            title="Billing & Subscriptions"
            description="Manage your enterprise plan, payment methods and historical tax invoices"
            actions={
               <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => setIsExportOpen(true)} className="btn-secondary">
                     <Download size={18} />
                     <span className="hidden sm:inline">Export History</span>
                  </button>
                  <button onClick={() => setIsUpgradeOpen(true)} className="btn-primary">
                     <span>Upgrade Plan</span>
                  </button>
               </div>
            }
         />

         {isLoading && (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
               <Loader2 className="animate-spin text-primary-600 mr-3" size={24} />
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Loading Billing Data...</span>
            </div>
         )}

         {/* Grid Layout (Left 4 cols, Right 8 cols) */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column (Plan Card) */}
            <div className="lg:col-span-4 space-y-6">

               {/* Subscription / Plan Card */}
               <div className="card p-8 bg-slate-900 text-white border-none shadow-soft relative overflow-hidden group rounded-3xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                     <Star size={140} />
                  </div>
                  <div className="mb-10 relative z-10">
                     <span className="px-3 py-1 bg-primary-600 rounded-lg text-xs font-bold shadow-lg shadow-primary-900/20 inline-block">
                        {activePlanName}
                     </span>
                     <div className="mt-8">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                           {activeCycle} Commitment
                        </p>
                        <h3 className="text-5xl font-extrabold tracking-tighter">
                           {formatCurrency(activePrice, 'USD')}
                           <span className="text-xl text-slate-400 font-medium ml-1">
                              /{activeCycle === 'Monthly' ? 'mo' : 'yr'}
                           </span>
                        </h3>
                     </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/10 relative z-10">
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>License Limit</span>
                        <span className="text-white font-extrabold">Up to {activeUsersLimit} Users</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Renewal Date</span>
                        <span className="text-white font-extrabold">NOV 01, 2026</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Add-ons Active</span>
                        <span className="text-primary-400 font-extrabold truncate max-w-[150px] text-right" title={activeAddonsText}>
                           {activeAddonsText}
                        </span>
                     </div>
                  </div>

                  <div className="mt-10 relative z-10">
                     <button
                        onClick={() => setIsAddonsOpen(true)}
                        className="text-xs font-extrabold text-white hover:text-primary-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                     >
                        Manage Add-ons <ArrowUpRight size={15} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Column (Billing History & Support Banner) */}
            <div className="lg:col-span-8 space-y-6">

               {/* 1. Billing History Card */}
               <div className="card p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight dark:text-white">Billing History</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                           Transaction record for tax compliance
                        </p>
                     </div>
                     <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                           type="text"
                           placeholder="Search invoices..."
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           className="input-field pl-9 text-xs h-10 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                     </div>
                  </div>

                  {/* Table Wrapper */}
                  <div className="overflow-x-auto min-h-[380px]">
                     <table className="w-full text-left min-w-[650px] hcm-table">
                        <thead className="hcm-thead">
                           <tr className="bg-slate-50/50 dark:bg-slate-800/40 hcm-tr">
                              <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] hcm-th">INVOICE ID</th>
                              <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hcm-th">DATE</th>
                              <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hcm-th">AMOUNT</th>
                              <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hcm-th">METHOD</th>
                              <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] text-center hcm-th">STATUS</th>
                              <th className="px-6 py-4 text-right text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] hcm-th">ACTION</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-sm">
                           {filteredInvoices.length > 0 ? (
                              filteredInvoices.map((inv) => {
                                 const isPaid = inv.status === 'Paid';
                                 const isRefunded = inv.status === 'Refunded';

                                 return (
                                    <tr key={inv.id} className="hcm-tr hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                       <td className="px-6 py-5 hcm-td">
                                          <div className="flex items-center gap-3">
                                             <div
                                                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors cursor-pointer shrink-0"
                                                onClick={() => setInvoiceToView(inv)}
                                             >
                                                <FileText size={18} />
                                             </div>
                                             <span
                                                className="text-xs font-bold text-slate-900 dark:text-white tracking-tight cursor-pointer hover:text-primary-600 transition-colors font-mono truncate max-w-[200px]"
                                                onClick={() => setInvoiceToView(inv)}
                                             >
                                                {inv.id}
                                             </span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-5 text-center whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-300 hcm-td">
                                          {inv.date ? formatDate(inv.date) : 'N/A'}
                                       </td>
                                       <td className="px-6 py-5 text-center font-black text-slate-900 dark:text-white tracking-tight text-sm hcm-td">
                                          {formatCurrency(cleanAmount(inv.amount), 'USD')}
                                       </td>
                                       <td className="px-6 py-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest hcm-td">
                                          {inv.method || 'VISA •••• 4242'}
                                       </td>
                                       <td className="px-6 py-5 text-center hcm-td">
                                          <span className={cn(
                                             "px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border whitespace-nowrap",
                                             isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                                                isRefunded ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                                                   "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                                          )}>
                                             {inv.status || 'PAID'}
                                          </span>
                                       </td>
                                       <td className="px-6 py-5 text-right hcm-td">
                                          <div className="flex justify-end items-center gap-1.5">
                                             <button
                                                onClick={() => setInvoiceToView(inv)}
                                                title="View Invoice"
                                                className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                             >
                                                <Eye size={16} />
                                             </button>
                                             <button
                                                onClick={() => handleDownloadInvoice(inv)}
                                                title="Download Invoice PDF"
                                                className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                             >
                                                <Download size={16} />
                                             </button>
                                             <ActionDropdown
                                                actions={[
                                                   {
                                                      label: 'Resend Email',
                                                      icon: Mail,
                                                      onClick: () => showToast(`Invoice ${inv.id} sent to billing contact email.`, 'success')
                                                   },
                                                   ...(isRefunded ? [] : [{
                                                      label: 'Refund Invoice',
                                                      icon: CornerDownLeft,
                                                      danger: true,
                                                      onClick: () => setInvoiceToRefund(inv)
                                                   }])
                                                ]}
                                             />
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })
                           ) : (
                              <tr className="hcm-tr">
                                 <td colSpan="6" className="px-8 py-16 text-center text-slate-500 dark:text-slate-400 hcm-td font-medium">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                       <AlertCircle size={28} className="text-slate-400" />
                                       <p className="font-bold text-slate-700 dark:text-slate-300">No invoice records found matching your query.</p>
                                       {searchTerm && (
                                          <button
                                             onClick={() => setSearchTerm('')}
                                             className="text-xs font-bold text-primary-600 hover:underline mt-1"
                                          >
                                             Clear search filter
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* 2. Billing Support Banner */}
               <div className="p-6 bg-indigo-50/60 dark:bg-slate-800/60 rounded-3xl border border-indigo-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3.5 bg-white dark:bg-slate-700 rounded-2xl shadow-sm text-primary-600 shrink-0">
                        <Info size={22} />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Billing Support</h4>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                           Need a custom PO or tax-exemption? Contact our billing desk.
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => setIsTicketOpen(true)}
                     className="btn-secondary text-xs px-4 py-2 whitespace-nowrap self-end sm:self-auto"
                  >
                     Open Ticket
                  </button>
               </div>
            </div>
         </div>

         {/* Modals & Drawers */}
         <UpgradePlanModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
         <ExportHistoryModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
         <ManageAddonsModal isOpen={isAddonsOpen} onClose={() => setIsAddonsOpen(false)} />
         <InvoiceDrawer isOpen={!!invoiceToView} onClose={() => setInvoiceToView(null)} invoice={invoiceToView} />
         <OpenTicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />

         <ConfirmDialog
            isOpen={!!invoiceToRefund}
            title="Refund Invoice"
            message={`Are you sure you want to refund invoice ${invoiceToRefund?.id}? The transaction amount of ${formatCurrency(cleanAmount(invoiceToRefund?.amount), 'USD')} will be returned to the client payment method.`}
            confirmText="Refund Invoice"
            onConfirm={async () => {
               if (invoiceToRefund) {
                  await updateInvoice(invoiceToRefund.id, { status: 'Refunded' });
                  showToast(`Refund processed successfully for invoice ${invoiceToRefund.id}`, 'success');
                  setInvoiceToRefund(null);
               }
            }}
            onCancel={() => setInvoiceToRefund(null)}
         />
      </div>
   );
};

export default Billing;

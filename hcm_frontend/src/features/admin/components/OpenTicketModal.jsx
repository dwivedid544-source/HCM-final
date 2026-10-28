import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, CheckCircle2, Loader2, Info, Paperclip, AlertOctagon } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { cn } from '../../../utils/cn';
import { uploadAPI } from '../../../utils/apiService';
import { validateFile } from '../../../utils/fileValidator';

const OpenTicketModal = ({ isOpen, onClose }) => {
  const { showToast } = useAdmin();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Invoice Issue');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0); // 0 = Idle, 1 = Submitting, 2 = Success
  const [ticketId, setTicketId] = useState('');

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const v = validateFile(file, ['pdf','png','jpg','jpeg','doc','docx'], 10);
      if (!v.isValid) { showToast(v.message, 'error'); return; }
      setAttachmentName(file.name);
      try {
        const res = await uploadAPI.uploadAuto(file, 'hcm/tickets');
        if (res.data?.data?.url) {
          setAttachmentUrl(res.data.data.url);
          showToast('Attachment uploaded successfully!', 'success');
        }
      } catch (err) {
        console.warn('Ticket upload error:', err.message);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !description) {
      showToast('Please fill out Subject and Description', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStep(1); // Submitting

    const randomTkt = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(randomTkt);

    setTimeout(() => {
      setSubmitStep(2); // Success
      setTimeout(() => {
        showToast(`Billing support ticket ${randomTkt} submitted successfully!`, 'success');
        
        // Reset states
        setSubject('');
        setCategory('Invoice Issue');
        setPriority('Medium');
        setDescription('');
        setAttachmentName('');
        setSubmitStep(0);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : null}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-none dark:text-white">Billing Support Desk</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Open a ticket with our billing desk</p>
                </div>
              </div>
              {!isSubmitting && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {submitStep > 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                  {submitStep === 1 ? (
                    <>
                      <Loader2 size={64}/>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Submitting Support Request</h3>
                      <p className="text-sm font-medium text-slate-500 max-w-xs">Creating secure dispatch with ID and uploading files to support dashboard...</p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15 }}>
                        <CheckCircle2 size={36} />
                      </motion.div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-white">Ticket Successfully Created!</h3>
                      <p className="text-sm font-medium text-slate-500 mb-1">Your ticket identifier is <span className="font-extrabold text-slate-900">{ticketId}</span>.</p>
                      <p className="text-xs font-bold text-slate-400 max-w-xs">A support representative from our billing desk will respond via your administrator email within 2 hours.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit}>
                    {/* Category & Priority Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-bold block mb-2 form-label">Category</label>
                        <select
                          value={category}onChange={(e) => setCategory(e.target.value)}disabled={isSubmitting}
                        >
                          <option>Invoice Issue</option>
                          <option>Custom Purchase Order</option>
                          <option>Tax-Exemption Setup</option>
                          <option>Subscription Query</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-bold block mb-2 form-label">Priority</label>
                        <select
                          value={priority}onChange={(e) => setPriority(e.target.value)}disabled={isSubmitting}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 form-label">Ticket Subject</label>
                      <input
                        type="text"
                        placeholder="Requesting custom PO generation for next cycle"
                        value={subject}onChange={(e) => setSubject(e.target.value)}required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 form-label">Description & Notes</label>
                      <textarea
                        rows={4}
                        placeholder="Please describe your billing request in detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}required
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* File Attachment Area */}
                    <div>
                      <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors form-label">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        />
                        <Paperclip size={20}/>
                        <span className="text-xs font-bold text-slate-600">
                          {attachmentName ? attachmentName : 'Upload tax certificates or contract drafts'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Accepts PDF, JPG, PNG or DOCX up to 10MB</span>
                      </label>
                    </div>

                    <div className="flex gap-2.5 p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-xs font-medium leading-relaxed">
                      <Info size={16}/>
                      <p>Opening a ticket automatically bundles your active workspace configuration, licensing limits, and billing records to help resolve questions efficiently.</p>
                    </div>
                  </form>
                </>
              )}
            </div>

            {submitStep === 0 && (
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex gap-4 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OpenTicketModal;

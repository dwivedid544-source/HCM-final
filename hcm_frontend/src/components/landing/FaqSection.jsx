import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  return (
    <section id="faq" className="pt-12 pb-24 bg-slate-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          <motion.div {...fadeIn}>
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] mb-4 inline-block">Frequently Asked</span>
            <h2 className="text-4xl lg:text-6xl font-black text-black tracking-tighter leading-none mb-10">Commonly Asked <br /> Knowledge.</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed tracking-tight mb-10">Find quick answers to common questions about our platform and how it integrates into your existing workflows.</p>
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-soft flex items-center gap-6">
              <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl">
                <HelpCircle size={28} />
              </div>
              <div>
                <p className="font-bold text-slate-900 tracking-tight">Need dedicated support?</p>
                <a href="#contact" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all mt-2 inline-block">Contact Support Desk</a>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: 'Is the platform customizable?', a: 'Yes, every aspect of the branding and portal flows can be tailored to match your organizational identity.' },
              { q: 'Does it support multi-country payroll?', a: 'We currently support integrated payroll for 12+ regions with automated tax and compliance handling.' },
              { q: 'Is my data secure?', a: 'We employ bank-grade encryption and satisfy SOC2 Type II and GDPR requirements globally.' },
              { q: 'Can I manage multiple roles?', a: 'Absolutely. A single user can hold multiple roles and switch between portals seamlessly.' },
              { q: 'Does AI really screen resumes?', a: 'Yes, our proprietary ML models analyze resumes against job requirements providing a 0-100 fit score instantly.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.1 }}
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-soft cursor-pointer hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-black tracking-tight">{item.q}</h4>
                  <ChevronDown size={20} className={cn("text-slate-500 transition-transform duration-300", openFaqIndex === i && "rotate-180 text-primary-600")} />
                </div>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}>
                      <p className="mt-4 text-sm font-medium text-slate-600 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

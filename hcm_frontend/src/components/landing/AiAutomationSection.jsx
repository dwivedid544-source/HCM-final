import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Bot, TrendingUp, CheckCircle2 } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function AiAutomationSection() {
  return (
    <section className="pt-4 pb-6 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          <motion.div {...fadeIn} className="w-full lg:w-1/2 space-y-8">
            <div className="p-8 sm:p-10 bg-white text-slate-900 border border-slate-100 shadow-soft relative rounded-[3rem] sm:rounded-[3.5rem] overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary-600 transition-all duration-1000 group-hover:scale-x-110" />
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200">
                  <Brain size={32} className="text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tight">AI Engine v4.0</h4>
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mt-1">Deep Learning Module Active</p>
                </div>
              </div>
              <div className="space-y-8">
                {[
                  { label: 'Resume Screening', score: 98 },
                  { label: 'Candidate Rank Accuracy', score: 94 },
                  { label: 'Attrition Predictor', score: 87 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest mb-1.5">
                      <span className="text-slate-800">{item.label}</span>
                      <span className="text-primary-600">{item.score}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.score}%` }} transition={{ duration: 1.5, delay: i * 0.2 }} className="h-full bg-primary-600 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4 w-fit">
                  <Bot size={24} />
                </div>
                <p className="text-xl font-black text-slate-900 mb-2">Smart Assist</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed tracking-tight">Real-time candidate Q&A via proprietary LLM endpoints.</p>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-4 w-fit">
                  <TrendingUp size={24} />
                </div>
                <p className="text-xl font-black text-slate-900 mb-2">Bias Neutral</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed tracking-tight">AI models audited for fairness and EEOC compliance.</p>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeIn} className="w-full lg:w-1/2 space-y-6">
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] inline-block">Automation First</span>
            <h2 className="text-4xl lg:text-6xl font-black text-black tracking-tighter leading-none">
              Intelligent Decisions. <br />
              <span className="text-slate-600">Zero Guesswork.</span>
            </h2>
            <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed tracking-tight">
              Let our AI handle the volume while you focus on the people. From ranking resumes to predicting exit risks, we provide the insights you need to lead.
            </p>
            <ul className="space-y-4 pt-2">
              {['Automated Skill Gap Analysis', 'Proprietary Attrition Prediction Model', 'Dynamic Interview Question Generator', 'Smart Workforce Planning Insights'].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 tracking-tight">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Brain, Target, Heart, Building, ArrowRight, Loader2 } from 'lucide-react';
import { publicAPI } from '../../utils/apiService';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

export default function CareersSection({ 
  setApplyJobTitle, 
  setApplyJobId,
  setApplyStep, 
  setApplyFormData, 
  setIsApplyModalOpen 
}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await publicAPI.getAvailableJobs();
        if (response.data?.success) {
          setJobs(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getCurrencySymbol = () => '$';

  return (
    <section id="careers" className="py-20 lg:py-28 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div {...fadeIn} className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] block">Join Our Team</span>
              <h2 className="text-4xl lg:text-5xl font-black text-black tracking-tighter leading-none">
                Build the Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Workforce OS</span>
              </h2>
              <p className="text-base text-slate-500 font-medium leading-relaxed tracking-tight max-w-xl">
                We're on a mission to build the world's most intelligent workforce operating system. Join us to solve challenging AI, data, and user experience problems.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {[
                { icon: Globe, title: 'Remote First', desc: 'Work from anywhere with core hour syncs.' },
                { icon: Brain, title: 'Cutting Edge AI', desc: 'Work with proprietary LLMs & agents.' },
                { icon: Target, title: 'Learning Budget', desc: `${getCurrencySymbol()}2,500 annual growth & courses budget.` },
                { icon: Heart, title: 'Premium Health', desc: 'Comprehensive medical, dental & vision plans.' }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl space-y-3 border border-slate-100/80 hover:bg-white hover:shadow-md transition-all">
                  <div className="p-3 bg-primary-50 rounded-xl w-fit text-primary-600">
                    <item.icon size={20}/>
                  </div>
                  <h4 className="text-sm font-black text-black tracking-tight">{item.title}</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed tracking-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeIn} className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-black text-black tracking-tight mb-4">Open Opportunities</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job, idx) => (
                <div key={job.id || idx} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-soft hover:shadow-xl hover:border-primary-200 transition-all flex items-center justify-between group cursor-pointer">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Building size={10} />
                        {job.dept || job.department || 'General'}
                      </span>
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {job.loc || job.location || 'Remote'}
                      </span>
                    </div>
                    <h4 className="text-lg font-black text-black tracking-tight group-hover:text-primary-600 transition-colors">{job.title}</h4>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{(job.type || job.jobType) || 'Full-time'} • Competitive Equity</p>
                  </div>
                  <button
                    onClick={() => {
                      if(setApplyJobTitle) setApplyJobTitle(job.title);
                      if(setApplyJobId && job.id) setApplyJobId(job.id);
                      if(setApplyStep) setApplyStep(1);
                      if(setApplyFormData) setApplyFormData({ name: '', email: '', phone: '', resumeName: '', portfolioUrl: '', explanation: '' });
                      if(setIsApplyModalOpen) setIsApplyModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-slate-50 text-slate-700 font-bold text-xs rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    Apply Now <ArrowRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center shadow-soft">
                <p className="text-slate-500 font-medium">No open opportunities at the moment. Please check back later!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RolePreviewBanner = () => {
  const { previewRole, exitPreview } = useAuth();

  return (
    <AnimatePresence>
      {previewRole && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}>
          <div className="bg-slate-900 text-white px-6 py-2 rounded-b-2xl shadow-xl border border-slate-700 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Eye size={16}/>
              <span className="text-sm font-bold tracking-wide">
                Previewing as <span className="uppercase text-amber-400 ml-1">{previewRole}</span>
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <button
              onClick={exitPreview}>
              <X size={14} />
              Exit Preview
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RolePreviewBanner;

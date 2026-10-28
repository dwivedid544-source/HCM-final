import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Play } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';

const TrainModelsModal = ({ isOpen, onClose }) => {
  const { addAiLog, showToast } = useAdmin();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    modelType: 'LLM Fine-tune',
    dataset: 'Internal Prod DB',
    epochs: 10,
    learningMode: 'Supervised',
    priority: 'Normal'
  });

  const handleStart = () => {
    setIsTraining(true);
    setProgress(0);
    addAiLog({ label: `Started training ${formData.modelType}`, type: 'Queue' });
    
    // Simulate training progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          addAiLog({ label: `Completed training ${formData.modelType}`, type: 'Success' });
          showToast('Model training completed!');
          setTimeout(() => {
            setIsTraining(false);
            onClose();
          }, 1000);
          return 100;
        }
        return p + 20;
      });
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isTraining ? onClose : undefined}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Bot size={24} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Train Models</h2>
                  <p className="text-xs font-medium text-slate-500">Initiate model fine-tuning run</p>
                </div>
              </div>
              {!isTraining && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-8 space-y-6">
              {isTraining ? (
                <div className="py-6 text-center space-y-6">
                  <p className="text-sm font-bold text-slate-600 animate-pulse">Training in progress... {progress}%</p>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">Please do not close this window.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 form-label">Model Type</label>
                        <select value={formData.modelType}onChange={e => setFormData({...formData, modelType: e.target.value})}>
                            <option>LLM Fine-tune</option>
                            <option>Vector Embedding Update</option>
                            <option>Predictive Regressor</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 form-label">Dataset Source</label>
                            <select value={formData.dataset}onChange={e => setFormData({...formData, dataset: e.target.value})}>
                                <option>Internal Prod DB</option>
                                <option>HR Archives</option>
                                <option>External Feeds</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 form-label">Epochs</label>
                            <input type="number" value={formData.epochs}onChange={e => setFormData({...formData, epochs: e.target.value})}/>
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <button type="button" onClick={handleStart} className="btn-primary flex-1">
                        <Play size={16} fill="currentColor" /> Start Training
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TrainModelsModal;

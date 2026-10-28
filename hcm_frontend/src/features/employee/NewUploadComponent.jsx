import React, { useState } from 'react';
import { UploadAPI } from '../../utils/apiService';
import { Loader2, CloudUpload } from 'lucide-react';

const NewUploadComponent = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('File selected: ' + e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    try {
      setIsUploading(true);
      setStatus('Uploading...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('category', 'Other');
      formData.append('size', (file.size / 1024).toFixed(1) + ' KB');

      const res = await UploadAPI.post('/employee/documents', formData);

      setStatus('Upload Success: ' + res.data.data.name);
      alert('Upload Successful!');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      setFile(null);
    } catch (err) {
      console.error("Direct Upload Error:", err);
      setStatus('Upload Failed: ' + (err.response?.data?.message || err.message));
      alert('Upload Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-premium border border-slate-100 mb-8 space-y-4">
      <h3 className="font-bold text-lg text-slate-800">Direct Upload Test</h3>
      <p className="text-sm text-slate-500">This is a completely isolated, bulletproof upload component.</p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input 
          type="file" 
          onChange={handleFileChange}
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
        />
        
        <button 
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="btn-primary flex items-center justify-center gap-2 h-11 px-5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
          {isUploading ? 'Uploading...' : 'Upload Now'}
        </button>
      </div>

      {status && (
        <div className={`p-3 rounded-lg text-sm font-bold ${status.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default NewUploadComponent;

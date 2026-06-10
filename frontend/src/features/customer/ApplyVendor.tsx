import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Store, ShieldCheck, FileText, BadgeAlert } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ApplyVendor: React.FC = () => {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const applyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/auth/apply-vendor', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Application submission failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({
      businessName,
      businessDescription: description,
      taxId,
    });
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto py-8 text-center space-y-6 animate-fade-in">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900">
          <ShieldCheck className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Proposal Under Review</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your vendor registration application for <strong>{businessName}</strong> has been submitted. Platform Administrators have been notified via Socket.io and will review your compliance details shortly.
          </p>
        </div>
        <button onClick={() => navigate('/')} className="bg-brand-500 text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-brand-600 transition">
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
          <Store className="h-6 w-6 text-brand-500" />
          <span>Apply to Sell on Horizon</span>
        </h2>
        <p className="text-xs text-slate-500">Submit your company information to unlock seller capabilities.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        
        {/* Policy check */}
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl flex gap-3 text-xs text-amber-700 dark:text-amber-400">
          <BadgeAlert className="h-5 w-5 shrink-0" />
          <p className="leading-relaxed">
            All vendor registrations require a valid tax ID (GSTIN/EIN/VAT) and bank details. Once approved by an Admin, your profile will immediately transition to a Seller account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Business Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Electronics Co."
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Tax ID / Business Number</label>
            <input
              type="text"
              placeholder="e.g. EIN-12-3456789 or TX-GST-99"
              required
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Business Description</label>
            <textarea
              placeholder="Describe what items you plan to catalog..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={applyMutation.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import type { RootState } from '../../store';
import { setCredentials } from '../../store/authSlice';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/auth/profile', payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Update store state
      const token = localStorage.getItem('token') || '';
      dispatch(setCredentials({ user: data.user, accessToken: token }));
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ fullName, phone, avatarUrl });
  };

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">Manage Profile</h2>
        <p className="text-xs text-slate-500">Update your contact information and avatar image.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        
        {/* Info preview */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-850/40 p-4 rounded-2xl border dark:border-slate-850">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-brand-500" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-1.5">
              <span>{user?.fullName}</span>
              {user?.isVerified && <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 fill-emerald-50/10" />}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{user?.email}</span>
            </p>
            <span className="inline-block mt-2 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
              {user?.role} Account
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-10 px-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555-0199"
              className="w-full h-10 px-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase">Avatar Image URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full h-10 px-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Lock } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/auth/reset-password', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully. Please sign in.');
      navigate('/login');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Password reset failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Reset token is missing from url');
      return;
    }
    resetMutation.mutate({ token, password });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-lg space-y-6 text-sm">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-xl text-brand-500">
            <Sparkles className="h-6 w-6 animate-pulse-subtle" />
            <span>Horizon</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">Set New Password</h2>
          <p className="text-[11px] text-slate-400">Choose a strong password for your account.</p>
        </div>

        {!token ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-center text-xs">
            Invalid reset link. Token is missing from the query path.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50 uppercase tracking-wider text-[11px]"
            >
              {resetMutation.isPending ? 'Updating...' : 'Set Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

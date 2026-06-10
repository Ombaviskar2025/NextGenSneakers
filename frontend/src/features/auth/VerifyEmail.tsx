import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Loader, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from url');
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Token may be expired.');
      });
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-lg space-y-6 text-sm text-center">
        
        <div className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-xl text-brand-500">
            <Sparkles className="h-6 w-6 animate-pulse-subtle" />
            <span>Horizon</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">Account Verification</h2>
        </div>

        {status === 'loading' && (
          <div className="space-y-4 py-8">
            <Loader className="h-8 w-8 text-brand-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Verifying your token credentials with Horizon backend...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <p className="text-xs text-slate-500">Your email has been verified! You can now access full customer shopping features.</p>
            <Link to="/login" className="block bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 text-xs uppercase tracking-wider">
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full w-fit mx-auto border border-red-100 dark:border-red-900">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <p className="text-xs text-red-500 font-semibold">{message}</p>
            <Link to="/register" className="block bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl py-3 font-bold transition text-xs uppercase tracking-wider">
              Register Again
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

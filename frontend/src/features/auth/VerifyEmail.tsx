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
      <div className="glass-card border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-sm text-center">
        
        <div className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-sans font-black text-2xl uppercase text-white hover:text-pulse-red transition-colors tracking-tight">
            <Sparkles className="h-5 w-5 text-pulse-red animate-pulse-subtle" />
            <span>AIRVERSE</span>
          </Link>
          <h2 className="text-xl font-extrabold text-white mt-2">Account Verification</h2>
        </div>

        {status === 'loading' && (
          <div className="space-y-4 py-8">
            <Loader className="h-8 w-8 text-pulse-red animate-spin mx-auto" />
            <p className="text-xs text-white/50">Verifying your token credentials with AIRVERSE backend...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full w-fit mx-auto border border-emerald-500/20">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <p className="text-xs text-white/60">Your email has been verified! You can now access full customer shopping features.</p>
            <Link to="/login" className="block bg-pulse-red hover:brightness-110 text-white rounded-xl py-3 font-bold transition shadow-[0_0_20px_rgba(255,59,48,0.3)] text-xs uppercase tracking-wider text-center hover:scale-[1.01] active:scale-[0.99]">
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="p-4 bg-red-500/10 text-pulse-red rounded-full w-fit mx-auto border border-red-500/20">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <p className="text-xs text-pulse-red font-semibold">{message}</p>
            <Link to="/register" className="block border border-white/10 hover:bg-white/5 text-white rounded-xl py-3 font-bold transition text-xs uppercase tracking-wider text-center hover:scale-[1.01] active:scale-[0.99]">
              Register Again
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

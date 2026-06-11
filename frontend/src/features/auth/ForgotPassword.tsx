import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Mail } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/auth/forgot-password', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Reset link dispatched!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch link');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="glass-card border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-sm">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-sans font-black text-2xl uppercase text-white hover:text-pulse-red transition-colors tracking-tight">
            <Sparkles className="h-5 w-5 text-pulse-red animate-pulse-subtle" />
            <span>AIRVERSE</span>
          </Link>
          <h2 className="text-xl font-extrabold text-white mt-2">Password Recovery</h2>
          <p className="text-[11px] text-white/50">Enter your email to receive a password reset link.</p>
        </div>

        {isSuccess ? (
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl text-center text-xs border border-emerald-500/20">
            If the account exists, we have dispatched a password recovery link to your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 relative">
              <label className="block text-[10px] font-bold text-white/50 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 focus:ring-1 focus:ring-pulse-red text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full bg-pulse-red hover:brightness-110 text-white rounded-xl py-3 font-bold transition shadow-[0_0_20px_rgba(255,59,48,0.3)] disabled:opacity-50 uppercase tracking-wider text-[11px] hover:scale-[1.01] active:scale-[0.99]"
            >
              {forgotMutation.isPending ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-white/50">
          Remember credentials? <Link to="/login" className="text-pulse-red font-bold hover:underline transition-colors">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

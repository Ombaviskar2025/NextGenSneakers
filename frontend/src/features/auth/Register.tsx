import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Mail, Lock, User, Phone } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/auth/register', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Registration successful!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ fullName, email, password, phone });
  };

  if (isSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-lg text-center space-y-6 text-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 font-bold flex items-center justify-center text-lg mx-auto border border-emerald-100 dark:border-emerald-900">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-850 dark:text-white">Verify Your Email</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              We have sent a verification link to <strong>{email}</strong>. Please click the link to confirm your account and log in.
            </p>
          </div>
          <button onClick={() => navigate('/login')} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 text-xs uppercase tracking-wider">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-lg space-y-6 text-sm">
        
        {/* Title logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-xl text-brand-500">
            <Sparkles className="h-6 w-6 animate-pulse-subtle" />
            <span>Nike Store</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">Create a new account</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="+1 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-brand-500 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">Password</label>
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

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50 uppercase tracking-wider text-[11px]"
          >
            {registerMutation.isPending ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account? <Link to="/login" className="text-brand-500 font-bold hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

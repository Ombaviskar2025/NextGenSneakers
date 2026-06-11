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
        <div className="glass-card border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-6 text-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-lg mx-auto border border-emerald-500/20">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-white">Verify Your Email</h3>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
              We have sent a verification link to <strong>{email}</strong>. Please click the link to confirm your account and log in.
            </p>
          </div>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full bg-pulse-red hover:brightness-110 text-white rounded-xl py-3 font-bold transition shadow-[0_0_20px_rgba(255,59,48,0.3)] text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="glass-card border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 text-sm">
        
        {/* Title logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-sans font-black text-2xl uppercase text-white hover:text-pulse-red transition-colors tracking-tight">
            <Sparkles className="h-5 w-5 text-pulse-red animate-pulse-subtle" />
            <span>AIRVERSE</span>
          </Link>
          <h2 className="text-xl font-extrabold text-white mt-2">Create a new account</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 focus:ring-1 focus:ring-pulse-red text-white placeholder-white/30 outline-none transition-all"
              />
            </div>
          </div>

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

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="+1 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 focus:ring-1 focus:ring-pulse-red text-white placeholder-white/30 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 focus:ring-1 focus:ring-pulse-red text-white placeholder-white/30 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-pulse-red hover:brightness-110 text-white rounded-xl py-3 font-bold transition shadow-[0_0_20px_rgba(255,59,48,0.3)] disabled:opacity-50 uppercase tracking-wider text-[11px] hover:scale-[1.01] active:scale-[0.99]"
          >
            {registerMutation.isPending ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-white/50">
          Already have an account? <Link to="/login" className="text-pulse-red font-bold hover:underline transition-colors">Sign in</Link>
        </p>

      </div>
    </div>
  );
};

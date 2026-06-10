import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Mail, Lock } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAdminPortal = location.pathname === '/admin-portal-login';

  const loginMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/auth/login', payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (isAdminPortal) {
        if (data.user.role !== 'admin') {
          toast.error('Access denied. This portal is for administrators only.');
          return;
        }
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        toast.success('Signed in as Administrator');
        navigate('/admin/dashboard');
      } else {
        if (data.user.role === 'admin') {
          toast.error('Access denied. Administrators must login through the Admin Portal.');
          return;
        }
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        toast.success('Signed in successfully');
        if (data.user.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/');
        }
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Authentication failed');
    }
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const res = await api.post('/auth/google', { idToken });
      return res.data;
    },
    onSuccess: (data) => {
      if (isAdminPortal) {
        if (data.user.role !== 'admin') {
          toast.error('Access denied. This portal is for administrators only.');
          return;
        }
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        toast.success('Google authentication successful');
        navigate('/admin/dashboard');
      } else {
        if (data.user.role === 'admin') {
          toast.error('Access denied. Administrators must login through the Admin Portal.');
          return;
        }
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        toast.success('Google authentication successful');
        if (data.user.role === 'vendor') {
          navigate('/vendor/dashboard');
        } else {
          navigate('/');
        }
      }
    },
    onError: () => {
      toast.error('Google Sign-In failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleMockGoogleLogin = () => {
    // Generates a mock Google token that our backend is configured to resolve instantly
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    googleLoginMutation.mutate(`mock_google_token_google_user_${randomSuffix}`);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-lg space-y-6 text-sm">
        
        {/* Title logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-xl text-brand-500">
            <Sparkles className="h-6 w-6 animate-pulse-subtle" />
            <span>Nike Store</span>
          </Link>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
            {isAdminPortal ? 'Nike Admin Portal' : 'Sign in to your account'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-0.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-brand-500 hover:underline">Forgot?</Link>
            </div>
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
            disabled={loginMutation.isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-brand-500/20 disabled:opacity-50 uppercase tracking-wider text-[11px]"
          >
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {!isAdminPortal && (
          <>
            <div className="relative flex items-center justify-center py-2 text-[10px] uppercase font-bold text-slate-400">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t dark:border-slate-850" /></div>
              <span className="relative bg-white dark:bg-slate-900 px-3">Or Continue With</span>
            </div>

            {/* Mock Google Login button */}
            <button
              onClick={handleMockGoogleLogin}
              disabled={googleLoginMutation.isPending}
              className="w-full border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl py-3 text-xs font-bold transition flex items-center justify-center gap-2 dark:text-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.8-1.5 1.76v2.92h2.4c1.4-1.3 2.15-3.23 2.15-5.51z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.02c-1.08.72-2.47 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.16v3.13C3.14 20.35 7.27 24 12 24z"/>
                <path fill="#FBBC05" d="M5.25 14.25c-.25-.72-.39-1.5-.39-2.31 0-.81.14-1.59.39-2.31V6.5H1.16C.42 7.96 0 9.61 0 11.94c0 2.33.42 3.98 1.16 5.44l4.09-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.27 0 3.14 3.65 1.16 7.62l4.09 3.13c.95-2.85 3.61-4.97 6.75-4.97z"/>
              </svg>
              <span>Mock Google Login</span>
            </button>

            <p className="text-center text-xs text-slate-500">
              New to Nike Store? <Link to="/register" className="text-brand-500 font-bold hover:underline">Register here</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

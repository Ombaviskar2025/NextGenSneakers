import React, { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, ShoppingBag, DollarSign, Tag, FileText, ArrowLeft, LogOut, Sun, Moon, Sparkles, Menu, X } from 'lucide-react';
import type { RootState } from '../store';
import { logoutUser } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const VendorLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Vendor Role Guard
  if (!isAuthenticated || user?.role !== 'vendor') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-4">You must be registered and approved as a vendor to view this dashboard.</p>
        <Link to="/" className="bg-brand-500 text-white rounded-lg px-4 py-2 hover:bg-brand-600">Return to Store</Link>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logoutUser());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { label: 'Dashboard Stats', path: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'Product Manager', path: '/vendor/products', icon: ShoppingBag },
    { label: 'Order Processing', path: '/vendor/orders', icon: DollarSign },
    { label: 'Discount Coupons', path: '/vendor/coupons', icon: Tag },
    { label: 'AI Sales Insights', path: '/vendor/insights', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* 1. Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-lg text-brand-600 dark:text-brand-400">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <span>Seller Hub</span>
          </div>
        </div>

        {/* Sidebar Nav List */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Customer View</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Mobile Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 animate-fade-in">
            <div className="h-16 flex items-center justify-between px-6 border-b dark:border-slate-800">
              <span className="font-bold text-brand-600 dark:text-brand-400">Seller Hub</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t dark:border-slate-800 space-y-1">
              <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850">
                <ArrowLeft className="h-4.5 w-4.5" />
                <span>Customer View</span>
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Page Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header toolbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 dark:text-slate-400">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Seller Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Profile banner */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-500 font-bold flex items-center justify-center text-sm capitalize">
                {user?.fullName.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">{user?.fullName}</span>
            </div>

          </div>
        </header>

        {/* 3. Sub-route Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

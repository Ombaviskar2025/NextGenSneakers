import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Store, ShoppingBag, Landmark, PiggyBank } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export const AdminDashboard: React.FC = () => {
  // Fetch Stats
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl lg:col-span-2 w-full" />
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  // Line Chart Config
  const monthlyRevenue = stats?.monthlyRevenue || [];
  const lineData = {
    labels: monthlyRevenue.map((r: any) => r.month),
    datasets: [
      {
        label: 'Revenue ($)',
        data: monthlyRevenue.map((r: any) => parseFloat(r.revenue)),
        borderColor: '#a855f7', // purple-500
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } },
      x: { grid: { display: false } },
    },
  };

  // Doughnut Chart Config
  const categorySales = stats?.categorySales || [];
  const doughnutData = {
    labels: categorySales.map((c: any) => c.category),
    datasets: [
      {
        data: categorySales.map((c: any) => parseFloat(c.sales)),
        backgroundColor: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 10, fontSize: 10, color: '#94a3b8' },
      },
    },
  };

  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8 py-2">
      {/* 1. Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Customers</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{metrics.totalUsers}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
            <Users className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        {/* Approved Vendors */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Approved Vendors</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{metrics.totalVendors}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
            <Store className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        {/* Platform Products */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Platform Products</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{metrics.totalProducts}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        {/* Gross Orders */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Gross Orders</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{metrics.totalOrders}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
            <Landmark className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        {/* Platform Earnings */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Gross Revenue</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">${metrics.totalRevenue.toFixed(2)}</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
            <PiggyBank className="h-5 w-5 text-purple-500" />
          </div>
        </div>

      </div>

      {/* 2. Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Platform Monthly sales */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Marketplace Gross Revenue Line</h4>
          <div className="h-64 relative">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Categories distributions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Category Sales Mix</h4>
          <div className="h-52 relative">
            {categorySales.length === 0 ? (
              <p className="text-xs text-slate-400 absolute inset-0 flex items-center justify-center">No category metrics captured.</p>
            ) : (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

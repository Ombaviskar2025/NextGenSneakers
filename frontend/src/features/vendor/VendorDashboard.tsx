import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, BarChart3, PackageCheck, AlertTriangle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from '../../services/api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const VendorDashboard: React.FC = () => {
  // Fetch Stats
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['vendor-stats'],
    queryFn: async () => {
      const res = await api.get('/vendor/dashboard');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
      </div>
    );
  }

  // Configure Chart Data
  const monthlyRevenue = stats?.monthlyRevenue || [];
  const chartData = {
    labels: monthlyRevenue.map((r: any) => r.month),
    datasets: [
      {
        label: 'Monthly Earnings ($)',
        data: monthlyRevenue.map((r: any) => parseFloat(r.revenue)),
        borderColor: '#8b5cf6', // brand-500
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  };

  const bestSellers = stats?.bestSellers || [];
  const lowStock = stats?.lowStock || [];

  return (
    <div className="space-y-8 py-2">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Gross Revenue</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">${parseFloat(stats?.metrics.totalRevenue || '0').toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl">
            <DollarSign className="h-6 w-6 text-brand-500" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Fulfilled Orders</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.metrics.totalOrders || 0}</h3>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl">
            <BarChart3 className="h-6 w-6 text-brand-500" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Catalog Items</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.metrics.totalProducts || 0}</h3>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl">
            <ShoppingBag className="h-6 w-6 text-brand-500" />
          </div>
        </div>

      </div>

      {/* 2. Monthly Revenue line Chart */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Revenue Trend Line</h4>
        <div className="h-64 relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* 3. Lower Grid (Best Sellers & Stock Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Best Selling Products */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <PackageCheck className="h-4.5 w-4.5 text-brand-500" />
            <span>Top Performing Products</span>
          </h4>

          <div className="divide-y dark:divide-slate-800">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No item sales recorded yet.</p>
            ) : (
              bestSellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt={item.name} className="w-10 h-10 object-cover rounded-lg border dark:border-slate-800" />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs truncate">{item.name}</h5>
                    <span className="text-[10px] text-slate-400">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block font-bold text-slate-800 dark:text-white">{item.sales} sold</span>
                    <span className="block font-semibold text-brand-500">${parseFloat(item.revenue).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
            <span>Low Stock Alerts</span>
          </h4>

          <div className="divide-y dark:divide-slate-800">
            {lowStock.length === 0 ? (
              <p className="text-xs text-emerald-500 font-bold py-4">✓ All products are fully stocked!</p>
            ) : (
              lowStock.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-200">{item.name}</h5>
                    <span className="text-[10px] text-slate-400">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                      Only {item.stock_quantity} left
                    </span>
                    <span className="block text-[9px] text-slate-400 mt-1">Threshold: {item.low_stock_threshold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

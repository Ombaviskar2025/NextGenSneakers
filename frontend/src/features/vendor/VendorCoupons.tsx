import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Trash2, Calendar, Percent } from 'lucide-react';
import { api } from '../../services/api';
import type { Coupon } from '../../types';
import toast from 'react-hot-toast';

export const VendorCoupons: React.FC = () => {
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxUses, setMaxUses] = useState<number | null>(null);

  // Fetch Coupons
  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await api.get('/orders/coupons');
      return res.data;
    },
  });

  // Mutators
  const createCouponMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/orders/coupons', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Coupon created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (couponId: string) => {
      return api.delete(`/orders/coupons/${couponId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
  });

  const resetForm = () => {
    setCode('');
    setType('percentage');
    setValue(10);
    setMinOrderValue(0);
    setStartDate('');
    setEndDate('');
    setMaxUses(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCouponMutation.mutate({
      code,
      type,
      value,
      minOrderValue,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      maxUses: maxUses || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded w-1/4" />
        <div className="h-24 bg-slate-100 dark:bg-slate-900 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Discount Coupons</h2>
          <p className="text-xs text-slate-400">Offer percentage or fixed discounts to customers.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* 1. Coupon form panel */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-sm text-xs space-y-4 max-w-xl animate-slide-up">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white flex items-center gap-1">
            <Percent className="h-4.5 w-4.5 text-brand-500" />
            <span>New Promotion Setup</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Coupon Code</label>
              <input type="text" required placeholder="e.g. SUMMER25" value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white font-mono uppercase" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Discount Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Value (₹)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Discount Value</label>
              <input type="number" required value={value} onChange={(e) => setValue(parseFloat(e.target.value) || 0)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Min Order Threshold (₹)</label>
              <input type="number" value={minOrderValue} onChange={(e) => setMinOrderValue(parseFloat(e.target.value) || 0)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Starts At</label>
              <input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Ends At</label>
              <input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 uppercase">Max Total Usage</label>
              <input type="number" value={maxUses || ''} onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || null)} placeholder="Infinite" className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-1.5 border rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-brand-500 text-white rounded-lg font-bold hover:bg-brand-600">Save Coupon</button>
          </div>
        </form>
      )}

      {/* 2. Coupons List */}
      {coupons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <Tag className="h-10 w-10 mx-auto text-slate-350 animate-pulse-subtle" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No active promotional campaigns yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Benefit</th>
                <th className="p-4">Min Spend</th>
                <th className="p-4">Valid Period</th>
                <th className="p-4">Uses Count</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400 uppercase">{coupon.code}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-250">
                      {coupon.type === 'percentage' ? `${parseFloat(coupon.value.toString())}% Off` : `₹${parseFloat(coupon.value.toString())} Off`}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-500">₹{parseFloat(coupon.min_order_value).toFixed(2)}</td>
                  <td className="p-4 text-slate-500 flex items-center gap-1 mt-1 font-sans">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(coupon.start_date).toLocaleDateString()} - {new Date(coupon.end_date).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 font-bold">
                    <span>{coupon.uses_count}</span>
                    {coupon.max_uses && <span className="text-slate-400"> / {coupon.max_uses}</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteMutation.mutate(coupon.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 className="h-4.5 w-4.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

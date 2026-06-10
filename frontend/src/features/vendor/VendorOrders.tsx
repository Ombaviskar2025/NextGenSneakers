import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Clock, Truck, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const VendorOrders: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch Vendor Orders
  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  // Mutator
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      return api.put(`/orders/item/${itemId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      toast.success('Order item status updated');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'shipped':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
      case 'processing':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
      case 'cancelled':
        return 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
      default:
        return 'bg-slate-50 text-slate-650 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded w-1/4" />
        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl w-full" />
        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-850 dark:text-white">Store Sales Orders</h2>
        <p className="text-xs text-slate-400">Manage item fulfillment and ship tracking updates.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <Clock className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No orders placed for your products yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Order Ref</th>
                <th className="p-4">Item Details</th>
                <th className="p-4">Delivery To</th>
                <th className="p-4">Earning</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {orders.map((order) => {
                const addr = order.shipping_address;
                return (
                  <tr key={order.item_id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-4 font-medium">
                      <span className="block font-bold">{order.order_number}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(order.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold block text-slate-800 dark:text-white">{order.product_name}</span>
                      <span className="text-[10px] text-slate-400">Qty: {order.quantity} | SKU: {order.product_slug.toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold block">{addr?.full_name}</span>
                      <span className="text-[10px] text-slate-450 block truncate max-w-[150px]">{addr?.city}, {addr?.postal_code}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">${(parseFloat(order.price) * order.quantity).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide ${getStatusColor(order.item_status)}`}>
                        {order.item_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={order.item_status}
                        onChange={(e) => updateStatusMutation.mutate({ itemId: order.item_id, status: e.target.value })}
                        className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1 focus:outline-none text-[10px] dark:text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

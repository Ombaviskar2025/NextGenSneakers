import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronDown, ChevronUp, ShoppingBag, Truck, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import type { Order } from '../../types';

export const OrderHistory: React.FC = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Fetch Orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders-history'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data;
    },
  });

  // Fetch Order detail when expanding
  const { data: expandedOrder } = useQuery<any>({
    queryKey: ['order-detail', expandedOrderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${expandedOrderId}`);
      return res.data;
    },
    enabled: !!expandedOrderId,
  });

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

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
        return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Helper for invoice download
  const handleDownloadInvoice = (orderId: string) => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Access token passed in query parameter for native download link
    window.open(`${baseUrl}/orders/${orderId}/invoice?token=${token}`);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-8 max-w-4xl mx-auto">
        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded w-1/3" />
        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your Purchase History</h2>
        <p className="text-xs text-slate-500">Track shipping updates and download invoices for past orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <ShoppingBag className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">You haven't placed any orders yet</p>
          <Link to="/products" className="text-brand-500 font-medium hover:underline text-sm">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Collapsible header */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition"
              >
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8 text-xs">
                  <div>
                    <span className="block text-slate-400 font-medium">Order Placed</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Order Number</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{order.order_number}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Total Cost</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {expandedOrderId === order.id ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expansions */}
              {expandedOrderId === order.id && (
                <div className="border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-5 animate-slide-up">
                  
                  {/* Detailed summary */}
                  {expandedOrder ? (
                    <>
                      {/* Product lists */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Ordered Items</h4>
                        <div className="space-y-3">
                          {expandedOrder.items?.map((item: any) => (
                            <div key={item.id} className="flex gap-4 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-850">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg border dark:border-slate-800 bg-white"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</h5>
                                <span className="text-[10px] text-slate-400">Seller: {item.store_name} | SKU: {item.sku}</span>
                              </div>
                              <div className="text-right text-xs">
                                <span className="block font-bold text-slate-700 dark:text-slate-300">{item.quantity}x</span>
                                <span className="block font-extrabold text-brand-500">₹{parseFloat(item.price).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery addresses details & payment status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-bold uppercase text-slate-400 tracking-wider">Delivery Destination</h4>
                          <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-xl space-y-1 text-slate-600 dark:text-slate-400">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{expandedOrder.shipping_address.full_name}</p>
                            <p>{expandedOrder.shipping_address.address_line1}</p>
                            <p>{expandedOrder.shipping_address.city}, {expandedOrder.shipping_address.state} {expandedOrder.shipping_address.postal_code}</p>
                            <p>{expandedOrder.shipping_address.country}</p>
                          </div>
                        </div>

                        <div className="space-y-2 flex flex-col">
                          <h4 className="font-bold uppercase text-slate-400 tracking-wider">Invoices & Billing</h4>
                          <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-xl flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <p className="text-slate-500">Payment Gateway: <span className="font-bold capitalize text-slate-700 dark:text-slate-300">{expandedOrder.gateway || 'stripe'}</span></p>
                              <p className="text-slate-500">Transaction Status: <span className="font-bold capitalize text-emerald-500">{expandedOrder.payment_status || 'completed'}</span></p>
                            </div>
                            
                            <button
                              onClick={() => handleDownloadInvoice(order.id)}
                              className="mt-4 w-full bg-slate-100 hover:bg-brand-500 hover:text-white dark:bg-slate-850 text-slate-800 dark:text-white rounded-xl py-2.5 font-bold transition flex items-center justify-center gap-2"
                            >
                              <FileText className="h-4.5 w-4.5" />
                              <span>Download PDF Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-16 flex items-center justify-center text-xs text-slate-400">Loading order info...</div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

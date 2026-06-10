import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2, Check, X, Star } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ReviewsModerator: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch Reviews
  const { data: reviews = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await api.get('/reviews');
      return res.data;
    },
  });

  // Mutators
  const toggleApproveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      return api.put(`/reviews/${id}/approve`, { isApproved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted');
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
        <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-855 dark:text-white">Customer Reviews Moderation</h2>
        <p className="text-xs text-slate-400">Audit user-generated product ratings, text commentary, and filter spam.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No reviews placed on any products yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Product Info</th>
                <th className="p-4">Author</th>
                <th className="p-4">Score</th>
                <th className="p-4">Comments</th>
                <th className="p-4">State</th>
                <th className="p-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-4 font-bold text-slate-800 dark:text-white max-w-[120px] truncate">{rev.product_name}</td>
                  <td className="p-4 font-semibold text-slate-500">{rev.customer_name}</td>
                  <td className="p-4">
                    <div className="flex gap-0.5 text-amber-500 items-center">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-[10px] ml-0.5">{rev.rating}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-[200px]">
                    <span className="font-bold block truncate">{rev.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{rev.comment || 'No text comment.'}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rev.is_approved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'}`}>
                      {rev.is_approved ? 'Approved' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => toggleApproveMutation.mutate({ id: rev.id, isApproved: !rev.is_approved })}
                      className={`p-1.5 rounded transition ${rev.is_approved ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                      title={rev.is_approved ? 'Hide Review' : 'Approve Review'}
                    >
                      {rev.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Permanently delete review?')) {
                          deleteMutation.mutate(rev.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
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

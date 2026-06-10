import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const VendorApprovals: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch Vendor Applications
  const { data: vendors = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const res = await api.get('/admin/vendors');
      return res.data;
    },
  });

  // Mutator
  const updateStatusMutation = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: string }) => {
      return api.put(`/admin/vendors/${vendorId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Vendor account status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'rejected':
        return 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
      case 'suspended':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-slate-50 text-slate-655 dark:bg-slate-800 dark:text-slate-400';
    }
  };

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
        <h2 className="text-xl font-extrabold text-slate-850 dark:text-white">Store Proposals & Applications</h2>
        <p className="text-xs text-slate-400">Review corporate details, tax IDs, and approve vendor stores.</p>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <Store className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No vendor applications recorded</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Store proposal</th>
                <th className="p-4">Applicant Contact</th>
                <th className="p-4">Tax ID / Business Number</th>
                <th className="p-4">Proposal Status</th>
                <th className="p-4 text-right">Moderator Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-4">
                    <span className="font-bold block text-slate-800 dark:text-white">{vendor.business_name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate block">{vendor.business_description || 'No description provided.'}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold block">{vendor.full_name}</span>
                    <span className="text-[10px] text-slate-400 block">{vendor.email}</span>
                  </td>
                  <td className="p-4 font-mono">{vendor.tax_id}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {vendor.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatusMutation.mutate({ vendorId: vendor.id, status: 'approved' })}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-1.5 font-bold transition hover:shadow-sm"
                          title="Approve Proposal"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateStatusMutation.mutate({ vendorId: vendor.id, status: 'rejected' })}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 font-bold transition hover:shadow-sm"
                          title="Reject Proposal"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {vendor.status === 'approved' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ vendorId: vendor.id, status: 'suspended' })}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-1.5 font-bold transition hover:shadow-sm"
                        title="Suspend Vendor"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                    )}
                    {vendor.status === 'suspended' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ vendorId: vendor.id, status: 'approved' })}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-1.5 font-bold transition hover:shadow-sm"
                        title="Re-activate Vendor"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
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

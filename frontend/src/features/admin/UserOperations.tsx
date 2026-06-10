import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const UserOperations: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch Users List
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
  });

  // Mutator
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User profile removed from platform');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    }
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
        <h2 className="text-xl font-extrabold text-slate-850 dark:text-white">Customer & User Center</h2>
        <p className="text-xs text-slate-400">View user registration logs, credentials, and ban policy violators.</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <Users className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No active users recorded</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Account Profile</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Account Role</th>
                <th className="p-4">Verification</th>
                <th className="p-4 text-right">Restrict Access</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-4 font-bold text-slate-850 dark:text-white">{item.full_name}</td>
                  <td className="p-4">{item.email}</td>
                  <td className="p-4">{item.phone || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${item.role_name === 'vendor' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {item.role_name}
                    </span>
                  </td>
                  <td className="p-4">
                    {item.is_verified ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1"><ShieldCheck className="h-4 w-4" /><span>Verified</span></span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1"><ShieldAlert className="h-4 w-4" /><span>Unverified</span></span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to ban and delete the user account for ${item.full_name}?`)) {
                          deleteUserMutation.mutate(item.id);
                        }
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded transition"
                      title="Ban & Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderPlus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const CategoryManager: React.FC = () => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  // Fetch Categories
  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data;
    },
  });

  // Mutators
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/products/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      resetForm();
      toast.success('Category created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/products/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
    },
    onError: () => {
      toast.error('Could not delete category. Verify if products belong to it first.');
    }
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto slugification
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate({
      name,
      slug,
      description,
      parentId: parentId || null,
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
        <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
      </div>
    );
  }

  // Filter root categories for parent drop-down select
  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-2">
      
      {/* 1. Category Form Panel */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-sm text-xs h-fit space-y-4">
        <h3 className="font-bold text-sm text-slate-850 dark:text-white flex items-center gap-1">
          <FolderPlus className="h-4.5 w-4.5 text-brand-500" />
          <span>New Catalog Category</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase">Category Name</label>
            <input type="text" required value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Wall Art Paintings" className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase">URL Slug (Auto)</label>
            <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. wall-art-paintings" className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white font-mono" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase">Parent Category (Optional)</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white">
              <option value="">None (Top-Level Category)</option>
              {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
          </div>

          <button type="submit" disabled={createCategoryMutation.isPending} className="w-full bg-brand-500 text-white rounded-lg py-2.5 font-bold hover:bg-brand-600 transition shadow-sm">
            {createCategoryMutation.isPending ? 'Saving...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* 2. Categories Table */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Marketplace Taxonomy</h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-3">Category Name</th>
                <th className="p-3">URL Slug</th>
                <th className="p-3">Sub-Category Of</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-3 font-bold text-slate-800 dark:text-white">{cat.name}</td>
                  <td className="p-3 font-mono text-slate-550 dark:text-slate-400">{cat.slug}</td>
                  <td className="p-3">
                    {cat.parent_name ? (
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                        {cat.parent_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete category ${cat.name}?`)) {
                          deleteCategoryMutation.mutate(cat.id);
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
      </div>

    </div>
  );
};

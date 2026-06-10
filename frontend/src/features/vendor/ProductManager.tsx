import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Plus, Edit2, Trash2, Sparkles, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

export const ProductManager: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // AI Generator state
  const [aiFeaturesInput, setAiFeaturesInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Fetch Vendor Products
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const res = await api.get('/products/store/my-products');
      return res.data;
    },
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data;
    },
  });

  const products = productsData?.products || [];

  // Mutators
  const saveProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct.id}`, payload);
      } else {
        return api.post('/products', payload);
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(res.data.message || 'Product saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save product');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product deleted');
    },
  });

  const openCreateModal = () => {
    resetForm();
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(product.category_id || '');
    setSku(product.sku);
    setPrice(product.price);
    setCompareAtPrice(product.compare_at_price || null);
    setStockQuantity(product.stock_quantity);
    setLowStockThreshold(product.low_stock_threshold);
    setDescription(product.description || '');
    setImageUrl(product.images?.[0]?.image_url || product.image_url || '');
    setStatus(product.status === 'rejected' ? 'draft' : product.status);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setSku('');
    setPrice(0);
    setCompareAtPrice(null);
    setStockQuantity(0);
    setLowStockThreshold(10);
    setDescription('');
    setImageUrl('');
    setStatus('draft');
    setAiFeaturesInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProductMutation.mutate({
      name,
      categoryId: categoryId || undefined,
      sku,
      price,
      compareAtPrice,
      stockQuantity,
      lowStockThreshold,
      description,
      status,
      images: [{ image_url: imageUrl, is_featured: true }],
    });
  };

  // AI Description Caller
  const handleGenerateAiDescription = async () => {
    if (!name) {
      toast.error('Please enter a product name first');
      return;
    }
    if (!aiFeaturesInput) {
      toast.error('Please add at least one bullet feature');
      return;
    }

    setIsAiGenerating(true);
    try {
      const features = aiFeaturesInput.split(',').map((f) => f.trim());
      const res = await api.post('/ai/generate-description', { name, features });
      setDescription(res.data.description);
      toast.success('AI description generated!');
    } catch (error) {
      toast.error('AI description generator failed');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle local file selection and convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success('File loaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Store Inventory</h2>
        <button
          onClick={openCreateModal}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Upload Product</span>
        </button>
      </div>

      {/* 1. Products List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
          <div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <ShoppingBag className="h-10 w-10 mx-auto text-slate-350 animate-pulse-subtle" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No products uploaded yet</p>
          <button onClick={openCreateModal} className="text-brand-500 font-medium hover:underline text-xs">Create Product</button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                <th className="p-4">Product Info</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Approval</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt={p.name} className="w-10 h-10 object-cover rounded-lg border dark:border-slate-800 bg-white" />
                    <div>
                      <span className="font-bold block text-slate-800 dark:text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-400">{p.category_name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{p.sku}</td>
                  <td className="p-4 font-bold text-slate-700 dark:text-slate-200">₹{p.price}</td>
                  <td className="p-4">
                    <span className={`font-bold ${p.stock_quantity <= p.low_stock_threshold ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wide ${p.is_approved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : p.status === 'rejected' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                      {p.is_approved ? 'Approved' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-400 hover:text-brand-500 rounded"><Edit2 className="h-4.5 w-4.5" /></button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 className="h-4.5 w-4.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Upload / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-6 rounded-2xl max-w-2xl w-full shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Catalog Product' : 'Upload New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Product Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apex OLED Laptop" className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">SKU</label>
                  <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. LAP-APX-OLED" className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white">
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Sale Price (₹)</label>
                  <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Compare Price (₹)</label>
                  <input type="number" step="0.01" value={compareAtPrice || ''} onChange={(e) => setCompareAtPrice(parseFloat(e.target.value) || null)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Inventory Quantity</label>
                  <input type="number" required value={stockQuantity} onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Low Stock Alert Level</label>
                  <input type="number" required value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white">
                    <option value="draft">Draft Mode</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* Upload input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Image Input File</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg p-1.5" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Or Image URL</label>
                  <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/photo-..." className="w-full h-9 px-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white" />
                </div>
              </div>

              {/* AI Description Builder box */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-2xl space-y-3">
                <h4 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 text-xs">
                  <Sparkles className="h-4.5 w-4.5 text-purple-500 animate-pulse-subtle" />
                  <span>AI Product Copywriter (Gemini)</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter bullet features, e.g. 32GB RAM, OLED screen, lightweight"
                    value={aiFeaturesInput}
                    onChange={(e) => setAiFeaturesInput(e.target.value)}
                    className="w-full h-9 px-3 border dark:border-slate-750 bg-white dark:bg-slate-950 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isAiGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg px-4 text-xs transition disabled:opacity-50 shrink-0"
                  >
                    {isAiGenerating ? 'Generating...' : 'Compose Copy'}
                  </button>
                </div>
              </div>

              {/* Description editor */}
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Product Description (Markdown supported)</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-slate-800 dark:text-white font-mono" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={saveProductMutation.isPending} className="px-6 py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/20">
                  {saveProductMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

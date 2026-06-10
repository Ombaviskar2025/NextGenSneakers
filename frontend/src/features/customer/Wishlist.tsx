import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash } from 'lucide-react';
import { api } from '../../services/api';
import type { WishlistItem } from '../../types';
import toast from 'react-hot-toast';

export const Wishlist: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch Wishlist Items
  const { data: wishlist = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist-page'],
    queryFn: async () => {
      const res = await api.get('/orders/wishlist');
      return res.data;
    },
  });

  // Mutators
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.delete(`/orders/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-page'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
  });

  const moveToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      // 1. Add to cart
      await api.post('/orders/cart', { productId, quantity: 1 });
      // 2. Remove from wishlist
      await api.delete(`/orders/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-page'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Moved to cart!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 py-8 max-w-4xl mx-auto">
        <div className="h-10 bg-slate-100 dark:bg-slate-900 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-slate-100 dark:bg-slate-900 rounded-2xl aspect-square w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your Bookmarks</h2>
        <p className="text-xs text-slate-500">Products saved for later consideration.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 p-16 rounded-2xl text-center text-slate-400 space-y-3">
          <Heart className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">Your wishlist is empty</p>
          <Link to="/products" className="text-brand-500 font-medium hover:underline text-sm">Browse Catalog</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.wishlist_item_id} className="group flex flex-col bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-lg transition shadow-sm">
              <Link to={`/products/${item.slug}`} className="relative block overflow-hidden bg-slate-100 dark:bg-slate-950 aspect-square">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </Link>
              <div className="p-4 flex flex-col flex-1 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Store: {item.store_name}</span>
                <Link to={`/products/${item.slug}`} className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition text-sm line-clamp-1">
                  {item.name}
                </Link>
                <div className="pt-2 flex items-center justify-between mt-auto">
                  <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">₹{parseFloat(item.price).toFixed(2)}</span>
                </div>
                
                {/* Cart & Delete buttons */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => moveToCartMutation.mutate(item.id)}
                    className="flex-1 bg-slate-100 hover:bg-brand-500 hover:text-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Buy Now</span>
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="p-2 border dark:border-slate-800 rounded-lg text-slate-450 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

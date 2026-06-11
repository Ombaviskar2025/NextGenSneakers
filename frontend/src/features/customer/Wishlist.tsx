import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash, Sparkles } from 'lucide-react';
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
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove from wishlist');
    }
  });

  const moveToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      // 1. Add to cart (defaulting quantity to 1)
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
      toast.error(err.response?.data?.message || 'Failed to move to cart');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 py-8 max-w-6xl mx-auto px-6">
        <div className="h-10 bg-white/5 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white/5 rounded-2xl aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 px-6 animate-fade-in font-sans">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-3">
          <h1 className="font-sans font-black text-4xl md:text-5xl text-white tracking-tight uppercase">Your Wishlist</h1>
          <p className="text-platinum-gray text-xs md:text-sm max-w-xl leading-relaxed">
            Your bookmarked premium sneakers. Save them for your next stride or move them directly to the cart.
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        /* Empty wishlist state */
        <div className="glass-card border border-white/10 p-16 rounded-3xl text-center space-y-5 shadow-2xl max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-pulse-red/10 border border-pulse-red/20 flex items-center justify-center mx-auto animate-pulse">
            <Heart className="h-8 w-8 text-pulse-red fill-current" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-lg uppercase tracking-wider">Your Wishlist is Empty</h3>
            <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
              Save designs as you browse the catalog to have them show up here.
            </p>
          </div>
          <Link to="/products" className="inline-flex bg-pulse-red hover:brightness-110 text-white rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg shadow-pulse-red/25 hover:scale-105 active:scale-95">
            Browse Catalog
          </Link>
        </div>
      ) : (
        /* Wishlist items grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div 
              key={item.wishlist_item_id} 
              className="group relative glass-card p-4 rounded-2xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300 border border-white/5 hover:border-white/10"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5 mb-4">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-platinum-gray tracking-wider block">Store: {item.store_name}</span>
                  <Link 
                    to={`/products/${item.slug}`} 
                    className="block font-black text-white group-hover:text-pulse-red transition-colors text-sm uppercase tracking-wide truncate"
                  >
                    {item.name}
                  </Link>
                  <p className="font-black text-white text-base">₹{parseFloat(item.price).toFixed(2)}</p>
                </div>

                <div className="flex gap-2 pt-2 mt-auto">
                  <button
                    onClick={() => moveToCartMutation.mutate(item.id)}
                    disabled={moveToCartMutation.isPending}
                    className="flex-grow bg-pulse-red text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,59,48,0.2)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Buy Now</span>
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    disabled={removeMutation.isPending}
                    className="p-2.5 border border-white/10 hover:border-pulse-red/30 hover:bg-pulse-red/10 text-white/55 hover:text-pulse-red rounded-xl transition-all active:scale-95"
                    title="Remove from wishlist"
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

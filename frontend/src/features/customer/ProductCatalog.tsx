import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal, Star, ShoppingCart, Eye } from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

// ----------------------------------------------------
// Interactive Tilt Card Component
// ----------------------------------------------------
interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [transformStyle, setTransformStyle] = useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 22;
    const rotateY = (centerX - x) / 22;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
  };

  return (
    <div
      className="group relative glass-card p-4 rounded-2xl flex flex-col justify-between hover:shadow-2xl transition-all duration-300 select-none cursor-pointer"
      style={{ transform: transformStyle, transition: 'transform 0.1s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5 mb-6">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Hover Action Overlays */}
        <div className="absolute inset-x-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 z-25">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            className="flex-1 bg-pulse-red text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,59,48,0.2)]"
          >
            Add to Cart
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="w-12 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center rounded-lg backdrop-blur-md transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {product.is_featured && (
          <span className="absolute top-4 left-4 bg-pulse-red text-white font-bold text-[9px] px-3 py-1 rounded-sm uppercase tracking-widest shadow-md">
            Elite
          </span>
        )}
      </div>

      <div className="flex justify-between items-start pt-2">
        <div className="space-y-1 pr-2">
          <span className="text-[9px] uppercase font-bold text-platinum-gray tracking-widest">Store: {product.store_name}</span>
          <Link
            to={`/products/${product.slug}`}
            className="block font-black text-white group-hover:text-pulse-red transition-colors text-sm uppercase tracking-wide truncate max-w-[170px]"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-1 text-xs text-pulse-red">
            <span>★</span>
            <span className="font-bold text-platinum-gray text-[10px] tracking-wider">
              {product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '5.0'}
            </span>
          </div>
        </div>
        <p className="font-black text-white text-base">₹{parseFloat(product.price.toString()).toFixed(2)}</p>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Main Product Catalog Page Component
// ----------------------------------------------------
export const ProductCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Read URL search params
  const search = searchParams.get('search') || '';
  const categorySlug = searchParams.get('categorySlug') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'created_desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch Categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return res.data;
    },
  });

  // Fetch Products using queries
  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['products-catalog', search, categorySlug, minPrice, maxPrice, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categorySlug) params.append('categorySlug', categorySlug);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '8');

      const res = await api.get(`/products?${params.toString()}`);
      return res.data;
    },
  });

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.post('/orders/cart', { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add item to cart');
    }
  });

  const products = productsData?.products || [];
  const totalCount = productsData?.total || 0;
  const totalPages = Math.ceil(totalCount / 8);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset page when filters change
    setSearchParams(newParams);
  };

  const handlePriceFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const min = data.get('min') as string;
    const max = data.get('max') as string;
    
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('minPrice', min); else newParams.delete('minPrice');
    if (max) newParams.set('maxPrice', max); else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-12 py-10 px-6 md:px-12 max-w-container-max mx-auto bg-surface-dim">
      
      {/* 1. Header context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-3">
          <h1 className="font-sans font-black text-4xl md:text-5xl text-white tracking-tight uppercase">Elite Collection</h1>
          <p className="text-platinum-gray text-xs md:text-sm max-w-xl leading-relaxed">
            Precision engineering meets high-fashion aesthetics. Step into the future of motion with our complete catalogs.
          </p>
        </div>

        {/* Sorting controls & Layout */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="text-platinum-gray">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-pulse-red text-white text-xs tracking-wider"
            >
              <option value="created_desc" className="bg-[#1c1c1e] text-white">Newest Arrivals</option>
              <option value="price_asc" className="bg-[#1c1c1e] text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-[#1c1c1e] text-white">Price: High to Low</option>
              <option value="rating_desc" className="bg-[#1c1c1e] text-white">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main content container */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Sidebar Filter Panel */}
        <aside className="w-full lg:w-64 shrink-0 glass-card p-6 rounded-2xl space-y-8">
          
          {/* Categories Horizontal/Vertical list */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-pulse-red" />
              <span>Categories</span>
            </h4>
            <div className="flex flex-col gap-2 font-semibold text-xs tracking-wider uppercase">
              <button
                onClick={() => updateParam('categorySlug', '')}
                className={`text-left px-3 py-2 rounded-lg transition-colors ${!categorySlug ? 'text-white bg-pulse-red' : 'text-platinum-gray hover:text-white hover:bg-white/5'}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('categorySlug', cat.slug)}
                  className={`text-left px-3 py-2 rounded-lg transition-colors truncate ${categorySlug === cat.slug ? 'text-white bg-pulse-red' : 'text-platinum-gray hover:text-white hover:bg-white/5'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Pricing input fields */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Price Range</h4>
            <form onSubmit={handlePriceFilterSubmit} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  name="min"
                  placeholder="Min (₹)"
                  defaultValue={minPrice}
                  className="w-full h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder:text-platinum-gray/50 focus:ring-1 focus:ring-pulse-red outline-none"
                />
                <input
                  type="number"
                  name="max"
                  placeholder="Max (₹)"
                  defaultValue={maxPrice}
                  className="w-full h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder:text-platinum-gray/50 focus:ring-1 focus:ring-pulse-red outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Apply Price
              </button>
            </form>
          </div>

          <hr className="border-white/5" />

          <button
            onClick={resetAllFilters}
            className="w-full py-2 bg-transparent text-platinum-gray hover:text-pulse-red transition-colors text-xs font-bold uppercase tracking-widest text-center"
          >
            Reset Filters
          </button>
        </aside>

        {/* Product display Area */}
        <div className="flex-1 space-y-12">
          
          {/* Status Counter */}
          <div className="text-xs text-platinum-gray font-bold uppercase tracking-widest">
            Uplink Status: Showing <span className="text-white font-extrabold">{products.length}</span> of {totalCount} designs
          </div>

          {/* Product Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="glass-card p-4 rounded-2xl space-y-4 animate-pulse">
                  <div className="bg-white/5 rounded-xl aspect-[4/5] w-full" />
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card py-20 text-center text-platinum-gray space-y-4 rounded-2xl">
              <svg className="w-12 h-12 mx-auto text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <p className="font-bold text-white uppercase text-sm tracking-wider">No matching signals found</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">Try resetting the current category constraints or search query parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(id) => addToCartMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {/* Paginator */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 font-bold text-xs tracking-wider uppercase">
              <button
                onClick={() => updateParam('page', (page - 1).toString())}
                disabled={page === 1}
                className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white text-platinum-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => updateParam('page', pNum.toString())}
                    className={`w-9 h-9 rounded-full transition-all ${page === pNum ? 'bg-pulse-red text-white' : 'border border-white/10 text-platinum-gray hover:bg-white/5 hover:text-white'}`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                onClick={() => updateParam('page', (page + 1).toString())}
                disabled={page === totalPages}
                className="px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 hover:text-white text-platinum-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

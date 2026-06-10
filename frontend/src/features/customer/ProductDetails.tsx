import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Heart, Star, Sparkles, AlertCircle, ShoppingCart, ChevronRight, Minus, Plus, Truck, Shield, RotateCcw, Package } from 'lucide-react';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';
import type { RootState } from '../../store';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────
// Nike AirVerse – Product Details
// ─────────────────────────────────────────────────

export const ProductDetails: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Hover Zoom state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  // 1. Fetch Product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      setSelectedImage(res.data.images?.[0]?.image_url || res.data.image_url || '');
      return res.data;
    },
  });

  // 2. Fetch AI Recommendations
  const { data: recommendations } = useQuery<any>({
    queryKey: ['recommendations', product?.id],
    queryFn: async () => {
      const res = await api.get(`/ai/recommendations/${product?.id}`);
      return res.data;
    },
    enabled: !!product?.id,
  });

  // 3. Fetch Reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery<any[]>({
    queryKey: ['reviews', product?.id],
    queryFn: async () => {
      const res = await api.get(`/reviews/product/${product?.id}`);
      return res.data;
    },
    enabled: !!product?.id,
  });

  // Mutators
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return api.post('/orders/cart', { productId: product?.id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Product added to cart');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      return api.post('/orders/wishlist', { productId: product?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Added to wishlist');
    },
  });

  const writeReviewMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/reviews', payload);
    },
    onSuccess: () => {
      refetchReviews();
      setReviewComment('');
      setReviewTitle('');
      toast.success('Thank you for your review!');
    },
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('You must log in to submit a review');
      return;
    }
    writeReviewMutation.mutate({
      productId: product?.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    });
  };

  /* ── Loading Skeleton ────────────────────────── */
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-surface-container rounded-3xl aspect-square w-full" />
          <div className="space-y-6">
            <div className="h-4 bg-surface-container rounded-full w-1/4" />
            <div className="h-10 bg-surface-container rounded-xl w-3/4" />
            <div className="h-6 bg-surface-container rounded-xl w-1/3" />
            <div className="h-28 bg-surface-container rounded-xl w-full" />
            <div className="h-14 bg-surface-container rounded-2xl w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto">
          <AlertCircle className="h-10 w-10 text-pulse-red" />
        </div>
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-platinum-gray text-sm">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-pulse-red text-white rounded-full px-8 py-3 font-bold hover:bg-red-600 transition">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const discountPercent = product.compare_at_price
    ? Math.round(((parseFloat(product.compare_at_price.toString()) - parseFloat(product.price.toString())) / parseFloat(product.compare_at_price.toString())) * 100)
    : 0;

  return (
    <div className="space-y-16 py-6 animate-fade-in">

      {/* ══════════════════════════════════════════════ */}
      {/* 1. HERO: Split Layout — Gallery + Details     */}
      {/* ══════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── LEFT: Image Gallery ─────────────────── */}
        <div className="space-y-4 sticky top-24">

          {/* Main Image with Zoom */}
          <div
            className="relative overflow-hidden aspect-square rounded-3xl bg-surface-container cursor-zoom-in border border-white/5 group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
              alt={product.name}
              style={
                isZoomed
                  ? {
                      transform: 'scale(2.5)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
              className="w-full h-full object-cover transition-transform duration-150"
            />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-pulse-red text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-pulse-red/30">
                −{discountPercent}% OFF
              </div>
            )}

            {/* Zoom hint */}
            <div className="absolute bottom-4 right-4 glass-btn text-[10px] text-white/50 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition pointer-events-none">
              Hover to zoom
            </div>
          </div>

          {/* Thumbnails Strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 px-1">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-surface-container shrink-0 transition-all duration-200 ${
                    selectedImage === img.image_url
                      ? 'border-pulse-red shadow-lg shadow-pulse-red/20 scale-105'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product Details Panel ────────── */}
        <div className="space-y-6 animate-slide-up">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-platinum-gray">
            <Link to="/products" className="hover:text-white transition">Catalog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60 truncate">{product.name}</span>
          </div>

          {/* Store + Name */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-platinum-gray tracking-[0.2em]">
              {product.store_name}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {product.name}
            </h1>
            <span className="text-xs text-white/30 font-mono">SKU: {product.sku}</span>
          </div>

          {/* Rating Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="font-bold text-white text-sm">
                {product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '5.0'}
              </span>
            </div>
            <span className="text-xs text-platinum-gray">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Price Block */}
          <div className="glass-card rounded-2xl p-5 space-y-1">
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-white">
                ₹{parseFloat(product.price.toString()).toFixed(2)}
              </span>
              {product.compare_at_price && (
                <span className="text-lg line-through text-white/25">
                  ₹{parseFloat(product.compare_at_price.toString()).toFixed(2)}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-xs text-emerald-400 font-bold">
                You save ₹{(parseFloat(product.compare_at_price!.toString()) - parseFloat(product.price.toString())).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-white/50 leading-relaxed">
            {product.description || 'No description available for this product.'}
          </p>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Orders ₹500+' },
              { icon: Shield, label: 'Secure Checkout', sub: '256-bit SSL' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '30 days' },
              { icon: Package, label: 'Track Shipping', sub: 'Real-time' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 glass-btn rounded-xl p-3">
                <Icon className="h-4 w-4 text-pulse-red shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-white block">{label}</span>
                  <span className="text-[10px] text-white/30">{sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Stock */}
          <div className="text-xs">
            {product.stock_quantity > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
                <span className="text-emerald-400 font-bold">In Stock</span>
                <span className="text-white/30">({product.stock_quantity} available)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pulse-red" />
                <span className="text-pulse-red font-bold">Out of Stock</span>
              </span>
            )}
          </div>

          {/* Add to Cart / Wishlist Actions */}
          {product.stock_quantity > 0 && isAuthenticated && user?.role === 'customer' && (
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Qty</span>
                <div className="flex items-center gap-0 border border-white/10 rounded-full overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-bold text-white text-sm w-10 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 bg-pulse-red text-white rounded-full py-4 px-8 font-bold hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-pulse-red/25 text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => addToWishlistMutation.mutate()}
                  className="w-14 h-14 glass-btn rounded-full flex items-center justify-center text-white/40 hover:text-pulse-red hover:border-pulse-red/30 transition-all duration-200"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Login CTA */}
          {!isAuthenticated && (
            <div className="glass-card rounded-2xl p-5 text-center space-y-3">
              <p className="text-sm text-white/50">Sign in to purchase and leave reviews</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-pulse-red text-white rounded-full px-6 py-2.5 font-bold text-sm hover:bg-red-600 transition"
              >
                Sign In <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* 2. REVIEWS Section                            */}
      {/* ══════════════════════════════════════════════ */}
      <section className="glass-card rounded-3xl p-8 md:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
          <span className="text-xs text-white/30 font-mono">{reviews.length} total</span>
        </div>

        {/* Write a review form */}
        {isAuthenticated && user?.role === 'customer' && (
          <form onSubmit={handleReviewSubmit} className="space-y-5 border-b border-white/5 pb-8">
            <h4 className="font-bold text-sm text-white/70">Write a Review</h4>

            {/* Star Selector */}
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl transition-all duration-100 hover:scale-110 ${
                      reviewRating >= star ? 'text-amber-400' : 'text-white/15'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Review title (e.g. Superb gadget!)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                required
                className="w-full h-12 px-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 focus:ring-1 focus:ring-pulse-red/20 transition"
              />
              <textarea
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                rows={3}
                className="w-full p-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 focus:ring-1 focus:ring-pulse-red/20 transition resize-none"
              />
              <button
                type="submit"
                disabled={writeReviewMutation.isPending}
                className="bg-pulse-red text-white font-bold text-xs rounded-full px-8 py-3 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {writeReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-white/30 col-span-2 text-center py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="glass-btn rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pulse-red/30 to-pulse-red/10 border border-white/10 text-white font-bold flex items-center justify-center text-xs uppercase">
                      {rev.customer_name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{rev.customer_name}</h5>
                      <span className="text-[10px] text-white/30">
                        {new Date(rev.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-xs text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                      <span key={i} className="text-white/10">★</span>
                    ))}
                  </div>
                </div>
                <h5 className="font-bold text-sm text-white">{rev.title}</h5>
                <p className="text-xs text-white/40 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* 3. AI RECOMMENDATIONS – Similar Products      */}
      {/* ══════════════════════════════════════════════ */}
      {recommendations && recommendations.similarProducts?.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pulse-red/10 border border-pulse-red/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-pulse-red" />
            </div>
            <h2 className="text-xl font-bold text-white">You Might Also Like</h2>
          </div>

          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            {recommendations.similarProducts.map((p: any) => (
              <div
                key={p.id}
                className="group flex-shrink-0 w-60 glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-pulse-red/5 transition-all duration-300"
              >
                <Link to={`/products/${p.slug}`} className="relative block overflow-hidden bg-white/5 aspect-[4/5]">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="p-4 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-platinum-gray tracking-[0.15em]">
                    {p.store_name}
                  </span>
                  <Link to={`/products/${p.slug}`} className="block font-bold text-sm text-white group-hover:text-pulse-red transition line-clamp-1">
                    {p.name}
                  </Link>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-extrabold text-white text-sm">
                      ₹{parseFloat(p.price.toString()).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400">
                      <span>★</span>
                      <span className="text-white/50 font-semibold">
                        {p.rating ? parseFloat(p.rating.toString()).toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

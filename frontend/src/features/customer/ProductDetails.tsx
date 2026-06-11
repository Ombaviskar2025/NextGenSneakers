import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingBag, Heart, Star, Sparkles, AlertCircle, ShoppingCart, 
  ChevronRight, Minus, Plus, Truck, Shield, RotateCcw, Package, 
  ThumbsUp, Camera, HelpCircle, X, Maximize2, Check 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';
import type { RootState } from '../../store';
import type { Product } from '../../types';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────
// Dynamic Sneaker Registry (Sketchfab & Variants Mapping)
// ─────────────────────────────────────────────────
interface SneakerMetadata {
  modelId: string;
  tagline: string;
  fitRecommendation: string;
  colors: {
    name: string;
    class: string;
    images: string[];
    stock: number;
  }[];
}

const getSneakerMetadata = (slug: string, name: string): SneakerMetadata => {
  const normalized = (slug || name || '').toLowerCase();
  
  if (normalized.includes('jordan-4') || normalized.includes('bred')) {
    return {
      modelId: '0f9cd6cc050b499b8109a7277523e8f2',
      tagline: 'MOVE FASTER THAN TOMORROW',
      fitRecommendation: 'Fits true to size. We recommend ordering your normal shoe size.',
      colors: [
        {
          name: 'Bred Crimson Red',
          class: 'bg-[#FF3B30]',
          images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'
          ],
          stock: 15
        },
        {
          name: 'Stealth Black',
          class: 'bg-[#1C1C1E]',
          images: [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
          ],
          stock: 8
        },
        {
          name: 'Classic White',
          class: 'bg-[#E5E5EA]',
          images: [
            'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800',
            'https://images.unsplash.com/photo-1508170754725-6e9a5cfbcabf?w=800'
          ],
          stock: 22
        }
      ]
    };
  }
  
  if (normalized.includes('chicago') || normalized.includes('aj1')) {
    return {
      modelId: 'cd636a0c88c34ded9db4b105c6d32111',
      tagline: 'THE LEGEND BEGINS HERE',
      fitRecommendation: 'Fits slightly narrow. If you have wide feet, we recommend going up a half size.',
      colors: [
        {
          name: 'Varsity Red / White',
          class: 'bg-red-700',
          images: [
            'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',
            'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800'
          ],
          stock: 5
        },
        {
          name: 'Royal Blue / Black',
          class: 'bg-blue-700',
          images: [
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
            'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800'
          ],
          stock: 12
        }
      ]
    };
  }
  
  if (normalized.includes('travis') || normalized.includes('mocha') || normalized.includes('scott')) {
    return {
      modelId: 'b31490617aff44c79e652eaab88ba6d3',
      tagline: 'REDEFINE THE CLASSICS',
      fitRecommendation: 'Fits true to size. Order your standard Jordan 1 size.',
      colors: [
        {
          name: 'Mocha Dark Brown',
          class: 'bg-[#4A3B32]',
          images: [
            'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'
          ],
          stock: 4
        },
        {
          name: 'Sail Off-White',
          class: 'bg-[#F2F2F7]',
          images: [
            'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
            'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800'
          ],
          stock: 14
        }
      ]
    };
  }
  
  if (normalized.includes('max-90') || normalized.includes('max')) {
    return {
      modelId: 'f2d91178a7124c0696ad357a7f5d0b11',
      tagline: 'MAXIMUM AIR MAXIMUM PACE',
      fitRecommendation: 'Runs slightly small. We recommend ordering a half size larger than your usual size.',
      colors: [
        {
          name: 'Infrared Neon',
          class: 'bg-orange-500',
          images: [
            'https://images.unsplash.com/photo-1543508282-6319a3e2621d?w=800',
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'
          ],
          stock: 19
        },
        {
          name: 'Laser Blue',
          class: 'bg-sky-500',
          images: [
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
            'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'
          ],
          stock: 3
        }
      ]
    };
  }

  if (normalized.includes('force-1') || normalized.includes('force')) {
    return {
      modelId: '1d964e3914b94d8b98dd450c7f7c24cd',
      tagline: 'COURT CLASSIC STREET LEGEND',
      fitRecommendation: 'Runs slightly large. We recommend ordering a half size smaller for a snug fit.',
      colors: [
        {
          name: 'Triple White',
          class: 'bg-stone-200',
          images: [
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
            'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800'
          ],
          stock: 35
        },
        {
          name: 'Triple Black',
          class: 'bg-stone-900',
          images: [
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'
          ],
          stock: 18
        }
      ]
    };
  }

  // Fallback default sneaker metadata if the product doesn't match above
  return {
    modelId: '0f9cd6cc050b499b8109a7277523e8f2',
    tagline: 'ELEVATE YOUR MOTION SYSTEM',
    fitRecommendation: 'Fits true to size. Order your standard shoe size.',
    colors: [
      {
        name: 'Crimson Volt',
        class: 'bg-gradient-to-br from-red-500 to-lime-400',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'
        ],
        stock: 10
      }
    ]
  };
};

export const ProductDetails: React.FC = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // States
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  // Size Chart modal state
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  
  // Interactive reviews state (helpful votes count & user voted reviews tracker)
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({});

  // Hover Zoom state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  // 1. Fetch Product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data;
    },
  });

  // Get sneaker metadata mappings
  const metadata = product ? getSneakerMetadata(product.slug, product.name) : null;
  const activeColor = metadata?.colors[selectedColorIdx];

  // Sync main image with active color variant on load or variant change
  useEffect(() => {
    if (activeColor?.images?.[0]) {
      setSelectedImage(activeColor.images[0]);
    } else if (product) {
      setSelectedImage(product.image_url || '');
    }
  }, [product, selectedColorIdx]);

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

  // 4. Fetch User's Wishlist to verify toggle state
  const { data: wishlistItems = [] } = useQuery<any[]>({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/orders/wishlist');
      return res.data;
    },
    enabled: isAuthenticated && user?.role === 'customer'
  });

  const isWishlisted = wishlistItems.some((item: any) => item.id === product?.id);

  // Mutators
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return api.post('/orders/cart', { productId: product?.id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`Added ${product?.name} (${activeColor?.name || 'Default'}, Size: ${selectedSize}) to cart!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWishlisted) {
        return api.delete(`/orders/wishlist/${product?.id}`);
      } else {
        return api.post('/orders/wishlist', { productId: product?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update wishlist');
    }
  });

  const writeReviewMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/reviews', payload);
    },
    onSuccess: () => {
      refetchReviews();
      setReviewComment('');
      setReviewTitle('');
      setAttachedPhoto(null);
      toast.success('Thank you for your review!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
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
    // Include simulation note inside comment if photo was attached
    const commentWithPhoto = attachedPhoto 
      ? `${reviewComment} [Attached Unboxing Photo: ${attachedPhoto}]` 
      : reviewComment;

    writeReviewMutation.mutate({
      productId: product?.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: commentWithPhoto,
    });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select your size first!', {
        icon: '👟',
        style: {
          background: '#1c1c1e',
          color: '#fff',
          border: '1px solid rgba(255, 59, 48, 0.3)'
        }
      });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleHelpfulClick = (reviewId: string) => {
    if (votedHelpful[reviewId]) return;
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
    setVotedHelpful(prev => ({ ...prev, [reviewId]: true }));
    toast.success('Review voted as helpful!');
  };

  /* ── Loading Skeleton ────────────────────────── */
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 py-8 max-w-container-max mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 rounded-3xl aspect-square w-full" />
          <div className="space-y-6">
            <div className="h-4 bg-white/5 rounded-full w-1/4" />
            <div className="h-10 bg-white/5 rounded-xl w-3/4" />
            <div className="h-6 bg-white/5 rounded-xl w-1/3" />
            <div className="h-28 bg-white/5 rounded-xl w-full" />
            <div className="h-14 bg-white/5 rounded-2xl w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !metadata) {
    return (
      <div className="py-20 text-center space-y-6 max-w-md mx-auto px-6">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
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

  // Calculate stock levels based on variant
  const currentStock = activeColor?.stock ?? product.stock_quantity;

  // Rating analytics breakdown helpers
  const totalReviews = reviews.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // 1★, 2★, 3★, 4★, 5★
  reviews.forEach(r => {
    const starIdx = Math.min(5, Math.max(1, r.rating)) - 1;
    ratingDistribution[starIdx]++;
  });

  const sizesList = ['US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 12'];

  return (
    <div className="space-y-16 py-6 animate-fade-in max-w-container-max mx-auto px-6 font-sans">
      
      {/* Size Chart Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card border border-white/10 p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setIsSizeChartOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pulse-red" />
                <span>Size Conversion Guide</span>
              </h3>
              <p className="text-xs text-white/50">Convert between international sizing standards.</p>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-2xl bg-white/5">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/70 font-bold uppercase">
                    <th className="py-3 px-4">US (Men)</th>
                    <th className="py-3 px-4">UK</th>
                    <th className="py-3 px-4">EU</th>
                    <th className="py-3 px-4">CM (Inches)</th>
                  </tr>
                </thead>
                <tbody className="text-white/60 font-medium divide-y divide-white/5">
                  {[
                    { us: '7', uk: '6', eu: '40', cm: '25.0' },
                    { us: '7.5', uk: '6.5', eu: '40.5', cm: '25.5' },
                    { us: '8', uk: '7', eu: '41', cm: '26.0' },
                    { us: '8.5', uk: '7.5', eu: '42', cm: '26.5' },
                    { us: '9', uk: '8', eu: '42.5', cm: '27.0' },
                    { us: '9.5', uk: '8.5', eu: '43', cm: '27.5' },
                    { us: '10', uk: '9', eu: '44', cm: '28.0' },
                    { us: '10.5', uk: '9.5', eu: '44.5', cm: '28.5' },
                    { us: '11', uk: '10', eu: '45', cm: '29.0' },
                    { us: '12', uk: '11', eu: '46', cm: '30.0' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white">{row.us}</td>
                      <td className="py-2.5 px-4">{row.uk}</td>
                      <td className="py-2.5 px-4">{row.eu}</td>
                      <td className="py-2.5 px-4 font-mono">{row.cm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-center text-xs text-[#FF3B30] font-semibold">
              Fit Tip: {metadata.fitRecommendation}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* 1. HERO: Split Layout — Gallery + Details     */}
      {/* ══════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── LEFT: Image Gallery / 3D Viewer ────────── */}
        <div className="space-y-4 sticky top-24">
          
          {/* Toggle Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                viewMode === '2d' 
                  ? 'bg-pulse-red text-white shadow-md' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              2D Gallery
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '3d' 
                  ? 'bg-pulse-red text-white shadow-md' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>3D Interactive</span>
            </button>
          </div>

          {viewMode === '2d' ? (
            /* Main Image with Zoom */
            <div
              className="relative overflow-hidden aspect-square rounded-3xl bg-white/5 cursor-zoom-in border border-white/5 group"
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
          ) : (
            /* Sketchfab 3D Embed */
            <div className="aspect-square rounded-3xl bg-[#000] border border-white/10 overflow-hidden relative shadow-2xl">
              <iframe
                title={product.name}
                src={`https://sketchfab.com/models/${metadata.modelId}/embed?autostart=1&transparent=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_stop=0&ui_watermark=0&camera=0&preload=1`}
                className="w-full h-full border-0"
                style={{ background: 'transparent' }}
                allow="autoplay; fullscreen; xr-spatial-tracking"
              />
            </div>
          )}

          {/* Thumbnails Strip (Only in 2D mode) */}
          {viewMode === '2d' && activeColor && activeColor.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1 px-1">
              {activeColor.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-white/5 shrink-0 transition-all duration-200 ${
                    selectedImage === img
                      ? 'border-pulse-red shadow-lg shadow-pulse-red/20 scale-105'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
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
            <p className="text-xs text-pulse-red font-bold font-mono tracking-widest bg-pulse-red/10 px-3 py-1.5 rounded-lg w-fit border border-pulse-red/20">
              {metadata.tagline}
            </p>
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
            {product.description || 'Elevate your motion with the elite design structure. Designed to optimize stride resilience, street-wise style, and structural comfort.'}
          </p>

          {/* Color Swatches */}
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">
              Color Variant: <span className="text-white font-extrabold">{activeColor?.name}</span>
            </label>
            <div className="flex gap-3">
              {metadata.colors.map((color, idx) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    setSelectedColorIdx(idx);
                    setSelectedSize(''); // Reset size selection on color switch
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                    selectedColorIdx === idx 
                      ? 'border-pulse-red scale-110 shadow-lg shadow-pulse-red/30' 
                      : 'border-white/10 hover:border-white/30'
                  } ${color.class}`}
                >
                  {selectedColorIdx === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                      <Check className="h-4 w-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Select Size (US Men)</label>
              <button 
                onClick={() => setIsSizeChartOpen(true)}
                className="text-[10px] font-bold text-pulse-red hover:underline uppercase tracking-wider"
              >
                Size Chart
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {sizesList.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-xl border text-xs font-bold tracking-wider transition-all duration-150 ${
                    selectedSize === size
                      ? 'bg-pulse-red border-pulse-red text-white shadow-lg shadow-pulse-red/25 scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                  }`}
                >
                  {size.replace('US ', '')}
                </button>
              ))}
            </div>
            
            {/* Fit Advice */}
            <p className="text-[10px] text-white/40 italic flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-pulse-red" />
              <span>Fit: {metadata.fitRecommendation}</span>
            </p>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Orders ₹500+' },
              { icon: Shield, label: 'Secure Checkout', sub: '256-bit SSL' },
              { icon: RotateCcw, label: 'Easy Returns', sub: '30 days' },
              { icon: Package, label: 'Track Shipping', sub: 'Real-time' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3">
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
            {currentStock > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
                <span className="text-emerald-400 font-bold">In Stock</span>
                <span className="text-white/30">({currentStock} available for this variant)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pulse-red" />
                <span className="text-pulse-red font-bold">Out of Stock</span>
              </span>
            )}
          </div>

          {/* Add to Cart / Wishlist Actions */}
          {currentStock > 0 && isAuthenticated && user?.role === 'customer' && (
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
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 bg-pulse-red text-white rounded-full py-4 px-8 font-bold hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-pulse-red/25 text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => toggleWishlistMutation.mutate()}
                  disabled={toggleWishlistMutation.isPending}
                  className={`w-14 h-14 border rounded-full flex items-center justify-center transition-all duration-200 ${
                    isWishlisted 
                      ? 'bg-pulse-red/10 border-pulse-red text-pulse-red scale-105' 
                      : 'border-white/10 hover:border-white/30 text-white/40 hover:text-pulse-red'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Login CTA */}
          {!isAuthenticated && (
            <div className="glass-card rounded-2xl p-5 text-center space-y-3 border border-white/5">
              <p className="text-sm text-white/50">Sign in to purchase and leave reviews</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-pulse-red text-white rounded-full px-6 py-2.5 font-bold text-sm hover:bg-red-600 transition shadow-[0_0_20px_rgba(255,59,48,0.25)]"
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
      <section className="glass-card rounded-3xl p-8 md:p-10 space-y-8 border border-white/10">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Customer Reviews</h2>
            <p className="text-xs text-white/40">Verified shopping opinions and ratings.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 text-amber-400 text-lg">
              ★ ★ ★ ★ ★
            </div>
            <span className="font-extrabold text-white text-base">
              {product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '5.0'} / 5.0
            </span>
          </div>
        </div>

        {/* Rating distribution analytics bar chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="text-center space-y-1">
            <span className="text-5xl font-black text-white">
              {product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '5.0'}
            </span>
            <div className="text-amber-400 text-xs tracking-wider">★★★★★</div>
            <p className="text-[10px] text-white/40">{totalReviews} Reviews Analyzed</p>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars - 1] || 0;
              const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : (stars === 5 ? 85 : stars === 4 ? 10 : 5);
              return (
                <div key={stars} className="flex items-center gap-4 text-xs font-semibold">
                  <span className="w-12 text-white/50">{stars} Star</span>
                  <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <span className="w-8 text-right text-white/40">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write a review form */}
        {isAuthenticated && user?.role === 'customer' && (
          <form onSubmit={handleReviewSubmit} className="space-y-5 border-b border-white/5 pb-8">
            <h4 className="font-bold text-sm text-white/70 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-pulse-red" />
              <span>Write a Review</span>
            </h4>

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

            {/* Simulated Review Image Upload */}
            <div className="space-y-2">
              <span className="block text-[11px] text-white/30 uppercase tracking-widest font-bold">Attach Photos</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const mockPics = ['unboxing_box.jpg', 'worn_on_feet.jpg', 'sneaker_closeup.jpg'];
                    const chosen = mockPics[Math.floor(Math.random() * mockPics.length)];
                    setAttachedPhoto(chosen);
                    toast.success(`Simulated attachment of ${chosen}!`);
                  }}
                  className="px-4 py-2 border border-white/10 hover:border-white/30 rounded-xl bg-white/5 text-white/70 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
                >
                  <Camera className="h-4 w-4 text-pulse-red" />
                  <span>Attach Mock Photo</span>
                </button>
                {attachedPhoto && (
                  <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <span>{attachedPhoto} attached</span>
                    <button type="button" onClick={() => setAttachedPhoto(null)} className="text-white/40 hover:text-white ml-1 font-sans">✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Review title (e.g. Superb fit & style!)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                required
                className="w-full h-12 px-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 focus:ring-1 focus:ring-pulse-red/20 transition"
              />
              <textarea
                placeholder="Share your experience (comfort, sizing, material quality)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                rows={3}
                className="w-full p-5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 focus:ring-1 focus:ring-pulse-red/20 transition resize-none"
              />
              <button
                type="submit"
                disabled={writeReviewMutation.isPending}
                className="bg-pulse-red text-white font-bold text-xs rounded-full px-8 py-3 hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-pulse-red/25"
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
              No reviews yet. Be the first to review this premium sneaker!
            </p>
          ) : (
            reviews.map((rev) => {
              const currentHelpful = (helpfulVotes[rev.id] || 0) + (rev.helpful_count || 0);
              const hasVoted = votedHelpful[rev.id];
              
              // Extract simulated photos in comments
              const photoMatch = rev.comment.match(/\[Attached Unboxing Photo: (.*?)\]/);
              const cleanComment = photoMatch ? rev.comment.replace(photoMatch[0], '') : rev.comment;
              const photoName = photoMatch ? photoMatch[1] : null;

              return (
                <div
                  key={rev.id}
                  className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
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
                          <span key={i} className="text-white/15">★</span>
                        ))}
                      </div>
                    </div>
                    
                    <h5 className="font-bold text-sm text-white">{rev.title}</h5>
                    <p className="text-xs text-white/50 leading-relaxed">{cleanComment}</p>
                    
                    {photoName && (
                      <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl w-fit flex items-center gap-2">
                        <Camera className="h-4.5 w-4.5 text-pulse-red" />
                        <span className="text-[10px] text-white/60 font-mono italic">{photoName}</span>
                      </div>
                    )}
                  </div>

                  {/* Helpful vote action button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                    <button
                      onClick={() => handleHelpfulClick(rev.id)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                        hasVoted 
                          ? 'bg-pulse-red/10 border border-pulse-red/25 text-pulse-red' 
                          : 'bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>Helpful ({currentHelpful})</span>
                    </button>
                    
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Verified Purchase</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 3. AI RECOMMENDATIONS – Similar Products ── */}
      {recommendations && recommendations.similarProducts?.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pulse-red/10 border border-pulse-red/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-pulse-red" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">You Might Also Like</h2>
          </div>

          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            {recommendations.similarProducts.map((p: any) => (
              <div
                key={p.id}
                className="group flex-shrink-0 w-60 glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-pulse-red/5 transition-all duration-300"
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


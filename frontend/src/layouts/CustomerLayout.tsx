import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Heart, Sun, Moon, User as UserIcon, LogOut, ChevronDown, Menu, X, Trash, Compass, Cpu, HelpCircle } from 'lucide-react';
import type { RootState } from '../store';
import { logoutUser } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const CustomerLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync search input with URL params
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  // Force dark mode on mount for the premium dark aesthetic
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    document.body.classList.add('dark');
    document.body.style.backgroundColor = '#131313';
    document.body.style.color = '#e2e2e2';
  }, []);

  // Fetch Cart Items
  const { data: cartItems = [], refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/orders/cart');
      return res.data;
    },
    enabled: isAuthenticated && user?.role === 'customer',
  });

  // Fetch Wishlist Items count
  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/orders/wishlist');
      return res.data;
    },
    enabled: isAuthenticated && user?.role === 'customer',
  });

  // Cart Mutators
  const updateQtyMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return api.put('/orders/cart', { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error updating cart');
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      return api.delete(`/orders/cart/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from cart');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchInput)}`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      dispatch(logoutUser());
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Math
  const cartSubtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim text-on-surface select-none">
      
      {/* 1. Header Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="flex justify-between items-center px-6 md:px-12 py-4 max-w-container-max mx-auto h-20">
          
          {/* Logo */}
          <Link to="/" className="font-sans text-2xl tracking-tighter font-black text-white cursor-pointer select-none hover:text-pulse-red transition-colors">
            AIRVERSE
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            <Link 
              to="/products" 
              className={`font-button-text text-button-text pb-1 tracking-wider uppercase transition-colors ${
                pathname === '/products' ? 'text-pulse-red border-b-2 border-pulse-red' : 'text-on-surface/70 hover:text-on-surface font-bold'
              }`}
            >
              Shop
            </Link>
            <Link 
              to="/stories" 
              className={`font-button-text text-button-text pb-1 tracking-wider uppercase transition-colors ${
                pathname === '/stories' ? 'text-pulse-red border-b-2 border-pulse-red' : 'text-on-surface/70 hover:text-on-surface font-bold'
              }`}
            >
              Stories
            </Link>
            <Link 
              to="/innovation" 
              className={`font-button-text text-button-text pb-1 tracking-wider uppercase transition-colors ${
                pathname === '/innovation' ? 'text-pulse-red border-b-2 border-pulse-red' : 'text-on-surface/70 hover:text-on-surface font-bold'
              }`}
            >
              Innovation
            </Link>
            <Link 
              to="/sustainability" 
              className={`font-button-text text-button-text pb-1 tracking-wider uppercase transition-colors ${
                pathname === '/sustainability' ? 'text-pulse-red border-b-2 border-pulse-red' : 'text-on-surface/70 hover:text-on-surface font-bold'
              }`}
            >
              Sustainability
            </Link>
          </div>

          {/* Search bar & Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Search Input Field */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex relative w-48 focus-within:w-64 transition-all duration-300">
              <input
                type="text"
                placeholder="SEARCH VOID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 px-4 rounded-full border border-white/10 bg-white/5 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-pulse-red text-xs dark:text-white placeholder:text-platinum-gray/60"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-platinum-gray hover:text-pulse-red">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </form>

            {/* Wishlist Link */}
            {isAuthenticated && user?.role === 'customer' && (
              <Link to="/wishlist" className="p-2 rounded-full hover:bg-white/5 text-on-surface relative">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pulse-red text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
            )}

            {/* Shopping Cart Trigger */}
            {isAuthenticated && user?.role === 'customer' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 rounded-full hover:bg-white/5 text-on-surface relative"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pulse-red text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                    {cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 px-3.5 h-10 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold uppercase tracking-wider text-on-surface"
                >
                  <UserIcon className="h-4 w-4 text-pulse-red" />
                  <span className="max-w-[70px] truncate">{user?.fullName}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 animate-fade-in text-xs uppercase tracking-wider text-on-surface font-semibold">
                      {user?.role === 'customer' && (
                        <>
                          <Link to="/orders" className="block px-4 py-2.5 hover:bg-white/5" onClick={() => setIsUserDropdownOpen(false)}>My Orders</Link>
                          <Link to="/profile" className="block px-4 py-2.5 hover:bg-white/5" onClick={() => setIsUserDropdownOpen(false)}>My Profile</Link>
                          <Link to="/apply-vendor" className="block px-4 py-2.5 hover:bg-white/5 text-pulse-red" onClick={() => setIsUserDropdownOpen(false)}>Become a Seller</Link>
                        </>
                      )}
                      {user?.role === 'vendor' && (
                        <Link to="/vendor/dashboard" className="block px-4 py-2.5 hover:bg-white/5 text-pulse-red" onClick={() => setIsUserDropdownOpen(false)}>Vendor Panel</Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="block px-4 py-2.5 hover:bg-white/5 text-pulse-red" onClick={() => setIsUserDropdownOpen(false)}>Admin Panel</Link>
                      )}
                      <hr className="my-1.5 border-white/10" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-pulse-red flex items-center gap-1.5 font-bold">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-xs font-bold uppercase tracking-wider hover:text-pulse-red transition-colors">Sign In</Link>
                <Link to="/register" className="bg-pulse-red text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:brightness-115 transition-all shadow-[0_0_20px_rgba(255,59,48,0.2)]">Register</Link>
              </div>
            )}

            {/* Mobile Menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-on-surface hover:bg-white/5 rounded-full"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>

        {/* Mobile menu bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 p-5 bg-[#131313] animate-slide-up flex flex-col gap-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-12 px-5 rounded-full border border-white/10 bg-white/5 text-xs tracking-wider outline-none focus:ring-1 focus:ring-pulse-red"
              />
              <button type="submit" className="absolute right-4 top-3.5 text-platinum-gray">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </form>
            <div className="flex flex-col gap-3 font-semibold uppercase text-xs tracking-widest px-2 py-2">
              <Link 
                to="/products" 
                className={`py-2 transition-colors ${pathname === '/products' ? 'text-pulse-red' : 'text-on-surface/70 hover:text-on-surface'}`} 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                to="/stories" 
                className={`py-2 transition-colors ${pathname === '/stories' ? 'text-pulse-red' : 'text-on-surface/70 hover:text-on-surface'}`} 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Stories
              </Link>
              <Link 
                to="/innovation" 
                className={`py-2 transition-colors ${pathname === '/innovation' ? 'text-pulse-red' : 'text-on-surface/70 hover:text-on-surface'}`} 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Innovation
              </Link>
              <Link 
                to="/sustainability" 
                className={`py-2 transition-colors ${pathname === '/sustainability' ? 'text-pulse-red' : 'text-on-surface/70 hover:text-on-surface'}`} 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sustainability
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Main Page Context */}
      <main className="flex-1 w-full mx-auto pt-20">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <footer className="relative w-full pt-20 pb-10 bg-surface-container-lowest border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-16 max-w-container-max mx-auto">
          <div className="col-span-1 md:col-span-1 space-y-6">
            <div className="font-sans text-3xl font-black text-pulse-red select-none">AIRVERSE</div>
            <p className="font-body-md text-body-md text-platinum-gray leading-relaxed pr-6">
              Pushing the boundaries of what is possible on and off the track with technical innovation and elite performance designs.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-button-text text-button-text uppercase text-white font-bold tracking-widest mb-6">Explore</h4>
            <ul className="space-y-3 font-semibold text-xs tracking-wider uppercase">
              <li>
                <Link to="/stories" className="text-platinum-gray hover:text-white transition-colors block hover:translate-x-1 snappy">
                  Athlete Stories
                </Link>
              </li>
              <li>
                <Link to="/innovation" className="text-platinum-gray hover:text-white transition-colors block hover:translate-x-1 snappy">
                  Innovation Lab
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-platinum-gray hover:text-white transition-colors block hover:translate-x-1 snappy">
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-button-text text-button-text uppercase text-white font-bold tracking-widest mb-6">Support</h4>
            <ul className="space-y-3 font-semibold text-xs tracking-wider uppercase">
              <li>
                <a className="text-platinum-gray hover:text-white transition-colors block hover:translate-x-1 snappy" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="text-platinum-gray hover:text-white transition-colors block hover:translate-x-1 snappy" href="#">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-button-text text-button-text uppercase text-white font-bold tracking-widest mb-6">Social</h4>
            <div className="flex gap-4">
              <button className="p-3 bg-white/5 hover:bg-pulse-red hover:text-white text-platinum-gray rounded-full transition-all border border-white/5 flex items-center justify-center">
                <Compass className="h-4 w-4" />
              </button>
              <button className="p-3 bg-white/5 hover:bg-pulse-red hover:text-white text-platinum-gray rounded-full transition-all border border-white/5 flex items-center justify-center">
                <Cpu className="h-4 w-4" />
              </button>
              <button className="p-3 bg-white/5 hover:bg-pulse-red hover:text-white text-platinum-gray rounded-full transition-all border border-white/5 flex items-center justify-center">
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-20 border-t border-white/5 pt-10 text-center">
          <p className="font-label-caps text-[10px] text-platinum-gray tracking-widest">© 2026 NIKE AIRVERSE. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* 4. Cart Side Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-350" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-surface-container-lowest border-l border-white/10 shadow-2xl flex flex-col animate-fade-in p-8 snappy">
              
              {/* Header */}
              <div className="pb-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-headline-md text-xl tracking-tight text-white uppercase font-black">
                  Your Bag
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="p-1.5 hover:text-pulse-red transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 hide-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-platinum-gray text-xs gap-3">
                    <ShoppingBag className="h-10 w-10 text-white/20 animate-bounce" />
                    <span className="italic">Your bag is currently empty.</span>
                    <button
                      onClick={() => { setIsCartOpen(false); navigate('/products'); }}
                      className="text-pulse-red font-bold uppercase tracking-wider hover:underline"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  cartItems.map((item: any) => (
                    <div key={item.cart_item_id} className="flex gap-4 group animate-fade-in bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="w-20 h-20 bg-surface-container rounded-lg overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-xs tracking-wider text-white uppercase truncate">{item.name}</h4>
                          <button
                            onClick={() => removeMutation.mutate(item.product_id)}
                            className="text-platinum-gray hover:text-pulse-red transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-platinum-gray uppercase tracking-widest mt-0.5">Store: {item.store_name}</p>
                        
                        <div className="flex justify-between items-end mt-2">
                          {/* Qty Selector */}
                          <div className="flex items-center gap-1.5 border border-white/10 rounded px-1.5 py-0.5">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQtyMutation.mutate({ productId: item.product_id, quantity: item.quantity - 1 });
                                }
                              }}
                              className="text-xs font-bold w-4 h-4 hover:text-pulse-red transition-colors"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-bold px-1">{item.quantity}</span>
                            <button
                              onClick={() => {
                                updateQtyMutation.mutate({ productId: item.product_id, quantity: item.quantity + 1 });
                              }}
                              className="text-xs font-bold w-4 h-4 hover:text-pulse-red transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-sm text-pulse-red">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Subtotal & Checkout button */}
              {cartItems.length > 0 && (
                <div className="pt-6 border-t border-white/10 space-y-5 bg-surface-container-lowest">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-platinum-gray">Subtotal</span>
                    <span className="text-xl font-black text-white">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-pulse-red text-white py-4.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all shadow-[0_0_35px_rgba(255,59,48,0.25)]"
                  >
                    Secure Checkout
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

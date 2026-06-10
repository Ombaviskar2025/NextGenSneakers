import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Tag, CreditCard, Sparkles, Plus, Check, ChevronRight, Lock, Package, Truck, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────
// Nike AirVerse – Checkout
// ─────────────────────────────────────────────────

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Checkout step (visual stepper: 1=Address, 2=Payment, 3=Review)
  const [step, setStep] = useState(1);

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [gateway, setGateway] = useState<'stripe' | 'razorpay'>('stripe');

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');

  // Payment popup modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [paymentSession, setPaymentSession] = useState<any>(null);

  // Fetch Addresses
  const { data: addresses = [], refetch: refetchAddresses } = useQuery<any[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/orders/address');
      if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
      return res.data;
    },
  });

  // Fetch Cart Items
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ['checkout-cart'],
    queryFn: async () => {
      const res = await api.get('/orders/cart');
      return res.data;
    },
  });

  // Mutators
  const createAddressMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/orders/address', payload);
    },
    onSuccess: (res) => {
      refetchAddresses();
      setSelectedAddressId(res.data.address.id);
      setShowAddressForm(false);
      setFullName(''); setLine1(''); setCity(''); setState(''); setPostalCode(''); setPhone('');
      toast.success('Address added');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  });

  const checkCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.get(`/orders/coupons/apply/${code}`);
      return res.data;
    },
    onSuccess: (data) => {
      setActiveCoupon(data);
      toast.success(`Coupon ${data.code} applied!`);
    },
    onError: () => {
      toast.error('Invalid or expired coupon code');
      setActiveCoupon(null);
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const checkoutRes = await api.post('/orders/checkout', {
        addressId: selectedAddressId,
        couponCode: activeCoupon?.code || undefined,
      });
      const order = checkoutRes.data.order;
      setCreatedOrder(order);

      const paymentRes = await api.post('/orders/payment/session', {
        orderId: order.id,
        gateway,
      });
      setPaymentSession(paymentRes.data);
      return { order, paymentSession: paymentRes.data };
    },
    onSuccess: () => {
      setShowPaymentModal(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/orders/payment/verify', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Payment completed successfully!');
      setShowPaymentModal(false);
      navigate('/orders');
    },
    onError: () => {
      toast.error('Payment verification failed');
    }
  });

  // Math Calculations
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.type === 'percentage') {
      discount = subtotal * (parseFloat(activeCoupon.value) / 100);
    } else {
      discount = parseFloat(activeCoupon.value);
    }
    if (discount > subtotal) discount = subtotal;
  }

  const shipping = cartItems.length > 0 ? 150.00 : 0.00;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + tax + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    checkCouponMutation.mutate(couponCode);
  };

  const handleNewAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAddressMutation.mutate({
      address_type: 'shipping',
      full_name: fullName,
      address_line1: line1,
      city,
      state,
      postal_code: postalCode,
      country,
      phone,
      is_default: addresses.length === 0,
    });
  };

  const handleMockPayConfirm = () => {
    verifyPaymentMutation.mutate({
      gateway,
      transactionId: paymentSession.id,
      status: 'succeeded',
      razorpayPaymentId: gateway === 'razorpay' ? `pay_mock_${Math.random().toString(36).substring(7)}` : undefined,
      razorpaySignature: gateway === 'razorpay' ? 'mock_signature' : undefined,
    });
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  /* ── Step label data ──────────────────────────── */
  const steps = [
    { num: 1, label: 'Shipping', icon: MapPin },
    { num: 2, label: 'Payment', icon: CreditCard },
    { num: 3, label: 'Review', icon: ShieldCheck },
  ];

  const inputClass = "w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 focus:ring-1 focus:ring-pulse-red/20 transition";

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 animate-fade-in">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-pulse-red" />
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Secure Checkout</h1>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* Step Progress Bar                         */}
      {/* ══════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-3 group transition-all ${
                  step === s.num ? 'text-white' : step > s.num ? 'text-emerald-400' : 'text-white/25'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.num
                    ? 'bg-pulse-red text-white shadow-lg shadow-pulse-red/30'
                    : step > s.num
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-white/25 border border-white/10'
                }`}>
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 rounded-full transition-colors ${
                  step > s.num ? 'bg-emerald-500/40' : 'bg-white/5'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ══════════════════════════════════════════ */}
        {/* LEFT COLUMN (Steps Content)               */}
        {/* ══════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ─── STEP 1: SHIPPING ADDRESS ─────────── */}
          {step === 1 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pulse-red" />
                  Shipping Address
                </h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="glass-btn text-white/60 hover:text-white flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Address
                </button>
              </div>

              {/* Address list */}
              {!showAddressForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-white/30 col-span-2 text-center py-8">
                      No address found. Click "New Address" to create one.
                    </p>
                  ) : (
                    addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                          selectedAddressId === addr.id
                            ? 'border-pulse-red bg-pulse-red/5 shadow-lg shadow-pulse-red/10'
                            : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-white">{addr.full_name}</h4>
                          {selectedAddressId === addr.id && (
                            <div className="w-5 h-5 rounded-full bg-pulse-red flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 mt-2 leading-relaxed">
                          {addr.address_line1}, {addr.city}<br />
                          {addr.state} {addr.postal_code}, {addr.country}
                        </p>
                        <p className="text-[11px] text-white/30 mt-2 font-medium">📞 {addr.phone}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Create new address form */}
              {showAddressForm && (
                <form onSubmit={handleNewAddressSubmit} className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <h4 className="font-bold text-xs text-white/50 uppercase tracking-widest">New Shipping Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Recipient's Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Address Line 1" required value={line1} onChange={(e) => setLine1(e.target.value)} className={`${inputClass} sm:col-span-2`} />
                    <input type="text" placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="State" required value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Postal / ZIP Code" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
                      <option value="United States">United States</option>
                      <option value="India">India</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowAddressForm(false)} className="glass-btn text-white/50 rounded-full px-6 py-2.5 text-xs font-bold">
                      Cancel
                    </button>
                    <button type="submit" disabled={createAddressMutation.isPending} className="bg-pulse-red text-white rounded-full px-6 py-2.5 text-xs font-bold hover:bg-red-600 transition disabled:opacity-50">
                      {createAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {/* Next Step */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedAddressId}
                  className="flex items-center gap-2 bg-pulse-red text-white rounded-full px-8 py-3 font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-pulse-red/25 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Continue to Payment <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: PAYMENT GATEWAY ─────────── */}
          {step === 2 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 animate-slide-up">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-pulse-red" />
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stripe */}
                <button
                  onClick={() => setGateway('stripe')}
                  className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 space-y-3 ${
                    gateway === 'stripe'
                      ? 'border-pulse-red bg-pulse-red/5 shadow-lg shadow-pulse-red/10'
                      : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">stripe</span>
                    {gateway === 'stripe' && (
                      <div className="w-5 h-5 rounded-full bg-pulse-red flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30">Credit/Debit Cards • Apple Pay • Google Pay</p>
                </button>

                {/* Razorpay */}
                <button
                  onClick={() => setGateway('razorpay')}
                  className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 space-y-3 ${
                    gateway === 'razorpay'
                      ? 'border-pulse-red bg-pulse-red/5 shadow-lg shadow-pulse-red/10'
                      : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Razorpay</span>
                    {gateway === 'razorpay' && (
                      <div className="w-5 h-5 rounded-full bg-pulse-red flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30">UPI • NetBanking • Cards • Wallets</p>
                </button>
              </div>

              {/* Nav buttons */}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="glass-btn text-white/50 rounded-full px-6 py-3 text-xs font-bold hover:text-white transition">
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-pulse-red text-white rounded-full px-8 py-3 font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-pulse-red/25"
                >
                  Review Order <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: ORDER REVIEW ─────────────── */}
          {step === 3 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 animate-slide-up">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-pulse-red" />
                Review Your Order
              </h3>

              {/* Selected address summary */}
              {selectedAddress && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Shipping to</span>
                    <button onClick={() => setStep(1)} className="text-[10px] text-pulse-red font-bold hover:underline">Change</button>
                  </div>
                  <h4 className="font-bold text-sm text-white">{selectedAddress.full_name}</h4>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    {selectedAddress.address_line1}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                  </p>
                </div>
              )}

              {/* Payment summary */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Payment via</span>
                  <button onClick={() => setStep(2)} className="text-[10px] text-pulse-red font-bold hover:underline">Change</button>
                </div>
                <span className="font-bold text-sm text-white capitalize">{gateway}</span>
              </div>

              {/* Cart items */}
              <div className="space-y-3">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Items ({cartItems.length})</span>
                {cartItems.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0">
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white truncate block">{item.name}</span>
                      <span className="text-[10px] text-white/30">Qty: {item.quantity}</span>
                    </div>
                    <span className="text-sm font-bold text-white shrink-0">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="glass-btn text-white/50 rounded-full px-6 py-3 text-xs font-bold hover:text-white transition">
                  ← Back
                </button>
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={cartItems.length === 0 || !selectedAddressId || checkoutMutation.isPending}
                  className="flex items-center gap-2 bg-pulse-red text-white rounded-full px-8 py-3 font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-pulse-red/25 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Lock className="h-4 w-4" />
                  {checkoutMutation.isPending ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* RIGHT COLUMN: Order Summary Sidebar       */}
        {/* ══════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 space-y-6 sticky top-24">
            <h3 className="font-bold text-base text-white">Order Summary</h3>

            {/* Items list */}
            <div className="space-y-3 max-h-52 overflow-y-auto hide-scrollbar pr-1">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-[10px] text-white/30 font-mono w-4">{item.quantity}×</span>
                    <span className="text-white/60 truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-white/80 shrink-0 ml-2">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5" />

            {/* Coupon field */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Discount code..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-pulse-red/50 transition"
              />
              <button type="submit" disabled={checkCouponMutation.isPending} className="glass-btn rounded-xl px-4 text-xs font-bold text-white/60 hover:text-white transition">
                {checkCouponMutation.isPending ? '...' : 'Apply'}
              </button>
            </form>

            {activeCoupon && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-bold">
                <Tag className="h-3.5 w-3.5" />
                {activeCoupon.code} applied
              </div>
            )}

            <div className="border-t border-white/5" />

            {/* Pricing breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-white/40">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {activeCoupon && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount ({activeCoupon.code})</span>
                  <span>−₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/40">
                <span>Tax (8%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/5 pt-3" />
              <div className="flex justify-between text-lg font-black text-white">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { icon: Lock, label: 'SSL Secured' },
                { icon: ShieldCheck, label: 'Verified' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/20">
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════ */}
      {/* Payment Confirmation Modal                */}
      {/* ══════════════════════════════════════════ */}
      {showPaymentModal && paymentSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-white/10">

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-pulse-red/10 border border-pulse-red/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-pulse-red animate-pulse-subtle" />
              </div>
              <h3 className="font-bold text-xl text-white">Complete Transaction</h3>
              <p className="text-xs text-white/30">
                Simulating payment verification — Gateway: <span className="text-white/60 font-bold">{gateway.toUpperCase()}</span>
              </p>
            </div>

            {/* Transaction details */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex justify-between text-white/40">
                <span>Order Reference</span>
                <span className="font-bold text-white font-mono">{createdOrder.order_number}</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Session ID</span>
                <span className="font-mono text-white/50">{paymentSession.id.substring(0, 18)}…</span>
              </div>
              <div className="border-t border-white/5 pt-3" />
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Total Due</span>
                <span className="text-pulse-red">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Mock Card Input */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-white/25 uppercase tracking-widest">Mock Card Details</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                defaultValue="4242 4242 4242 4242"
                disabled
                className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/30 font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="MM/YY" defaultValue="12/26" disabled className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/30 font-mono" />
                <input type="text" placeholder="CVC" defaultValue="123" disabled className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/30 font-mono" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 glass-btn text-white/50 rounded-full py-3 font-bold text-xs hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMockPayConfirm}
                disabled={verifyPaymentMutation.isPending}
                className="flex-1 bg-pulse-red hover:bg-red-600 text-white rounded-full py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pulse-red/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                {verifyPaymentMutation.isPending ? 'Verifying...' : 'Authorize Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

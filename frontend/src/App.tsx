import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from './layouts/CustomerLayout';
import { VendorLayout } from './layouts/VendorLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Customer Pages
import { Home } from './features/customer/Home';
import { ProductCatalog } from './features/customer/ProductCatalog';
import { ProductDetails } from './features/customer/ProductDetails';
import { Wishlist } from './features/customer/Wishlist';
import { Checkout } from './features/customer/Checkout';
import { OrderHistory } from './features/customer/OrderHistory';
import { Profile } from './features/customer/Profile';
import { ApplyVendor } from './features/customer/ApplyVendor';
import { Stories } from './features/customer/Stories';
import { Innovation } from './features/customer/Innovation';
import { Sustainability } from './features/customer/Sustainability';
import { AIStudio } from './features/customer/AIStudio';

// Auth Pages
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
import { VerifyEmail } from './features/auth/VerifyEmail';

// Vendor Pages
import { VendorDashboard } from './features/vendor/VendorDashboard';
import { ProductManager } from './features/vendor/ProductManager';
import { VendorOrders } from './features/vendor/VendorOrders';
import { VendorCoupons } from './features/vendor/VendorCoupons';
import { VendorInsights } from './features/vendor/VendorInsights';

// Admin Pages
import { AdminDashboard } from './features/admin/AdminDashboard';
import { VendorApprovals } from './features/admin/VendorApprovals';
import { UserOperations } from './features/admin/UserOperations';
import { CategoryManager } from './features/admin/CategoryManager';
import { ReviewsModerator } from './features/admin/ReviewsModerator';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. Customer Storefront Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="products/:slug" element={<ProductDetails />} />
          <Route path="stories" element={<Stories />} />
          <Route path="innovation" element={<Innovation />} />
          <Route path="sustainability" element={<Sustainability />} />
          <Route path="ai-studio" element={<AIStudio />} />
          
          {/* Protected Customer Routes */}
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="apply-vendor" element={<ApplyVendor />} />
          
          {/* Guest Auth Routes */}
          <Route path="login" element={<Login />} />
          <Route path="admin-portal-login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>

        {/* 2. Vendor Portal Routes */}
        <Route path="/vendor" element={<VendorLayout />}>
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="coupons" element={<VendorCoupons />} />
          <Route path="insights" element={<VendorInsights />} />
        </Route>

        {/* 3. Admin Portal Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="vendors" element={<VendorApprovals />} />
          <Route path="users" element={<UserOperations />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="reviews" element={<ReviewsModerator />} />
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;

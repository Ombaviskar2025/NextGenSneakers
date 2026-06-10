const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[PAGE CONSOLE - ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[PAGE RUNTIME ERROR]:', err.message);
  });

  try {
    // ----------------------------------------------------
    // FLOW 1: Customer Checkout Flow
    // ----------------------------------------------------
    console.log('\n--- FLOW 1: CUSTOMER CHECKOUT ---');
    console.log('Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('Logging in as customer...');
    await page.fill('main input[type="email"]', 'customer@shopper.com');
    await page.fill('main input[type="password"]', 'Password123');
    await page.click('main form button[type="submit"]');
    await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
    console.log('Logged in as customer. URL:', page.url());

    // Browse to a Nike shoe
    console.log('Browsing to Nike Air Force 1 details page...');
    await page.goto('http://localhost:5173/products/nike-air-force-1-07', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Add to cart
    console.log('Adding to cart...');
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(1000); // Wait for toast/state updates
    
    // Open checkout
    console.log('Navigating to checkout page...');
    await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(__dirname, 'checkout_page.png') });
    console.log('Checkout page loaded.');

    // Add a new shipping address
    console.log('Clicking "New Address" to add shipping address...');
    await page.click('button:has-text("New Address")');
    
    console.log('Filling out address form...');
    await page.fill('input[placeholder="Recipient\'s Full Name"]', 'Jane Doe');
    await page.fill('input[placeholder="Phone Number"]', '9876543210');
    await page.fill('input[placeholder="Address Line 1"]', '123 Nike Street');
    await page.fill('input[placeholder="City"]', 'Mumbai');
    await page.fill('input[placeholder="State"]', 'Maharashtra');
    await page.fill('input[placeholder="Postal / ZIP Code"]', '400001');
    await page.selectOption('select', 'India');
    
    console.log('Submitting new address...');
    await page.click('button:has-text("Save Address")');
    await page.waitForTimeout(2000); // Wait for API response and render
    
    await page.screenshot({ path: path.join(__dirname, 'address_added.png') });
    console.log('Address saved. Check if address is selected.');

    // Place order and pay
    console.log('Placing order and opening payment simulation...');
    await page.click('button:has-text("Place Order & Pay")');
    await page.waitForSelector('h3:has-text("Complete Transaction")', { timeout: 8000 });
    console.log('Payment popup shown.');
    
    // Authorize Pay
    console.log('Confirming payment simulation...');
    await page.screenshot({ path: path.join(__dirname, 'payment_modal.png') });
    await page.click('button:has-text("Authorize Pay")');
    await page.waitForURL('**/orders', { timeout: 10000 });
    console.log('Payment processed. Redirected to Orders list. URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'customer_orders.png') });

    // Logout customer
    console.log('Logging out customer...');
    await page.click('button:has-text("Alice Shopper")');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('Customer logged out.');

    // ----------------------------------------------------
    // FLOW 2: Vendor Flow
    // ----------------------------------------------------
    console.log('\n--- FLOW 2: VENDOR MANAGEMENT ---');
    console.log('Logging in as vendor...');
    await page.fill('main input[type="email"]', 'vendor@store.com');
    await page.fill('main input[type="password"]', 'Password123');
    await page.click('main form button[type="submit"]');
    await page.waitForURL('**/vendor/dashboard', { timeout: 10000 });
    console.log('Logged in as vendor. URL:', page.url());
    await page.screenshot({ path: path.join(__dirname, 'vendor_dashboard.png') });

    // Navigate to Coupons
    console.log('Navigating to Vendor Coupons...');
    await page.goto('http://localhost:5173/vendor/coupons', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(__dirname, 'vendor_coupons_before.png') });

    // Create a Coupon
    console.log('Clicking "Create Coupon" button to open form...');
    await page.click('button:has-text("Create Coupon")');
    await page.waitForSelector('input[placeholder*="SUMMER"]', { timeout: 5000 });

    console.log('Creating coupon code NIKE20...');
    await page.fill('input[placeholder*="SUMMER"]', 'NIKE20');
    await page.selectOption('select', 'percentage');
    await page.fill('input[type="number"] >> nth=0', '20');
    await page.fill('input[type="number"] >> nth=1', '1000');
    
    // Set dates
    const todayStr = new Date().toISOString().slice(0, 16);
    const nextMonthStr = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"] >> nth=0', todayStr);
    await page.fill('input[type="datetime-local"] >> nth=1', nextMonthStr);
    await page.fill('input[type="number"] >> nth=2', '50');

    console.log('Clicking "Save Coupon" to submit...');
    await page.click('button:has-text("Save Coupon")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'vendor_coupons_after.png') });
    console.log('Coupon code NIKE20 creation completed.');

    // Navigate to Orders
    console.log('Navigating to Vendor Orders...');
    await page.goto('http://localhost:5173/vendor/orders', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(__dirname, 'vendor_orders.png') });
    
    // Try to update order item status to processing
    console.log('Looking for order item status update option...');
    const selectExists = await page.locator('select').count() > 0;
    if (selectExists) {
      console.log('Changing order item status...');
      await page.selectOption('select >> nth=0', 'processing');
      await page.waitForTimeout(2000);
      console.log('Order status updated in vendor panel.');
    } else {
      console.log('No orders to update in vendor panel.');
    }
    await page.screenshot({ path: path.join(__dirname, 'vendor_orders_updated.png') });

    // Logout vendor
    console.log('Logging out vendor...');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login', { timeout: 10000 });

    // ----------------------------------------------------
    // FLOW 3: Admin Flow
    // ----------------------------------------------------
    console.log('\n--- FLOW 3: ADMIN MANAGEMENT ---');
    console.log('Navigating to http://localhost:5173/admin-portal-login...');
    await page.goto('http://localhost:5173/admin-portal-login', { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('Logging in as admin...');
    await page.fill('main input[type="email"]', 'admin@platform.com');
    await page.fill('main input[type="password"]', 'Password123');
    await page.click('main form button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('Logged in as admin. URL:', page.url());

    // Navigate to Review Moderator
    console.log('Navigating to Admin Reviews Moderator...');
    await page.goto('http://localhost:5173/admin/reviews', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(__dirname, 'admin_reviews.png') });

    // Navigate to Category Manager
    console.log('Navigating to Admin Category Manager...');
    await page.goto('http://localhost:5173/admin/categories', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: path.join(__dirname, 'admin_categories_before.png') });

    // Create a Category
    console.log('Creating a new category: Tennis...');
    await page.fill('input[placeholder*="Paintings"]', 'Tennis');
    await page.fill('textarea', 'Nike premium tennis shoes for grass and clay courts.');
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'admin_categories_after.png') });
    console.log('Category creation flow finished.');

    console.log('\nAll flows finished successfully!');

  } catch (error) {
    console.error('Error during execution:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();

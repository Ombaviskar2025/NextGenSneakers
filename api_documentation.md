# REST API Documentation

This document lists the complete API contracts for the Multi-Vendor E-Commerce Platform. All endpoints are exposed under the base path `/api`.

---

## Authentication System (`/api/auth`)

### 1. Register Account
- **Route**: `POST /register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "customer@shopper.com",
    "password": "Password123",
    "fullName": "Alice Customer",
    "phone": "+15550100"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Registration successful. Please check your email to verify your account.",
    "user": {
      "id": "c3333333-3333-3333-3333-333333333333",
      "email": "customer@shopper.com",
      "fullName": "Alice Customer",
      "role": "customer",
      "isVerified": false
    }
  }
  ```

### 2. Login Account
- **Route**: `POST /login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "customer@shopper.com",
    "password": "Password123"
  }
  ```
- **Response** (200 OK):
  - Sets HttpOnly Cookie `refreshToken`.
  ```json
  {
    "message": "Login successful",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c3333333-3333-3333-3333-333333333333",
      "email": "customer@shopper.com",
      "fullName": "Alice Customer",
      "role": "customer",
      "isVerified": true,
      "avatarUrl": null
    }
  }
  ```

### 3. Refresh Access Token
- **Route**: `POST /refresh`
- **Access**: Public (HttpOnly Cookie required)
- **Response** (200 OK):
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 4. Google OAuth Login
- **Route**: `POST /google`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "idToken": "google_oauth_jwt_id_token_from_client"
  }
  ```
- **Response** (200 OK): Sets `refreshToken` cookie and returns user profile + `accessToken`.

---

## Products & Catalog (`/api/products`)

### 1. List Catalog Products
- **Route**: `GET /`
- **Access**: Public
- **Query Parameters**:
  - `search` (string, optional)
  - `categorySlug` (string, optional)
  - `minPrice` (number, optional)
  - `maxPrice` (number, optional)
  - `sortBy` (string, optional: `price_asc`, `price_desc`, `rating_desc`, `created_desc`)
  - `page` (number, default: 1)
- **Response** (200 OK):
  ```json
  {
    "products": [
      {
        "id": "p1111111-1111-1111-1111-111111111111",
        "name": "Apex Pro 15 Laptop",
        "slug": "apex-pro-15-laptop",
        "price": "1499.99",
        "compare_at_price": "1699.99",
        "sku": "LAP-APEX-15",
        "store_name": "ElectroZone Store",
        "category_name": "Computers",
        "stock_quantity": 25,
        "rating": "5.0",
        "reviews_count": 1,
        "image_url": "https://images.unsplash.com/photo-1496181130204-7552cc14ac4b?w=600"
      }
    ],
    "total": 1
  }
  ```

### 2. Get Product Detail
- **Route**: `GET /:slugOrId`
- **Access**: Public
- **Response** (200 OK): Returns detailed product fields, reviews aggregates, and array of image attachments.

### 3. Create Product
- **Route**: `POST /`
- **Access**: Vendor
- **Request Body**:
  ```json
  {
    "name": "Apex OLED Laptop",
    "categoryId": "cat11111-1111-1111-1111-111111111113",
    "description": "Premium laptop",
    "price": 1299.99,
    "sku": "LAP-APX-OLED",
    "stockQuantity": 15,
    "images": [
      { "image_url": "https://unsplash.com/...", "is_featured": true }
    ],
    "status": "published"
  }
  ```
- **Response** (210 Created): Returns created product metadata. Pending admin approval.

---

## Cart & Orders (`/api/orders`)

### 1. Get Shopping Cart
- **Route**: `GET /cart`
- **Access**: Customer
- **Response** (200 OK): Returns array of cart products and items counts.

### 2. Checkout & Order Placement
- **Route**: `POST /checkout`
- **Access**: Customer
- **Request Body**:
  ```json
  {
    "addressId": "address_uuid_value",
    "couponCode": "SUMMER25"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Order created successfully. Please finalize payment.",
    "order": {
      "id": "order_uuid_value",
      "order_number": "ORD-171802111-4829",
      "status": "pending",
      "total_amount": "1405.00"
    }
  }
  ```

### 3. Initialize Payment Session
- **Route**: `POST /payment/session`
- **Access**: Customer
- **Request Body**:
  ```json
  {
    "orderId": "order_uuid_value",
    "gateway": "stripe"
  }
  ```
- **Response** (200 OK): Returns Stripe payment intent client secret or Razorpay Order ID.

---

## AI Features (`/api/ai`)

### 1. AI Product Description Generator
- **Route**: `POST /generate-description`
- **Access**: Vendor
- **Request Body**:
  ```json
  {
    "name": "Horizon OLED Monitor",
    "features": ["32-inch screen", "4K resolution", "144Hz refresh rate"]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "description": "### Overview\nExperience stunning details with the **Horizon OLED Monitor**..."
  }
  ```

### 2. AI Sales Insights
- **Route**: `GET /insights`
- **Access**: Vendor / Admin
- **Response** (200 OK): Returns a business report outlining growth recommendations.

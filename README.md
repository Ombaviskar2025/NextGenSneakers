# Horizon: Multi-Vendor E-Commerce Platform

Horizon is a production-ready, enterprise-grade Multi-Vendor E-Commerce platform modeled after Amazon Marketplace, Flipkart, and Etsy. It supports independent vendor stores, customer shopping, payment integrations (Stripe, Razorpay), real-time notifications via WebSockets, and AI services using Google Gemini.

---

## 🚀 Key Features

### 👤 Customer Actions
- **Catalog Browsing**: Multi-filter catalog grids (by category, price range, star ratings) with lists/grid layout toggling.
- **Product Details**: Multi-image gallery with cursor hover zoom effects, spec list, and review forms.
- **Cart & Wishlist**: Slide-over cart drawers, bookmarks, and automated coupon validations.
- **Addresses & Checkout**: Shipping card builders and Stripe + Razorpay checkout forms.
- **Tracking & Invoices**: Itemized order progression history and dynamic PDF invoice downloads.

### 🏪 Vendor Actions
- **Store Dashboard**: KPI widgets, revenue line charts (Chart.js), and low-stock alerts.
- **Inventory Upload**: Catalog forms supporting Cloudinary file uploads or Base64 conversion fallbacks.
- **Coupon System**: Discount code generators supporting percentage or fixed amount discounts.
- **Order Fulfillment**: Update shipping statuses for specific items inside orders.
- **AI Tools**: Write SEO description copy and request Gemini-based monthly sales reports.

### 🛡️ Admin Actions
- **Platform Analytics**: Global KPIs (users, vendors, revenue) and sales doughnut charts.
- **Accounts ModerationCenter**: Approve/reject vendor store proposals, suspend vendor accounts, ban users.
- **Category Taxonomy**: Hierarchy organizer to manage parent/child categories.
- **Review Filters**: Hide spam review descriptions and remove inappropriate text comments.

---

## 🛠️ Technology Stack
- **Frontend**: React.js, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Query, Axios, Chart.js
- **Backend**: Node.js, Express.js, TypeScript, Socket.io, PDFkit, Helmet, bcryptjs, jsonwebtoken
- **Database**: PostgreSQL connection pooling (`pg`)
- **Payments**: Stripe, Razorpay
- **AI Modules**: Google Gemini 1.5 Flash API
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB connections, Socket.io, payments
│   │   ├── controllers/     # Route controller endpoints
│   │   ├── middleware/      # Auth JWT guards, schema validators, rate limits
│   │   ├── models/          # PostgreSQL query repositories
│   │   ├── routes/          # Express API route bindings
│   │   ├── services/        # Nodemailer, Stripe, Cloudinary, Gemini AI, PDFkit
│   │   └── utils/           # Zod schema validators
│   ├── tests/               # Jest integration tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI alerts, skeletons
│   │   ├── context/         # Dark/Light mode theme state
│   │   ├── features/        # Pages grouped by role (customer, vendor, admin, auth)
│   │   ├── layouts/         # Navigation dashboard shells
│   │   ├── services/        # Axios API clients & React Query
│   │   └── store/           # Redux Toolkit authentication slices
│   └── Dockerfile
├── docker-compose.yml       # Containerized cluster orchestrator
├── db_schema.sql            # Main database schema setup
├── seeds.sql                # Initial database seed script
└── api_documentation.md     # REST endpoint details
```

---

## 💻 Local Quickstart

### Prerequisites
- Node.js (v20+) installed
- PostgreSQL database running (or run via Docker)

### 1. Database Setup
Create a PostgreSQL database named `multivendor_db` and execute the schema and seed scripts:
```bash
psql -U postgres -d multivendor_db -f db_schema.sql
psql -U postgres -d multivendor_db -f seeds.sql
```

### 2. Run Backend
Go to the backend folder, compile dependencies, copy `.env.example` into `.env`, and start the dev server:
```bash
cd backend
npm install
npm run dev
```

### 3. Run Frontend
Go to the frontend folder, compile dependencies, and boot the Vite server:
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Compose Quickstart

Launch the entire ecosystem (PostgreSQL, Express Backend, served Nginx Frontend) in one command:
```bash
docker-compose up --build
```
- Frontend will be served at [http://localhost:3000](http://localhost:3000)
- Backend API will be served at [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Test Credentials
Verify different roles using these preseeded accounts (Password: `Password123`):

1. **System Administrator**: `admin@platform.com`
2. **Approved Tech Vendor**: `vendor1@store.com`
3. **Approved Craft Vendor**: `vendor2@store.com`
4. **Regular Customer**: `customer@shopper.com`

---

## ☁️ Deployment Instructions

### Frontend (Vercel)
1. Link your repository to Vercel.
2. Select the `frontend` subdirectory.
3. Configure environment variables:
   - `VITE_API_URL` = (Your Render backend endpoint, e.g., `https://api.yourdomain.com/api`)
4. Click Deploy.

### Backend (Render)
1. Create a Web Service on Render and point it to the `backend` subdirectory.
2. Select **Docker** or **Node** environment.
3. Set the variables:
   - `DATABASE_URL` = (Postgres Neon/Aiven database connection string)
   - `JWT_SECRET` = (Secure random string)
   - `JWT_REFRESH_SECRET` = (Secure random string)
   - `GEMINI_API_KEY` = (Google Gemini key to enable AI description/insights tools)
   - `STRIPE_SECRET_KEY` = (Stripe API key)
   - `RAZORPAY_KEY_ID` = (Razorpay Key ID)
   - `RAZORPAY_KEY_SECRET` = (Razorpay Secret)

---

## 🧪 Testing Commands
Execute the backend Jest integration testing suites:
```bash
cd backend
npm run test
```

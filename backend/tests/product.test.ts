import request from 'supertest';
import express from 'express';

import productRoutes from '../src/routes/product.routes';
import { db } from '../src/config/db';

jest.mock('../src/config/db', () => ({
  db: {
    query: jest.fn(),
    transaction: jest.fn((cb) => cb({ query: jest.fn() })),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Products API Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should retrieve a list of approved products', async () => {
      // Mock db.query for select products and count products
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'p-1',
              name: 'Sample Laptop',
              slug: 'sample-laptop',
              price: '999.99',
              store_name: 'ElectroStore',
              image_url: 'https://sample.com/img.jpg',
              rating: '4.5',
            },
          ],
        }) // select query
        .mockResolvedValueOnce({
          rows: [{ total: '1' }],
        }); // count query

      const res = await request(app).get('/api/products?search=Laptop');

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe('Sample Laptop');
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/products/:slugOrId', () => {
    it('should fetch product details by slug successfully', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 'p-1',
            name: 'Sample Laptop',
            slug: 'sample-laptop',
            price: '999.99',
            store_name: 'ElectroStore',
            category_name: 'Electronics',
            stock_quantity: 15,
            images: [{ image_url: 'https://sample.com/img.jpg', is_featured: true }],
          },
        ],
      });

      const res = await request(app).get('/api/products/sample-laptop');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Sample Laptop');
      expect(res.body.stock_quantity).toBe(15);
    });

    it('should return 404 if product is not found', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // By slug
        .mockResolvedValueOnce({ rows: [] }); // By UUID check

      const res = await request(app).get('/api/products/non-existent-product');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });
});

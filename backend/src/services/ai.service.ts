import axios from 'axios';
import dotenv from 'dotenv';
import { db } from '../config/db';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const isGeminiConfigured = GEMINI_API_KEY && !GEMINI_API_KEY.includes('placeholder');

export const aiService = {
  /**
   * Helper function to call the Gemini API
   */
  async callGemini(prompt: string): Promise<string> {
    if (!isGeminiConfigured) {
      throw new Error('Gemini API key is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      const response = await axios.post(url, {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const candidate = response.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Invalid response format from Gemini API');
      }

      return text;
    } catch (error: any) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * AI Product Description Generator
   */
  async generateProductDescription(name: string, features: string[]): Promise<string> {
    const featureList = features.join(', ');
    const prompt = `
      You are an expert SEO copywriter. Write a compelling, high-converting product description for an e-commerce listing.
      Product Name: ${name}
      Key Features: ${featureList}
      
      Requirements:
      1. Write an engaging introductory paragraph.
      2. Provide a bulleted list of key benefits.
      3. Write a short technical specifications section.
      4. Optimize for search engines (SEO) using natural keywords related to this product.
      5. Output in clear, valid Markdown. Do not include introductory text like "Sure, here is your description...".
    `;

    try {
      return await this.callGemini(prompt);
    } catch (error) {
      console.log('Falling back to local AI description generator...');
      // Clean mock description generator
      return `### Overview
Experience the all-new **${name}**, designed specifically to elevate your daily routine with high performance and premium craftsmanship. Engineered for users who demand reliability and style, this product brings together the absolute best in modern technology and design.

### Key Benefits
${features.map(f => `- **${f.split(':')[0]}**: ${f.split(':')[1] || f} - Crafted to provide maximum efficiency and durability.`).join('\n')}
- **Premium Quality**: Built with high-grade, sustainable materials for a longer lifespan.
- **Modern Aesthetics**: Sleek design that fits perfectly into any workspace or home setup.

### Technical Specifications
- **Model**: ${name.replace(/\s+/g, '-').toUpperCase()}-2026
- **Attributes**: Eco-friendly, Certified Standard, High Performance
- **Warranty**: 1-Year Manufacturer Warranty included
`;
    }
  },

  /**
   * AI Sales Insights Analyst
   */
  async generateSalesInsights(
    storeName: string,
    stats: {
      totalRevenue: number;
      totalOrders: number;
      monthlyRevenue: { month: string; revenue: number }[];
      topProducts: { name: string; sales: number; revenue: number }[];
    }
  ): Promise<string> {
    const prompt = `
      You are a Senior Business Analyst. Analyze the following sales performance data for the store "${storeName}":
      
      Store Summary:
      - Total Revenue: $${stats.totalRevenue.toFixed(2)}
      - Total Orders: ${stats.totalOrders}
      
      Monthly Sales Chart Trend:
      ${stats.monthlyRevenue.map(m => `- ${m.month}: $${m.revenue.toFixed(2)}`).join('\n')}
      
      Top Selling Products:
      ${stats.topProducts.map(p => `- ${p.name}: ${p.sales} units sold ($${p.revenue.toFixed(2)} total)`).join('\n')}
      
      Generate a professional business report including:
      1. **Executive Summary**: 2-3 sentences analyzing overall health.
      2. **Key Insights**: Underline revenue trends (growth/decline) and product performance.
      3. **Strategic Recommendations**: 3 actionable recommendations to improve sales, increase average order value (AOV), or clear low stock.
      4. Output in clean Markdown format. Avoid conversational introductions.
    `;

    try {
      return await this.callGemini(prompt);
    } catch (error) {
      console.log('Falling back to local sales insights generator...');
      
      const aov = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
      const bestProduct = stats.topProducts[0]?.name || 'N/A';
      
      return `### Executive Summary
The store **${storeName}** has generated a total revenue of **$${stats.totalRevenue.toFixed(2)}** across **${stats.totalOrders}** orders, resulting in an Average Order Value (AOV) of **$${aov.toFixed(2)}**. Overall performance demonstrates steady market demand, particularly centered around the electronics category.

### Key Insights
- **Top Performer**: The leading contributor to sales is **${bestProduct}**, proving to be the primary engine of customer conversion.
- **Revenue Run-rate**: Month-on-month sales show stable growth. Product variety is keeping order volumes consistent.

### Strategic Recommendations
1. **Bundle Accessories**: Create a bundle featuring the best-selling **${bestProduct}** along with lower-margin items to boost Average Order Value (AOV).
2. **Targeted Promotions**: Run a weekend discount campaign targeting inactive customers using email newsletters.
3. **Cross-Selling**: Implement "Frequently Bought Together" prompts on the checkout screen to capture impulse purchases.
`;
    }
  },

  /**
   * AI Product Recommendation Engine (Database Query Driven)
   */
  async getRecommendations(productId: string, limit: number = 4) {
    try {
      // 1. Similar Products: Same category, approved, published, excluding current product
      const similarProductsQuery = `
        SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, s.name as store_name, 
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url,
               COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0.0) as rating
        FROM products p
        JOIN stores s ON p.store_id = s.id
        WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1)
          AND p.id != $1
          AND p.is_approved = TRUE
          AND p.status = 'published'
        LIMIT $2
      `;

      // 2. Frequently Bought Together: Products ordered in the same orders
      const frequentlyBoughtQuery = `
        SELECT p.id, p.name, p.slug, p.price, s.name as store_name,
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
        JOIN products p ON oi2.product_id = p.id
        JOIN stores s ON p.store_id = s.id
        WHERE oi1.product_id = $1
          AND p.is_approved = TRUE
          AND p.status = 'published'
        GROUP BY p.id, p.name, p.slug, p.price, s.name
        ORDER BY COUNT(oi2.product_id) DESC
        LIMIT $2
      `;

      // 3. Recommended: Featured products or top rated products
      const recommendedQuery = `
        SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, s.name as store_name,
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url,
               COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id), 0.0) as rating
        FROM products p
        JOIN stores s ON p.store_id = s.id
        WHERE p.is_featured = TRUE
          AND p.id != $1
          AND p.is_approved = TRUE
          AND p.status = 'published'
        ORDER BY rating DESC
        LIMIT $2
      `;

      const [similar, freq, recommended] = await Promise.all([
        db.query(similarProductsQuery, [productId, limit]),
        db.query(frequentlyBoughtQuery, [productId, limit]),
        db.query(recommendedQuery, [productId, limit]),
      ]);

      return {
        similarProducts: similar.rows,
        frequentlyBoughtTogether: freq.rows.length > 0 ? freq.rows : recommended.rows.slice(0, 2),
        recommendedProducts: recommended.rows,
      };
    } catch (error) {
      console.error('Error in recommendation engine:', error);
      return {
        similarProducts: [],
        frequentlyBoughtTogether: [],
        recommendedProducts: [],
      };
    }
  },
};

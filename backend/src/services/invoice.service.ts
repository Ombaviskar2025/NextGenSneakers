import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const invoiceService = {
  /**
   * Generate PDF invoice and stream it to the express response
   */
  generateInvoicePdf(order: any, res: Response): void {
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to Express response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.order_number}.pdf`);
    doc.pipe(res);

    // 1. Header Section
    doc
      .fillColor('#1e3a8a')
      .fontSize(20)
      .text('MARKETPLACE INC.', 50, 45)
      .fillColor('#4b5563')
      .fontSize(10)
      .text('123 Marketplace Blvd, Suite 100', 50, 65)
      .text('San Francisco, CA, 94103', 50, 80)
      .text('support@marketplace.com', 50, 95)
      .fontSize(20)
      .fillColor('#111827')
      .text('INVOICE', 400, 45, { align: 'right' })
      .fontSize(9)
      .fillColor('#4b5563')
      .text(`Invoice No: ${order.order_number}`, 400, 70, { align: 'right' })
      .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 400, 85, { align: 'right' })
      .text(`Status: ${order.status.toUpperCase()}`, 400, 100, { align: 'right' });

    // Divider Line
    doc.moveTo(50, 120).lineTo(550, 120).stroke('#e5e7eb');

    // 2. Addresses Section
    const shippingAddress = order.shipping_address;
    
    doc
      .fontSize(12)
      .fillColor('#1f2937')
      .text('Billed & Shipped To:', 50, 140)
      .fontSize(10)
      .fillColor('#4b5563')
      .text(shippingAddress.full_name, 50, 160)
      .text(shippingAddress.address_line1, 50, 175)
      if (shippingAddress.address_line2) {
        doc.text(shippingAddress.address_line2, 50, 190);
      }
    const currentY = shippingAddress.address_line2 ? 205 : 190;
    doc
      .text(`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`, 50, currentY)
      .text(shippingAddress.country, 50, currentY + 15)
      .text(`Phone: ${shippingAddress.phone}`, 50, currentY + 30);

    // 3. Table Headers
    const tableTop = 270;
    doc.font('Helvetica-Bold');
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('Item Description', 50, tableTop)
      .text('SKU', 250, tableTop)
      .text('Price', 350, tableTop, { align: 'right' })
      .text('Qty', 420, tableTop, { align: 'right' })
      .text('Total', 480, tableTop, { align: 'right' });
    doc.font('Helvetica');

    // Line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#1f2937');

    // 4. Table Items
    let y = tableTop + 25;
    order.items.forEach((item: any) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      doc
        .fontSize(9)
        .fillColor('#4b5563')
        .text(item.name.substring(0, 35), 50, y)
        .text(item.sku, 250, y)
        .text(`₹${parseFloat(item.price).toFixed(2)}`, 350, y, { align: 'right' })
        .text(item.quantity.toString(), 420, y, { align: 'right' })
        .text(`₹${itemTotal.toFixed(2)}`, 480, y, { align: 'right' });
      
      // Draw subline
      doc.moveTo(50, y + 12).lineTo(550, y + 12).stroke('#f3f4f6');
      y += 20;
    });

    // 5. Invoice Totals
    const subtotal = order.items.reduce((sum: number, item: any) => sum + parseFloat(item.price) * item.quantity, 0);
    const rightAlignX = 400;
    y += 10;

    doc
      .fontSize(9)
      .fillColor('#4b5563')
      .text('Subtotal:', rightAlignX, y)
      .text(`₹${subtotal.toFixed(2)}`, 480, y, { align: 'right' })
      
      .text(`Discount (${order.coupon_code || 'None'}):`, rightAlignX, y + 15)
      .text(`-₹${parseFloat(order.discount_amount).toFixed(2)}`, 480, y + 15, { align: 'right' })

      .text('Tax (8%):', rightAlignX, y + 30)
      .text(`₹${parseFloat(order.tax_amount).toFixed(2)}`, 480, y + 30, { align: 'right' })

      .text('Shipping:', rightAlignX, y + 45)
      .text(`₹${parseFloat(order.shipping_amount).toFixed(2)}`, 480, y + 45, { align: 'right' });

    doc.moveTo(rightAlignX, y + 60).lineTo(550, y + 60).stroke('#e5e7eb');

    doc.font('Helvetica-Bold');
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Total Amount Due:', rightAlignX, y + 70)
      .text(`₹${parseFloat(order.total_amount).toFixed(2)}`, 480, y + 70, { align: 'right' });
    doc.font('Helvetica');

    // Footer
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text('Thank you for shopping with us!', 50, 700, { align: 'center' })
      .text('If you have any questions regarding this invoice, contact our support team.', 50, 715, { align: 'center' });

    // End document
    doc.end();
  },
};

import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Order } from '../../entities/order.entity';

@Injectable()
export class InvoiceService {
  async generateInvoiceBuffer(order: Order): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const customerName =
        order.user?.profiles?.[0]?.fullName ||
        order.user?.email ||
        order.userId;
      const address = order.address
        ? `${order.address.label}, ${order.address.street}, ${order.address.city}, ${order.address.country}`
        : 'Adresse non renseignée';
      const payment = order.payments[0];

      doc.fontSize(24).text('FACTURE / INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Commande: ${order.orderNumber}`);
      doc.text(
        `Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}`,
      );
      doc.text(`Client: ${customerName}`);
      doc.text(`Email: ${order.user?.email || '-'}`);
      doc.text(`Adresse: ${address}`);
      doc.moveDown();

      doc.fontSize(14).text('Produits', { underline: true });
      doc.moveDown(0.5);

      order.orderItems.forEach((item, index) => {
        const productName = item.product?.name || item.productId;
        const lineTotal = Number(item.priceAtPurchase) * item.quantity;
        doc
          .fontSize(11)
          .text(
            `${index + 1}. ${productName} — ${item.quantity} x $${Number(item.priceAtPurchase).toFixed(2)} = $${lineTotal.toFixed(2)}`,
          );
      });

      doc.moveDown();
      doc.fontSize(14).text('Paiement', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Méthode: ${payment?.paymentMethod || '-'}`);
      doc.text(`Référence: ${payment?.transactionId || '-'}`);
      doc.text(`Téléphone: ${payment?.payerPhone || '-'}`);
      doc.text(`Statut paiement: ${payment?.status || '-'}`);
      doc.text(`Statut commande: ${order.status}`);
      doc.moveDown();

      doc
        .fontSize(12)
        .text(`Sous-total: $${Number(order.subtotal).toFixed(2)}`, {
          align: 'right',
        });
      doc.text(`Livraison: $${Number(order.shippingFee).toFixed(2)}`, {
        align: 'right',
      });
      if (Number(order.discountAmount || 0) > 0) {
        const couponLabel = order.couponCode
          ? `Remise (${order.couponCode})`
          : 'Remise';
        doc.text(
          `-${couponLabel}: $${Number(order.discountAmount).toFixed(2)}`,
          {
            align: 'right',
          },
        );
      }
      doc.fontSize(14).text(`Total: $${Number(order.totalAmount).toFixed(2)}`, {
        align: 'right',
      });

      doc.moveDown(2);
      doc
        .fontSize(10)
        .fillColor('gray')
        .text('Merci pour votre commande sur E-shop Pro.', { align: 'center' });

      doc.end();
    });
  }
}

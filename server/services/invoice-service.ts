import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVOICE_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');

// Ensure invoice directory exists
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  client: {
    name: string;
    address?: string;
    phone?: string;
  };
  technician: {
    name: string;
  };
  service: {
    description: string;
    date: string;
  };
  amount: {
    subtotal: number;
    fee: number;
    total: number;
  };
}

export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice-${data.invoiceNumber}.pdf`;
    const filePath = path.join(INVOICE_DIR, filename);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc
      .fontSize(20)
      .text('AlloBricolage', { align: 'center' })
      .fontSize(10)
      .text('Plateforme de mise en relation B2B', { align: 'center' })
      .moveDown();

    doc.fontSize(16).text('FACTURE', { align: 'left' });
    doc.fontSize(10).text(`Numéro: ${data.invoiceNumber}`, { align: 'left' });
    doc.text(`Date: ${data.date}`, { align: 'left' });
    doc.moveDown();

    // Client & Tech Info
    doc.text(`Client: ${data.client.name}`, 50, 200);
    if (data.client.phone) doc.text(`Tél: ${data.client.phone}`);
    
    doc.text(`Technicien: ${data.technician.name}`, 300, 200);
    doc.moveDown();

    // Line Divider
    doc.moveTo(50, 250).lineTo(550, 250).stroke();

    // Service Details
    doc.fontSize(12).text('Détails du service', 50, 270);
    doc.fontSize(10).text(data.service.description, 50, 290);
    doc.text(`Date d'intervention: ${data.service.date}`, 50, 305);

    // Amounts
    const yStart = 350;
    doc.text('Montant Service:', 350, yStart);
    doc.text(`${data.amount.subtotal.toFixed(2)} MAD`, 450, yStart, { align: 'right' });

    doc.text('Frais de service:', 350, yStart + 20);
    doc.text(`${data.amount.fee.toFixed(2)} MAD`, 450, yStart + 20, { align: 'right' });

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL:', 350, yStart + 50);
    doc.text(`${data.amount.total.toFixed(2)} MAD`, 450, yStart + 50, { align: 'right' });

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        'Merci de votre confiance. Pour toute question: support@allobricolage.ma',
        50,
        700,
        { align: 'center', width: 500 }
      );

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/invoices/${filename}`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}


// src/utils/invoiceGenerator.js
// Generates PDF invoices using jsPDF
// Two types:
// 1. Single transaction invoice
// 2. Product invoice (all transactions for one product)

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// ── HELPER: Draw invoice header ──────────────────────────────────
const drawHeader = (doc, title, subtitle) => {
  const pageW = doc.internal.pageSize.width;

  // Blue header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 36, 'F');

  // Invoice title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, 14);

  // Subtitle (transaction type or product name)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 24);

  // Invoice number and date — top right
  doc.setFontSize(9);
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  doc.text(`Date: ${date}  ${time}`, pageW - 14, 14, { align: 'right' });
  doc.text(title, pageW - 14, 24, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
};


// ── HELPER: Draw footer ──────────────────────────────────────────
const drawFooter = (doc) => {
  const pageW  = doc.internal.pageSize.width;
  const pageH  = doc.internal.pageSize.height;
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);

    // Divider line
    doc.setDrawColor(229, 231, 235);
    doc.line(14, pageH - 16, pageW - 14, pageH - 16);

    // Footer text
    doc.text('Inventory Management System', 14, pageH - 8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageW / 2, pageH - 8,
      { align: 'center' }
    );
    doc.text(
      new Date().toLocaleDateString(),
      pageW - 14, pageH - 8,
      { align: 'right' }
    );
  }
};


// ── HELPER: Format currency ──────────────────────────────────────
const fmt = (v) => `$${parseFloat(v || 0).toFixed(2)}`;


// ════════════════════════════════════════════════════════════════
// INVOICE TYPE 1: Single Transaction Invoice
// Called when user clicks invoice button on a transaction row
// ════════════════════════════════════════════════════════════════
export const generateTransactionInvoice = (transaction) => {
  const doc    = new jsPDF();
  const isIN   = transaction.transaction_type === 'IN';
  const product = transaction.product;

  // ── Header ──
  drawHeader(
    doc,
    `Invoice #TXN-${String(transaction.id).padStart(4, '0')}`,
    `Stock ${transaction.transaction_type} — ${product?.name || 'Unknown Product'}`
  );

  // ── Transaction Summary Box ──
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Transaction Details', 14, 48);

  // Light background box for summary
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 52, 182, 44, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  const boxY  = 60;
  const lineH = 8;

  // Left column
  doc.text('Transaction Type:', 20, boxY);
  doc.text('Product:',          20, boxY + lineH);
  doc.text('Quantity:',         20, boxY + lineH * 2);
  doc.text('Date:',             20, boxY + lineH * 3);

  // Right column — values in darker color
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isIN ? 'STOCK IN (Received)' : 'STOCK OUT (Issued)',
    75, boxY
  );
  doc.text(product?.name || '—',                       75, boxY + lineH);
  doc.text(String(transaction.quantity) + ' units',    75, boxY + lineH * 2);
  doc.text(new Date(transaction.created_at).toLocaleString(), 75, boxY + lineH * 3);

  if (transaction.note) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Note:', 20, boxY + lineH * 4 + 2);
    doc.setTextColor(17, 24, 39);
    doc.text(transaction.note, 75, boxY + lineH * 4 + 2);
  }

  // ── Product Details Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('Product Information', 14, 108);

  // Build product rows
  const productRows = [
    ['Product Name',     product?.name         || '—'],
    ['SKU',              product?.sku           || '—'],
    ['Category',         product?.category?.name || '—'],
    ['Supplier',         product?.supplier?.name || '—'],
    ['Selling Price',    fmt(product?.price)],
    ['Cost Price',       product?.cost_price ? fmt(product.cost_price) : '—'],
    ['Current Stock',    product ? `${product.quantity} units` : '—'],
  ];

  autoTable(doc, {
    startY:    112,
    head:      [['Field', 'Value']],
    body:      productRows,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize:  9,
    },
    bodyStyles: {
      fontSize:  9,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, fillColor: [243, 244, 246] },
      1: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  // ── Financial Summary ──
  const finalY = doc.lastAutoTable.finalY + 10;

  // Only show financial summary if product has pricing
  if (product?.price) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text('Financial Summary', 14, finalY);

    const sellingTotal = (product.price      || 0) * transaction.quantity;
    const costTotal    = (product.cost_price || 0) * transaction.quantity;
    const profit       = sellingTotal - costTotal;
    const margin       = sellingTotal > 0
      ? ((profit / sellingTotal) * 100).toFixed(1)
      : '0.0';

    autoTable(doc, {
      startY: finalY + 4,
      head:   [['Description', 'Unit Price', 'Quantity', 'Total']],
      body:   [
        [
          `${product.name} (Selling)`,
          fmt(product.price),
          transaction.quantity,
          fmt(sellingTotal),
        ],
        ...(product.cost_price ? [[
          `${product.name} (Cost)`,
          fmt(product.cost_price),
          transaction.quantity,
          fmt(costTotal),
        ]] : []),
      ],
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize:  9,
      },
      bodyStyles:  { fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
    });

    // Profit summary box
    const summaryY = doc.lastAutoTable.finalY + 6;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, summaryY, 182, 26, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Gross Profit:', 20, summaryY + 8);
    doc.text('Profit Margin:', 20, summaryY + 17);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(profit >= 0 ? 22 : 220, profit >= 0 ? 163 : 38, profit >= 0 ? 74 : 38);
    doc.text(fmt(profit),    80, summaryY + 8);
    doc.text(`${margin}%`,   80, summaryY + 17);
  }

  drawFooter(doc);

  // Save with meaningful filename
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`invoice_txn_${transaction.id}_${dateStr}.pdf`);
};


// ════════════════════════════════════════════════════════════════
// INVOICE TYPE 2: Product Invoice
// Shows all transactions for one product with running totals
// ════════════════════════════════════════════════════════════════
export const generateProductInvoice = (product, transactions) => {
  const doc = new jsPDF();

  // ── Header ──
  drawHeader(
    doc,
    `Product Report — ${new Date().toLocaleDateString()}`,
    `${product.name} | All Transactions`
  );

  // ── Product Summary Box ──
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Product Details', 14, 48);

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 52, 182, 36, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);

  const fields = [
    ['Name:',          product.name],
    ['SKU:',           product.sku         || '—'],
    ['Category:',      product.category?.name || '—'],
    ['Selling Price:', fmt(product.price)],
    ['Cost Price:',    product.cost_price ? fmt(product.cost_price) : '—'],
    ['Current Stock:', `${product.quantity} units`],
  ];

  // Two columns layout
  fields.forEach((field, i) => {
    const col  = i % 2 === 0 ? 20  : 105;
    const row  = Math.floor(i / 2);
    const y    = 60 + row * 8;
    doc.setTextColor(75, 85, 99);
    doc.text(field[0], col, y);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(field[1], col + 28, y);
    doc.setFont('helvetica', 'normal');
  });

  // ── Transactions Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('Transaction History', 14, 98);

  const rows = transactions.map(t => [
    `#${t.id}`,
    t.transaction_type,
    `${t.transaction_type === 'IN' ? '+' : '-'}${t.quantity}`,
    t.note || '—',
    new Date(t.created_at).toLocaleDateString(),
    new Date(t.created_at).toLocaleTimeString(),
  ]);

  autoTable(doc, {
    startY: 102,
    head:   [['#', 'Type', 'Quantity', 'Note', 'Date', 'Time']],
    body:   rows,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize:  9,
    },
    bodyStyles: {
      fontSize:  8,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      1: {
        // Color IN green, OUT red
        fontStyle: 'bold',
      },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      // Color the Type column
      if (data.column.index === 1 && data.section === 'body') {
        data.cell.styles.textColor =
          data.cell.raw === 'IN' ? [22, 163, 74] : [220, 38, 38];
      }
      // Color quantity column
      if (data.column.index === 2 && data.section === 'body') {
        data.cell.styles.textColor =
          String(data.cell.raw).startsWith('+') ? [22, 163, 74] : [220, 38, 38];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Financial Summary ──
  const finalY = doc.lastAutoTable.finalY + 10;

  const totalIn  = transactions.filter(t => t.transaction_type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter(t => t.transaction_type === 'OUT').reduce((s, t) => s + t.quantity, 0);

  const revenueEstimate = totalOut * (product.price      || 0);
  const costEstimate    = totalIn  * (product.cost_price || 0);
  const profitEstimate  = revenueEstimate - costEstimate;
  const marginEstimate  = revenueEstimate > 0
    ? ((profitEstimate / revenueEstimate) * 100).toFixed(1)
    : '0.0';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text('Summary', 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head:   [['Metric', 'Value']],
    body:   [
      ['Total Units Received (IN)',  `${totalIn} units`],
      ['Total Units Issued (OUT)',   `${totalOut} units`],
      ['Current Stock',              `${product.quantity} units`],
      ['Estimated Revenue (OUT × Selling Price)', fmt(revenueEstimate)],
      ['Estimated Cost (IN × Cost Price)',        fmt(costEstimate)],
      ['Estimated Gross Profit',                  fmt(profitEstimate)],
      ['Estimated Profit Margin',                 `${marginEstimate}%`],
    ],
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize:  9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [243, 244, 246], cellWidth: 110 },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  drawFooter(doc);

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`invoice_product_${product.id}_${dateStr}.pdf`);
};
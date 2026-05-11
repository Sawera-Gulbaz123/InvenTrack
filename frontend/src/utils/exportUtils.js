// src/utils/exportUtils.js
// Handles all export logic — CSV, Excel, PDF
// Used by ExportMenu component on Products and Transactions pages

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// ── CSV EXPORT ───────────────────────────────────────────────────
// headers: array of { label, key } objects
// data:    array of row objects
// filename: string without extension
export const exportToCSV = (headers, data, filename) => {
  if (data.length === 0) { alert('No data to export'); return; }

  // Build rows using only the selected headers
  const rows = data.map(row =>
    headers.map(h => {
      const val = h.getValue ? h.getValue(row) : row[h.key];
      // Wrap in quotes to handle commas inside values
      return `"${val ?? ''}"`;
    })
  );

  const csvContent = [
    headers.map(h => h.label).join(','),  // header row
    ...rows.map(r => r.join(','))         // data rows
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];

  link.href     = url;
  link.download = `${filename}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


// ── EXCEL EXPORT ─────────────────────────────────────────────────
export const exportToExcel = (headers, data, filename) => {
  if (data.length === 0) { alert('No data to export'); return; }

  // Build 2D array: first row = headers, rest = data
  const wsData = [
    headers.map(h => h.label),
    ...data.map(row =>
      headers.map(h => h.getValue ? h.getValue(row) : (row[h.key] ?? ''))
    )
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns based on content length
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.label.length,
      ...data.map(row => {
        const val = h.getValue ? h.getValue(row) : (row[h.key] ?? '');
        return String(val).length;
      })
    );
    return { wch: Math.min(maxLen + 2, 40) }; // cap at 40 chars wide
  });
  ws['!cols'] = colWidths;

  const wb   = XLSX.utils.book_new();
  const date = new Date().toISOString().split('T')[0];
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
};


// ── PDF EXPORT ───────────────────────────────────────────────────
export const exportToPDF = (headers, data, filename, title) => {
  if (data.length === 0) { alert('No data to export'); return; }

  const doc  = new jsPDF();
  const date = new Date().toLocaleDateString();

  // ── Header section ──
  // Blue rectangle at top
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 220, 28, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Inventory Management System  |  Generated: ${date}`, 14, 21);

  // Reset text color for body
  doc.setTextColor(0, 0, 0);

  // ── Table ──
  autoTable(doc, {
    startY: 34,
    head:   [headers.map(h => h.label)],
    body:   data.map(row =>
      headers.map(h => h.getValue ? h.getValue(row) : (row[h.key] ?? ''))
    ),
    headStyles: {
      fillColor:  [37, 99, 235],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    styles: {
      cellPadding: 3,
      overflow:    'linebreak',
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  const dateSuffix = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${dateSuffix}.pdf`);
};


// ════════════════════════════════════════
// COLUMN DEFINITIONS
// These define ALL possible columns for
// each page. ReportBuilder lets user
// pick which ones to include.
// ════════════════════════════════════════

export const PRODUCT_COLUMNS = [
  { key: 'id',                 label: 'ID',                 defaultOn: true,  getValue: p => p.id },
  { key: 'name',               label: 'Name',               defaultOn: true,  getValue: p => p.name },
  { key: 'sku',                label: 'SKU',                defaultOn: true,  getValue: p => p.sku || '' },
  { key: 'category',           label: 'Category',           defaultOn: true,  getValue: p => p.category?.name || '' },
  { key: 'supplier',           label: 'Supplier',           defaultOn: false, getValue: p => p.supplier?.name || '' },
  { key: 'price',              label: 'Price ($)',          defaultOn: true,  getValue: p => parseFloat(p.price).toFixed(2) },
  { key: 'quantity',           label: 'Quantity',           defaultOn: true,  getValue: p => p.quantity },
  { key: 'low_stock_threshold',label: 'Low Stock At',       defaultOn: false, getValue: p => p.low_stock_threshold },
  { key: 'status',             label: 'Status',             defaultOn: true,  getValue: p => p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.low_stock_threshold ? 'Low Stock' : 'In Stock' },
  { key: 'description',        label: 'Description',        defaultOn: false, getValue: p => p.description || '' },
  { key: 'created_at',         label: 'Date Added',         defaultOn: false, getValue: p => new Date(p.created_at).toLocaleDateString() },
];

export const TRANSACTION_COLUMNS = [
  { key: 'id',               label: 'ID',       defaultOn: true,  getValue: t => t.id },
  { key: 'type',             label: 'Type',     defaultOn: true,  getValue: t => t.transaction_type },
  { key: 'product',          label: 'Product',  defaultOn: true,  getValue: t => t.product?.name || '' },
  { key: 'quantity',         label: 'Quantity', defaultOn: true,  getValue: t => t.transaction_type === 'IN' ? `+${t.quantity}` : `-${t.quantity}` },
  { key: 'note',             label: 'Note',     defaultOn: true,  getValue: t => t.note || '' },
  { key: 'date',             label: 'Date',     defaultOn: true,  getValue: t => new Date(t.created_at).toLocaleDateString() },
  { key: 'time',             label: 'Time',     defaultOn: false, getValue: t => new Date(t.created_at).toLocaleTimeString() },
  { key: 'product_category', label: 'Category', defaultOn: false, getValue: t => t.product?.category?.name || '' },
];
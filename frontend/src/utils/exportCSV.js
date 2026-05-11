// src/utils/exportCSV.js

// This function takes an array of products and downloads a CSV file
// No external library needed — pure browser JavaScript

export const exportProductsToCSV = (products) => {

  if (products.length === 0) {
    alert('No products to export');
    return;
  }

  // Define the column headers for the CSV file
  const headers = [
    'ID',
    'Name',
    'SKU',
    'Category',
    'Supplier',
    'Price ($)',
    'Quantity',
    'Low Stock Threshold',
    'Status',
    'Created At'
  ];

  // Convert each product object into a CSV row
  const rows = products.map(product => {
    // Determine stock status
    const isOut  = product.quantity === 0;
    const isLow  = product.quantity <= product.low_stock_threshold;
    const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';

    // Each value becomes a cell
    // We wrap values in quotes to handle commas inside text
    return [
      product.id,
      `"${product.name}"`,
      product.sku    || '',
      `"${product.category?.name || 'Uncategorized'}"`,
      `"${product.supplier?.name || 'N/A'}"`,
      product.price.toFixed(2),
      product.quantity,
      product.low_stock_threshold,
      status,
      new Date(product.created_at).toLocaleDateString()
    ];
  });

  // Combine headers and rows into one CSV string
  // Each row is joined by commas, rows separated by newlines
  const csvContent = [
    headers.join(','),           // Header row
    ...rows.map(r => r.join(',')) // Data rows
  ].join('\n');

  // Create a Blob (Binary Large Object) — a file-like object in memory
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a temporary invisible download link
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Set the filename with today's date
  const date     = new Date().toISOString().split('T')[0]; // e.g. 2024-01-15
  link.href      = url;
  link.download  = `inventory_${date}.csv`;

  // Programmatically click the link to trigger download
  document.body.appendChild(link);
  link.click();

  // Clean up — remove the link and free memory
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


// Export transactions to CSV as well
export const exportTransactionsToCSV = (transactions) => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  const headers = [
    'ID',
    'Type',
    'Product',
    'Quantity',
    'Note',
    'Date'
  ];

  const rows = transactions.map(t => [
    t.id,
    t.transaction_type,
    `"${t.product?.name || 'Unknown'}"`,
    t.transaction_type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`,
    `"${t.note || ''}"`,
    new Date(t.created_at).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob     = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url      = URL.createObjectURL(blob);
  const link     = document.createElement('a');
  const date     = new Date().toISOString().split('T')[0];
  link.href      = url;
  link.download  = `transactions_${date}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
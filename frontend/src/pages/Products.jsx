// src/pages/Products.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiPackage, FiAlertTriangle, FiFileText,
  FiTrendingUp, FiTrendingDown, FiPaperclip
} from 'react-icons/fi';

import { productAPI, categoryAPI, supplierAPI, transactionAPI } from '../api';
import Modal             from '../components/ui/Modal';
import ConfirmDialog     from '../components/ui/ConfirmDialog';
import LoadingSpinner    from '../components/ui/LoadingSpinner';
import EmptyState        from '../components/ui/EmptyState';
import ExportMenu        from '../components/ui/ExportMenu';
import PrintButton       from '../components/ui/PrintButton';
import AttachmentsPanel  from '../components/ui/AttachmentsPanel';
import { PRODUCT_COLUMNS } from '../utils/exportUtils';
import { generateProductInvoice } from '../utils/invoiceGenerator';


// ─────────────────────────────────────────
// PRODUCT FORM
// ─────────────────────────────────────────
const ProductForm = ({ initial, categories, suppliers, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name:                initial?.name                || '',
    description:         initial?.description         || '',
    price:               initial?.price               || '',
    cost_price:          initial?.cost_price          || '',
    quantity:            initial?.quantity             ?? 0,
    low_stock_threshold: initial?.low_stock_threshold ?? 10,
    sku:                 initial?.sku                 || '',
    category_id:         initial?.category_id         || '',
    supplier_id:         initial?.supplier_id         || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const margin = formData.price && formData.cost_price && parseFloat(formData.price) > 0
    ? (((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price)) * 100).toFixed(1)
    : null;

  const handleSubmit = async () => {
    if (!formData.name.trim())                  { toast.error('Name is required'); return; }
    if (!formData.price || formData.price <= 0) { toast.error('Price must be > 0'); return; }
    if (formData.cost_price && parseFloat(formData.cost_price) > parseFloat(formData.price)) {
      toast.error('Cost price cannot be higher than selling price');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        price:               parseFloat(formData.price),
        cost_price:          formData.cost_price ? parseFloat(formData.cost_price) : 0,
        quantity:            parseInt(formData.quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        category_id:         formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id:         formData.supplier_id ? parseInt(formData.supplier_id) : null,
        sku:                 formData.sku.trim() || null,
        description:         formData.description.trim() || null,
      });
    } finally { setSubmitting(false); }
  };

  const ic = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={lc}>Name <span className="text-red-500">*</span></label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. iPhone 15" className={ic} />
      </div>
      <div>
        <label className={lc}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Optional" rows={2} className={ic} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Selling Price ($) <span className="text-red-500">*</span></label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className={ic} />
        </div>
        <div>
          <label className={lc}>Cost Price ($)</label>
          <input type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className={ic} />
        </div>
      </div>

      {margin !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          parseFloat(margin) >= 0
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {parseFloat(margin) >= 0 ? <FiTrendingUp size={15} /> : <FiTrendingDown size={15} />}
          Profit margin: <span className="font-bold">{margin}%</span>
          <span className="ml-auto text-xs opacity-75">
            Profit per unit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lc}>Quantity</label>
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" className={ic} />
        </div>
        <div>
          <label className={lc}>Low Stock Alert At</label>
          <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} min="0" className={ic} />
        </div>
      </div>
      <div>
        <label className={lc}>SKU</label>
        <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. ELEC-001" className={ic} />
      </div>
      <div>
        <label className={lc}>Category</label>
        <select name="category_id" value={formData.category_id} onChange={handleChange} className={ic}>
          <option value="">-- Select Category --</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={lc}>Supplier</label>
        <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className={ic}>
          <option value="">-- Select Supplier --</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Saving...' : (initial ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────
// MAIN PRODUCTS PAGE
// ─────────────────────────────────────────
const Products = () => {
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [suppliers,      setSuppliers]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAdd,        setShowAdd]        = useState(false);
  const [showEdit,       setShowEdit]       = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [selected,       setSelected]       = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [expandedId,     setExpandedId]     = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchProducts(); }, [search, categoryFilter]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        categoryAPI.getAll(),
        supplierAPI.getAll(),
      ]);
      setCategories(cRes.data);
      setSuppliers(sRes.data);
      await fetchProducts();
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search)         params.search      = search;
      if (categoryFilter) params.category_id = categoryFilter;
      const res = await productAPI.getAll(params);
      setProducts(res.data);
    } catch { toast.error('Failed to load products'); }
  };

  const handleAdd = async (data) => {
    try {
      await productAPI.create(data);
      toast.success('Product added ✅');
      setShowAdd(false);
      fetchProducts();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = async (data) => {
    try {
      await productAPI.update(selected.id, data);
      toast.success('Product updated ✅');
      setShowEdit(false);
      setSelected(null);
      fetchProducts();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await productAPI.delete(selected.id);
      toast.success('Product deleted ✅');
      setSelected(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleProductInvoice = async (product) => {
    try {
      setInvoiceLoading(product.id);
      const res = await transactionAPI.getByProduct(product.id);
      generateProductInvoice(product, res.data);
      toast.success('Invoice generated ✅');
    } catch {
      toast.error('Failed to generate invoice');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const getMargin = (product) => {
    if (!product.cost_price || !product.price || product.price === 0) return null;
    return (((product.price - product.cost_price) / product.price) * 100).toFixed(1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <PrintButton />
          <ExportMenu data={products} columns={PRODUCT_COLUMNS} filename="products" pdfTitle="Products Report" />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FiPlus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <EmptyState message="No products found. Add your first product!" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Sell Price</th>
                  <th className="px-6 py-4 font-medium">Cost Price</th>
                  <th className="px-6 py-4 font-medium">Margin</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map(product => {
                  const isLow    = product.quantity <= product.low_stock_threshold;
                  const isOut    = product.quantity === 0;
                  const margin   = getMargin(product);
                  const isProfit = margin !== null && parseFloat(margin) >= 0;

                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <FiPackage className="text-blue-600 dark:text-blue-400" size={15} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[140px]">{product.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{product.sku || '—'}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.category?.name || '—'}</td>

                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                          ${parseFloat(product.price).toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {product.cost_price
                            ? `$${parseFloat(product.cost_price).toFixed(2)}`
                            : <span className="text-gray-400 italic text-xs">not set</span>
                          }
                        </td>

                        <td className="px-6 py-4">
                          {margin !== null ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              isProfit
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                            }`}>
                              {isProfit ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                              {margin}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {isLow && <FiAlertTriangle className="text-red-500" size={13} />}
                            <span className={`font-medium ${
                              isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-800 dark:text-gray-100'
                            }`}>
                              {product.quantity}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isOut ? 'bg-red-100 text-red-700' :
                            isLow ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 no-print">
                          <div className="flex items-center gap-1">

                            {/* Attachments toggle */}
                            <button
                              onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                              className={`p-2 rounded-lg transition-colors relative ${
                                expandedId === product.id
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                              title="Attachments"
                            >
                              <FiPaperclip size={14} />
                              {product.attachments?.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center leading-none">
                                  {product.attachments.length}
                                </span>
                              )}
                            </button>

                            {/* Invoice */}
                            <button
                              onClick={() => handleProductInvoice(product)}
                              disabled={invoiceLoading === product.id}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                              title="Generate Invoice"
                            >
                              {invoiceLoading === product.id
                                ? <span className="text-xs">...</span>
                                : <FiFileText size={14} />
                              }
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => { setSelected(product); setShowEdit(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <FiEdit2 size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => { setSelected(product); setShowConfirm(true); }}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable attachments row */}
                      {expandedId === product.id && (
                        <tr className="bg-blue-50 dark:bg-gray-900 border-b border-blue-100 dark:border-gray-700">
                          <td colSpan={9} className="px-8 py-4">
                            <AttachmentsPanel productId={product.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Product">
        <ProductForm categories={categories} suppliers={suppliers} onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Product">
        <ProductForm initial={selected} categories={categories} suppliers={suppliers} onSubmit={handleEdit} onClose={() => { setShowEdit(false); setSelected(null); }} />
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setSelected(null); }}
        onConfirm={handleDelete}
        message={`Delete "${selected?.name}"? This cannot be undone.`}
      />
    </div>
  );
};

export default Products;
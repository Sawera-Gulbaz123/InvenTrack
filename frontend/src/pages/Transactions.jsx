// src/pages/Transactions.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiArrowUp, FiArrowDown,
  FiRepeat, FiFilter, FiFileText, FiPaperclip
} from 'react-icons/fi';

import { transactionAPI, productAPI } from '../api';
import Modal             from '../components/ui/Modal';
import ConfirmDialog     from '../components/ui/ConfirmDialog';
import LoadingSpinner    from '../components/ui/LoadingSpinner';
import EmptyState        from '../components/ui/EmptyState';
import ExportMenu        from '../components/ui/ExportMenu';
import PrintButton       from '../components/ui/PrintButton';
import AttachmentsPanel  from '../components/ui/AttachmentsPanel';
import { TRANSACTION_COLUMNS } from '../utils/exportUtils';
import { generateTransactionInvoice } from '../utils/invoiceGenerator';


// ─────────────────────────────────────────
// TRANSACTION FORM
// ─────────────────────────────────────────
const TransactionForm = ({ products, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    product_id:       '',
    transaction_type: 'IN',
    quantity:         '',
    note:             '',
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(
    p => p.id === parseInt(formData.product_id)
  );

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.product_id)               { toast.error('Select a product'); return; }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) { toast.error('Quantity must be > 0'); return; }
    if (
      formData.transaction_type === 'OUT' &&
      selectedProduct &&
      parseInt(formData.quantity) > selectedProduct.quantity
    ) {
      toast.error(`Insufficient stock. Available: ${selectedProduct.quantity}`);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        product_id:       parseInt(formData.product_id),
        transaction_type: formData.transaction_type,
        quantity:         parseInt(formData.quantity),
        note:             formData.note.trim() || null,
      });
    } finally { setSubmitting(false); }
  };

  const financialPreview = selectedProduct &&
    formData.transaction_type === 'OUT' &&
    formData.quantity &&
    parseInt(formData.quantity) > 0;

  const previewRevenue = financialPreview
    ? (selectedProduct.price * parseInt(formData.quantity)).toFixed(2)
    : null;

  const previewCost = financialPreview && selectedProduct.cost_price
    ? (selectedProduct.cost_price * parseInt(formData.quantity)).toFixed(2)
    : null;

  const previewProfit = previewRevenue && previewCost
    ? (parseFloat(previewRevenue) - parseFloat(previewCost)).toFixed(2)
    : null;

  const ic = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={lc}>Transaction Type</label>
        <div className="grid grid-cols-2 gap-2">
          {['IN', 'OUT'].map(type => (
            <button
              key={type}
              onClick={() => setFormData(p => ({ ...p, transaction_type: type }))}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                formData.transaction_type === type
                  ? type === 'IN'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold'
                  : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              {type === 'IN' ? <FiArrowDown size={15} /> : <FiArrowUp size={15} />}
              Stock {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={lc}>Product <span className="text-red-500">*</span></label>
        <select name="product_id" value={formData.product_id} onChange={handleChange} className={ic}>
          <option value="">-- Select Product --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
          ))}
        </select>
        {selectedProduct && (
          <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex gap-3">
            <span>Stock: <b className={`${
              selectedProduct.quantity === 0 ? 'text-red-500' :
              selectedProduct.quantity <= selectedProduct.low_stock_threshold ? 'text-yellow-500' :
              'text-green-600'
            }`}>{selectedProduct.quantity}</b></span>
            <span>Sell: <b>${parseFloat(selectedProduct.price).toFixed(2)}</b></span>
            {selectedProduct.cost_price > 0 && (
              <span>Cost: <b>${parseFloat(selectedProduct.cost_price).toFixed(2)}</b></span>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={lc}>Quantity <span className="text-red-500">*</span></label>
        <input
          type="number" name="quantity" value={formData.quantity}
          onChange={handleChange} min="1" placeholder="Enter quantity"
          className={ic}
        />
        {formData.transaction_type === 'OUT' && selectedProduct &&
          parseInt(formData.quantity) > selectedProduct.quantity && (
          <p className="text-xs text-red-500 mt-1">⚠️ Exceeds available stock</p>
        )}
      </div>

      {financialPreview && previewRevenue && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs space-y-1">
          <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1.5">💰 Financial Preview</p>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Revenue ({formData.quantity} × ${selectedProduct.price}):</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">${previewRevenue}</span>
          </div>
          {previewCost && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Cost ({formData.quantity} × ${selectedProduct.cost_price}):</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">${previewCost}</span>
            </div>
          )}
          {previewProfit && (
            <div className="flex justify-between border-t dark:border-gray-700 pt-1 mt-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Gross Profit:</span>
              <span className={`font-bold ${parseFloat(previewProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${previewProfit}
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className={lc}>Note (Optional)</label>
        <textarea
          name="note" value={formData.note} onChange={handleChange} rows={2}
          placeholder={formData.transaction_type === 'IN' ? 'e.g. Restocked from supplier' : 'e.g. Sold to customer'}
          className={ic}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button
          onClick={handleSubmit} disabled={submitting}
          className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
            formData.transaction_type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {submitting ? 'Processing...' : `Record Stock ${formData.transaction_type}`}
        </button>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────
// MAIN TRANSACTIONS PAGE
// ─────────────────────────────────────────
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [typeFilter,   setTypeFilter]   = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [expandedId,   setExpandedId]   = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([
        transactionAPI.getAll(),
        productAPI.getAll(),
      ]);
      setTransactions(tRes.data);
      setProducts(pRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (data) => {
    try {
      await transactionAPI.create(data);
      toast.success(`Stock ${data.transaction_type === 'IN' ? 'added' : 'removed'} ✅`);
      setShowAdd(false);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await transactionAPI.delete(selected.id);
      toast.success('Transaction deleted ✅');
      setSelected(null);
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleInvoice = (transaction) => {
    try {
      generateTransactionInvoice(transaction);
      toast.success('Invoice downloaded ✅');
    } catch {
      toast.error('Failed to generate invoice');
    }
  };

  const filtered = typeFilter
    ? transactions.filter(t => t.transaction_type === typeFilter)
    : transactions;

  const totalIn  = transactions.filter(t => t.transaction_type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter(t => t.transaction_type === 'OUT').reduce((s, t) => s + t.quantity, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">All stock movements — IN and OUT</p>
        </div>
        <div className="flex gap-2 no-print">
          <PrintButton />
          <ExportMenu data={transactions} columns={TRANSACTION_COLUMNS} filename="transactions" pdfTitle="Transactions Report" />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FiPlus size={18} /> New Transaction
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Transactions', value: transactions.length, color: 'blue',  icon: FiRepeat    },
          { label: 'Total Stock IN',     value: `+${totalIn}`,       color: 'green', icon: FiArrowDown },
          { label: 'Total Stock OUT',    value: `-${totalOut}`,       color: 'red',   icon: FiArrowUp   },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className={`p-2 bg-${card.color}-100 dark:bg-${card.color}-900 rounded-lg`}>
              <card.icon className={`text-${card.color}-600 dark:text-${card.color}-400`} size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className={`text-xl font-bold ${
                card.color === 'green' ? 'text-green-600' :
                card.color === 'red'   ? 'text-red-500'   :
                'text-gray-800 dark:text-gray-100'
              }`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 no-print">
        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Filter:</span>
        {[['', 'All'], ['IN', '↓ Stock IN'], ['OUT', '↑ Stock OUT']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === val
                ? val === 'IN'  ? 'bg-green-100 text-green-700'
                : val === 'OUT' ? 'bg-red-100 text-red-700'
                :                 'bg-blue-100 text-blue-700'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >{label}</button>
        ))}
        <span className="ml-auto text-sm text-gray-400">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="No transactions found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Quantity</th>
                  <th className="px-6 py-4 font-medium">Value</th>
                  <th className="px-6 py-4 font-medium">Note</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(t => {
                  const isIN = t.transaction_type === 'IN';
                  const unitPrice = isIN
                    ? (t.product?.cost_price || t.product?.price || 0)
                    : (t.product?.price || 0);
                  const txnValue = (unitPrice * t.quantity).toFixed(2);

                  return (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isIN ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isIN ? <FiArrowDown size={10} /> : <FiArrowUp size={10} />}
                            {t.transaction_type}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                          {t.product?.name || '—'}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`font-bold text-base ${isIN ? 'text-green-600' : 'text-red-500'}`}>
                            {isIN ? '+' : '-'}{t.quantity}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                          ${txnValue}
                        </td>

                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                          {t.note || '—'}
                        </td>

                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          <p>{new Date(t.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString()}</p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 no-print">
                          <div className="flex items-center gap-1">

                            {/* Attachments toggle */}
                            <button
                              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                              className={`p-2 rounded-lg transition-colors relative ${
                                expandedId === t.id
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                              title="Attachments"
                            >
                              <FiPaperclip size={14} />
                              {t.attachments?.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center leading-none">
                                  {t.attachments.length}
                                </span>
                              )}
                            </button>

                            {/* Invoice */}
                            <button
                              onClick={() => handleInvoice(t)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title="Download Invoice"
                            >
                              <FiFileText size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => { setSelected(t); setShowConfirm(true); }}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable attachments row */}
                      {expandedId === t.id && (
                        <tr className="bg-blue-50 dark:bg-gray-900 border-b border-blue-100 dark:border-gray-700">
                          <td colSpan={7} className="px-8 py-4">
                            <AttachmentsPanel transactionId={t.id} />
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

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Record New Transaction">
        <TransactionForm products={products} onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setSelected(null); }}
        onConfirm={handleDelete}
        message="Delete this transaction? Note: this does NOT reverse the stock change."
      />
    </div>
  );
};

export default Transactions;
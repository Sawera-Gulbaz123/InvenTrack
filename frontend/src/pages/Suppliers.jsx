// src/pages/Suppliers.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiTruck, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { supplierAPI }  from '../api';
import Modal            from '../components/ui/Modal';
import ConfirmDialog    from '../components/ui/ConfirmDialog';
import LoadingSpinner   from '../components/ui/LoadingSpinner';
import EmptyState       from '../components/ui/EmptyState';
import PrintButton      from '../components/ui/PrintButton';

const SupplierForm = ({ initial, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name:    initial?.name    || '',
    email:   initial?.email   || '',
    phone:   initial?.phone   || '',
    address: initial?.address || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    try {
      setSubmitting(true);
      await onSubmit({
        name:    formData.name.trim(),
        email:   formData.email.trim()   || null,
        phone:   formData.phone.trim()   || null,
        address: formData.address.trim() || null,
      });
    } finally { setSubmitting(false); }
  };

  const ic = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={lc}>Name <span className="text-red-500">*</span></label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Tech Distributors" className={ic} />
      </div>
      <div>
        <label className={lc}>Email</label>
        <div className="relative">
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="supplier@email.com" className={`${ic} pl-9`} />
        </div>
      </div>
      <div>
        <label className={lc}>Phone</label>
        <div className="relative">
          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92-300-1234567" className={`${ic} pl-9`} />
        </div>
      </div>
      <div>
        <label className={lc}>Address</label>
        <div className="relative">
          <FiMapPin className="absolute left-3 top-3 text-gray-400" size={14} />
          <textarea name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Lahore" rows={3} className={`${ic} pl-9`} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Saving...' : (initial ? 'Update Supplier' : 'Add Supplier')}
        </button>
      </div>
    </div>
  );
};

const Suppliers = () => {
  const [suppliers,    setSuppliers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [selected,     setSelected]     = useState(null);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierAPI.getAll();
      setSuppliers(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (data) => {
    try {
      await supplierAPI.create(data);
      toast.success('Supplier added ✅');
      setShowAdd(false);
      fetchSuppliers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = async (data) => {
    try {
      await supplierAPI.update(selected.id, data);
      toast.success('Supplier updated ✅');
      setShowEdit(false);
      setSelected(null);
      fetchSuppliers();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await supplierAPI.delete(selected.id);
      toast.success('Supplier deleted ✅');
      setSelected(null);
      fetchSuppliers();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <PrintButton />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FiPlus size={18} /> Add Supplier
          </button>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState message="No suppliers yet. Add your first one!" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(sup => (
            <div key={sup.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FiTruck className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{sup.name}</h3>
                </div>
                <div className="flex gap-1 no-print">
                  <button onClick={() => { setSelected(sup); setShowEdit(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg"><FiEdit2 size={14} /></button>
                  <button onClick={() => { setSelected(sup); setShowConfirm(true); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-2">
                {sup.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiMail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiPhone size={13} className="text-gray-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                )}
                {sup.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FiMapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </div>
                )}
                {!sup.email && !sup.phone && !sup.address && (
                  <p className="text-sm text-gray-400 italic">No contact info provided</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Added {new Date(sup.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Supplier">
        <SupplierForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Supplier">
        <SupplierForm initial={selected} onSubmit={handleEdit} onClose={() => { setShowEdit(false); setSelected(null); }} />
      </Modal>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setSelected(null); }}
        onConfirm={handleDelete}
        message={`Delete "${selected?.name}"?`}
      />
    </div>
  );
};

export default Suppliers;
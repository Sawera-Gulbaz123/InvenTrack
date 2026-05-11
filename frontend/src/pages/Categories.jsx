// src/pages/Categories.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import { categoryAPI }  from '../api';
import Modal            from '../components/ui/Modal';
import ConfirmDialog    from '../components/ui/ConfirmDialog';
import LoadingSpinner   from '../components/ui/LoadingSpinner';
import EmptyState       from '../components/ui/EmptyState';
import PrintButton      from '../components/ui/PrintButton';

const CategoryForm = ({ initial, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name:        initial?.name        || '',
    description: initial?.description || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally { setSubmitting(false); }
  };

  const ic = "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={lc}>Name <span className="text-red-500">*</span></label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Electronics" className={ic} />
      </div>
      <div>
        <label className={lc}>Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Optional" rows={3} className={ic} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Saving...' : (initial ? 'Update Category' : 'Add Category')}
        </button>
      </div>
    </div>
  );
};

const Categories = () => {
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [selected,     setSelected]     = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll();
      setCategories(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (data) => {
    try {
      await categoryAPI.create(data);
      toast.success('Category added ✅');
      setShowAdd(false);
      fetchCategories();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = async (data) => {
    try {
      await categoryAPI.update(selected.id, data);
      toast.success('Category updated ✅');
      setShowEdit(false);
      setSelected(null);
      fetchCategories();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.delete(selected.id);
      toast.success('Category deleted ✅');
      setSelected(null);
      fetchCategories();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <PrintButton />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FiPlus size={18} /> Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState message="No categories yet. Add your first one!" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FiTag className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div className="flex gap-1 no-print">
                  <button onClick={() => { setSelected(cat); setShowEdit(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                  <button onClick={() => { setSelected(cat); setShowConfirm(true); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {cat.description || 'No description provided'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Added {new Date(cat.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Category">
        <CategoryForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Category">
        <CategoryForm initial={selected} onSubmit={handleEdit} onClose={() => { setShowEdit(false); setSelected(null); }} />
      </Modal>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setSelected(null); }}
        onConfirm={handleDelete}
        message={`Delete "${selected?.name}"? Products will be unassigned.`}
      />
    </div>
  );
};

export default Categories;
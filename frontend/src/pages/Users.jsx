// src/pages/Users.jsx
// Admin-only page for managing user accounts and viewing activity logs

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiShield, FiActivity, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../api';
import Modal         from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState    from '../components/ui/EmptyState';
import { useAuth }   from '../context/AuthContext';

// ── USER FORM ────────────────────────────────────────────────────
const UserForm = ({ initial, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    username:  initial?.username  || '',
    password:  '',
    role:      initial?.role      || 'viewer',
    is_active: initial?.is_active ?? true,
  });
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => setFormData(p => ({
    ...p,
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  const handleSubmit = async () => {
    if (!formData.username.trim()) { toast.error('Username required'); return; }
    if (!initial && !formData.password) { toast.error('Password required'); return; }

    try {
      setSubmitting(true);
      const data = { ...formData };
      // If editing and password is empty, don't send it
      if (initial && !data.password) delete data.password;
      await onSubmit(data);
    } finally { setSubmitting(false); }
  };

  const ic = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lc = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-4">
      <div>
        <label className={lc}>Username <span className="text-red-500">*</span></label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="e.g. john" className={ic} />
      </div>

      <div>
        <label className={lc}>
          Password {initial && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            name="password" value={formData.password} onChange={handleChange}
            placeholder={initial ? 'Leave blank to keep unchanged' : 'Enter password'}
            className={`${ic} pr-10`}
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className={lc}>Role</label>
        <select name="role" value={formData.role} onChange={handleChange} className={ic}>
          <option value="admin">Admin — Full access</option>
          <option value="viewer">Viewer — Read only</option>
        </select>
      </div>

      {initial && (
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-blue-600" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Account is active</label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Saving...' : (initial ? 'Update User' : 'Create User')}
        </button>
      </div>
    </div>
  );
};


// ── MAIN USERS PAGE ──────────────────────────────────────────────
const Users = () => {
  const { user: currentUser } = useAuth();
  const [users,        setUsers]        = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('users');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [selected,     setSelected]     = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [uRes, lRes] = await Promise.all([
        api.get('/users/'),
        api.get('/users/activity-logs'),
      ]);
      setUsers(uRes.data);
      setLogs(lRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (data) => {
    try {
      await api.post('/users/', data);
      toast.success('User created ✅');
      setShowAdd(false);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = async (data) => {
    try {
      await api.put(`/users/${selected.id}`, data);
      toast.success('User updated ✅');
      setShowEdit(false);
      setSelected(null);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selected.id}`);
      toast.success('User deleted ✅');
      setSelected(null);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage accounts and view activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'users', label: 'Users',         icon: FiUser     },
          { key: 'logs',  label: 'Activity Log',  icon: FiActivity },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FiPlus size={18} /> Add User
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {users.length === 0 ? <EmptyState message="No users found" /> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-blue-600" size={14} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{u.username}</p>
                            {u.username === currentUser?.username && (
                              <p className="text-xs text-blue-500">You</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role === 'admin' ? <FiShield size={11} /> : <FiEye size={11} />}
                          {u.role === 'admin' ? 'Admin' : 'Viewer'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelected(u); setShowEdit(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FiEdit2 size={14} />
                          </button>
                          {u.username !== currentUser?.username && (
                            <button onClick={() => { setSelected(u); setShowConfirm(true); }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {logs.length === 0 ? <EmptyState message="No activity yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-gray-500">
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium">Detail</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-[250px] truncate">
                        {log.detail || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.user?.username || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create New User">
        <UserForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit User">
        <UserForm initial={selected} onSubmit={handleEdit} onClose={() => { setShowEdit(false); setSelected(null); }} />
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setSelected(null); }}
        onConfirm={handleDelete}
        message={`Delete user "${selected?.username}"? This cannot be undone.`}
      />
    </div>
  );
};

export default Users;
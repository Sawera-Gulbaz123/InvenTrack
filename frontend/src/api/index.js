// src/api/index.js

import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('ims_user');
    if (stored) {
      const { access_token } = JSON.parse(stored);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    }
  } catch { }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ims_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const categoryAPI = {
  getAll:  ()        => api.get('/categories/'),
  getOne:  (id)      => api.get(`/categories/${id}`),
  create:  (data)    => api.post('/categories/', data),
  update:  (id, d)   => api.put(`/categories/${id}`, d),
  delete:  (id)      => api.delete(`/categories/${id}`),
};

export const supplierAPI = {
  getAll:  ()        => api.get('/suppliers/'),
  getOne:  (id)      => api.get(`/suppliers/${id}`),
  create:  (data)    => api.post('/suppliers/', data),
  update:  (id, d)   => api.put(`/suppliers/${id}`, d),
  delete:  (id)      => api.delete(`/suppliers/${id}`),
};

export const productAPI = {
  getAll:  (params)  => api.get('/products/',      { params }),
  getOne:  (id)      => api.get(`/products/${id}`),
  create:  (data)    => api.post('/products/',      data),
  update:  (id, d)   => api.put(`/products/${id}`,  d),
  delete:  (id)      => api.delete(`/products/${id}`),
};

export const transactionAPI = {
  getAll:       ()    => api.get('/transactions/'),
  getByProduct: (id)  => api.get(`/transactions/product/${id}`),
  create:       (d)   => api.post('/transactions/', d),
  delete:       (id)  => api.delete(`/transactions/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ── ATTACHMENT API ───────────────────────────────────────────────
export const attachmentAPI = {
  // Get all attachments for a product
  getByProduct: (productId) =>
    api.get(`/attachments/product/${productId}`),

  // Get all attachments for a transaction
  getByTransaction: (transactionId) =>
    api.get(`/attachments/transaction/${transactionId}`),

  // Delete an attachment
  delete: (id) => api.delete(`/attachments/${id}`),

  // Download URL — used as href in anchor tag
  downloadUrl: (id) => `${API_BASE_URL}/api/attachments/download/${id}`,

  // View URL — for images shown inline in browser
  viewUrl: (id) => `${API_BASE_URL}/api/attachments/view/${id}`,

  // Upload file — uses multipart/form-data NOT json
  // productId and transactionId are optional
  upload: (file, productId = null, transactionId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId)     formData.append('product_id',     String(productId));
    if (transactionId) formData.append('transaction_id', String(transactionId));

    // Get token manually for this request
    // because we override Content-Type header
    let token = null;
    try {
      const stored = localStorage.getItem('ims_user');
      if (stored) token = JSON.parse(stored).access_token;
    } catch { }

    return axios.post(`${API_BASE_URL}/api/attachments/upload`, formData, {
      headers: {
        'Content-Type':  'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};

export default api;
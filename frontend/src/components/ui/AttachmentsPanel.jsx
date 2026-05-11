// src/components/ui/AttachmentsPanel.jsx

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  FiPaperclip, FiUpload, FiDownload,
  FiTrash2, FiFile, FiImage, FiFileText,
  FiX
} from 'react-icons/fi';
import { attachmentAPI } from '../../api';

const FileIcon = ({ fileType }) => {
  if (fileType === 'image') return <FiImage className="text-blue-500" size={15} />;
  if (fileType === 'pdf')   return <FiFileText className="text-red-500" size={15} />;
  return <FiFile className="text-gray-400" size={15} />;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImagePreview = ({ url, name, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
    onClick={onClose}
  >
    <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
      >
        <FiX size={24} />
      </button>
      <img
        src={url}
        alt={name}
        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
      />
      <p className="text-white text-center text-sm mt-2 opacity-75">{name}</p>
    </div>
  </div>
);

const AttachmentsPanel = ({ productId, transactionId }) => {
  const [attachments,  setAttachments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAttachments();
  }, [productId, transactionId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      let res;
      if (productId)     res = await attachmentAPI.getByProduct(productId);
      if (transactionId) res = await attachmentAPI.getByTransaction(transactionId);
      if (res) setAttachments(res.data);
    } catch {
      console.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      await attachmentAPI.upload(file, productId, transactionId);
      toast.success(file.name + ' uploaded');
      fetchAttachments();
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.detail
        ? err.response.data.detail
        : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment) => {
    if (!window.confirm('Delete ' + attachment.original_name + '?')) return;
    try {
      await attachmentAPI.delete(attachment.id);
      toast.success('File deleted');
      fetchAttachments();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleImageClick = (attachment) => {
    setPreviewImage({
      url:  attachmentAPI.viewUrl(attachment.id),
      name: attachment.original_name,
    });
  };

  return (
    <div className="space-y-3">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiPaperclip className="text-gray-400" size={15} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Attachments
            {attachments.length > 0 && (
              <span className="ml-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {attachments.length}
              </span>
            )}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <FiUpload size={12} />
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
        />
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-2">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">
          No files attached yet. Upload invoices, receipts, or any relevant documents.
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map(function(att) {
            return (
              <div
                key={att.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileIcon fileType={att.file_type} />
                  <div className="min-w-0">
                    {att.file_type === 'image' ? (
                      <button
                        onClick={() => handleImageClick(att)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs text-left"
                      >
                        {att.original_name}
                      </button>
                    ) : (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">
                        {att.original_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatSize(att.file_size)}
                      {att.file_size ? ' · ' : ''}
                      {new Date(att.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {att.file_type === 'image' && (
                    <button
                      onClick={() => handleImageClick(att)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <FiImage size={13} />
                    </button>
                  )}

                  <a
                    href={attachmentAPI.downloadUrl(att.id)}
                    download={att.original_name}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <FiDownload size={13} />
                  </a>

                  <button
                    onClick={() => handleDelete(att)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attachments.filter(function(a) { return a.file_type === 'image'; }).length > 0 && (
        <div className="flex gap-2 flex-wrap pt-1">
          {attachments
            .filter(function(a) { return a.file_type === 'image'; })
            .map(function(att) {
              return (
                <button
                  key={att.id}
                  onClick={() => handleImageClick(att)}
                  className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors"
                >
                  <img
                    src={attachmentAPI.viewUrl(att.id)}
                    alt={att.original_name}
                    className="w-full h-full object-cover"
                    onError={function(e) { e.target.style.display = 'none'; }}
                  />
                </button>
              );
            })
          }
        </div>
      )}

      {previewImage && (
        <ImagePreview
          url={previewImage.url}
          name={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}

    </div>
  );
};

export default AttachmentsPanel;

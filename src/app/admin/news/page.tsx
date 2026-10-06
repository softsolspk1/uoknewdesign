'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  pdfUrl: string | null;
  link: string | null;
  isPublished: boolean;
  order: number;
  date: string;
}

const emptyForm = {
  id: '',
  title: '',
  excerpt: '',
  imageUrl: '',
  pdfUrl: '',
  link: '',
  isPublished: true,
  order: 0,
};

export default function NewsManagerPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<HTMLImageElement>(null);
  const [autoFitImage, setAutoFitImage] = useState(true);

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/admin/news')
      .then((r) => r.json())
      .then((d) => setItems(d.news || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated') fetchItems();
  }, [status]);

  const openCreate = () => {
    setForm(emptyForm);
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setForm({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt || '',
      imageUrl: item.imageUrl || '',
      pdfUrl: item.pdfUrl || '',
      link: item.link || '',
      isPublished: item.isPublished,
      order: item.order,
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Replacing an existing photo: auto-fit the new file to the current
    // image's size so it matches the news card's layout.
    const preview = photoPreviewRef.current;
    if (form.imageUrl && autoFitImage && preview?.naturalWidth && preview?.naturalHeight) {
      formData.append('targetWidth', String(preview.naturalWidth));
      formData.append('targetHeight', String(preview.naturalHeight));
    }
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch {
      alert('Network error during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, pdfUrl: data.url }));
      } else {
        alert(data.error || 'PDF upload failed.');
      }
    } catch {
      alert('Network error during PDF upload.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const method = form.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/admin/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Saved — the homepage News section has been updated.' });
        fetchItems();
        setTimeout(() => {
          setIsModalOpen(false);
          setMessage(null);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This removes it from the homepage too.`)) return;
    const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchItems();
    else alert('Failed to delete.');
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>News &amp; Announcements</h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Manage the cards shown in the homepage &quot;News &amp; Announcements&quot; section.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-success"
          style={{ backgroundColor: '#006633', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
        >
          <i className="fa-solid fa-plus me-2"></i>Add News Item
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.order}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>
                          {item.title}
                          {item.pdfUrl && <i className="fa-solid fa-file-pdf ms-2 text-danger" title="Has attached PDF"></i>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.excerpt}</div>
                      </td>
                      <td>
                        <span className={`badge ${item.isPublished ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {item.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ color: '#6c757d' }}>{new Date(item.date).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button onClick={() => openEdit(item)} className="btn btn-sm btn-success me-2" style={{ backgroundColor: '#006633' }}>
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.title)} className="btn btn-sm btn-outline-danger">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No news items yet. Add one to show it on the homepage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a3a2a' }}>
                {form.id ? 'Edit News Item' : 'Add News Item'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {message && (
                  <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>{message.text}</div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Short Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Photo</label>
                  <div className="d-flex align-items-center gap-3">
                    {form.imageUrl && (
                      <img
                        ref={photoPreviewRef}
                        src={form.imageUrl}
                        alt="preview"
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading...' : form.imageUrl ? 'Replace Photo' : 'Upload Photo'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  {form.imageUrl && (
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={autoFitImage}
                        onChange={(e) => setAutoFitImage(e.target.checked)}
                        id="newsAutoFit"
                      />
                      <label className="form-check-label" htmlFor="newsAutoFit" style={{ fontSize: '12.5px' }}>
                        Auto-fit replacement image to current size &amp; alignment
                      </label>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
                    <i className="fa-solid fa-file-pdf me-1 text-danger"></i> Attach PDF Document (Circular / Notice / Announcement)
                  </label>
                  <div className="p-3 border rounded bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                    {form.pdfUrl ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger"><i className="fa-solid fa-file-pdf me-1"></i> PDF Attached</span>
                        <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none" style={{ fontSize: '13px' }}>
                          View Document <i className="fa-solid fa-arrow-up-right-from-square ms-1" style={{ fontSize: '11px' }}></i>
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '12.5px' }}>Optional: attach an official PDF circular or announcement</span>
                    )}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        disabled={uploadingPdf}
                        onClick={() => pdfInputRef.current?.click()}
                      >
                        {uploadingPdf ? 'Uploading PDF...' : form.pdfUrl ? 'Replace PDF' : 'Upload PDF'}
                      </button>
                      {form.pdfUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setForm((f) => ({ ...f, pdfUrl: '' }))}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePdfUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
                      &quot;Read More&quot; Link
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. about, institute-kibge, or https://..."
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    id="newsPublished"
                  />
                  <label className="form-check-label" htmlFor="newsPublished" style={{ fontSize: '13px' }}>
                    Show on homepage
                  </label>
                </div>
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-light border btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-success btn-sm px-4" style={{ backgroundColor: '#006633' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

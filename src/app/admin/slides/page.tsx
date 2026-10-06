'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

interface SlideItem {
  id: string;
  heading: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  isPublished: boolean;
  order: number;
}

const emptyForm = {
  id: '',
  heading: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  isPublished: true,
  order: 0,
};

export default function SlidesManagerPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterPreviewRef = useRef<HTMLImageElement>(null);
  const [autoFitImage, setAutoFitImage] = useState(true);

  const [items, setItems] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/admin/slides')
      .then((r) => r.json())
      .then((d) => setItems(d.slides || []))
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

  const openEdit = (item: SlideItem) => {
    setForm({
      id: item.id,
      heading: item.heading,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
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
    // Replacing an existing poster image: auto-fit the new file to the
    // current image's size so it matches the slide's layout.
    const preview = posterPreviewRef.current;
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

  const handleVideoUploadViaServer = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, videoUrl: data.url }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch {
      alert('Network error during upload.');
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      // Uploaded directly from the browser to Blob storage, bypassing our
      // serverless function's request body size limit entirely.
      const blob = await upload(`uploads/${safeName}`, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/upload/video',
      });
      setForm((f) => ({ ...f, videoUrl: `/api/media/${blob.pathname}` }));
    } catch {
      // Blob storage isn't configured (e.g. local dev) — fall back to the
      // legacy server-proxied upload, which writes into public/uploads.
      await handleVideoUploadViaServer(file);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const method = form.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/admin/slides', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Saved — the homepage slider has been updated.' });
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

  const handleDelete = async (id: string, heading: string) => {
    if (!confirm(`Delete "${heading}"? This removes it from the homepage slider too.`)) return;
    const res = await fetch(`/api/admin/slides?id=${id}`, { method: 'DELETE' });
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
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Homepage Video Slider</h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Manage the slides shown in the homepage hero banner. Each slide needs a heading, a short description and a
            background video — uploaded videos are automatically cropped to fill the slider. A poster image is optional and
            is shown while the video loads.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-success"
          style={{ backgroundColor: '#006633', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
        >
          <i className="fa-solid fa-plus me-2"></i>Add Slide
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
                  <th style={{ width: '90px' }}>Media</th>
                  <th>Heading</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.order}</td>
                      <td>
                        {item.videoUrl ? (
                          <video
                            src={item.videoUrl}
                            poster={item.imageUrl || undefined}
                            muted
                            style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        ) : item.imageUrl ? (
                          <img src={item.imageUrl} alt="" style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>{item.heading}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.description}</div>
                      </td>
                      <td>
                        <span className={`badge ${item.isPublished ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {item.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button onClick={() => openEdit(item)} className="btn btn-sm btn-success me-2" style={{ backgroundColor: '#006633' }}>
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.heading)} className="btn btn-sm btn-outline-danger">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No slides yet. Add one to show it in the homepage banner.
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
                {form.id ? 'Edit Slide' : 'Add Slide'}
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
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Heading *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.heading}
                    onChange={(e) => setForm({ ...form, heading: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Short Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Slide Video *</label>
                  <div className="d-flex align-items-center gap-3">
                    {form.videoUrl && (
                      <video
                        src={form.videoUrl}
                        poster={form.imageUrl || undefined}
                        muted
                        controls
                        style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={uploadingVideo}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      {uploadingVideo ? 'Uploading...' : form.videoUrl ? 'Replace Video' : 'Upload Video'}
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div className="form-text">Recommended landscape video, under 60MB (e.g. MP4/H.264). Auto-plays muted and loops in the slider.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Poster Image (optional)</label>
                  <div className="d-flex align-items-center gap-3">
                    {form.imageUrl && (
                      <img
                        ref={posterPreviewRef}
                        src={form.imageUrl}
                        alt="preview"
                        style={{ width: '96px', height: '54px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Uploading...' : form.imageUrl ? 'Replace Image' : 'Upload Image'}
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
                        id="slideAutoFit"
                      />
                      <label className="form-check-label" htmlFor="slideAutoFit" style={{ fontSize: '12.5px' }}>
                        Auto-fit replacement image to current size &amp; alignment
                      </label>
                    </div>
                  )}
                  <div className="form-text">Shown while the video loads, and used as a fallback if no video is set.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    id="slidePublished"
                  />
                  <label className="form-check-label" htmlFor="slidePublished" style={{ fontSize: '13px' }}>
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

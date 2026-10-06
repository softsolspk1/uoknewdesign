'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PageItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  isPublished: boolean;
  updatedAt: string;
  updatedBy?: string;
}

function PagesManagerContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userRole, setUserRole] = useState('admin');
  const [assignedDepts, setAssignedDepts] = useState<string[]>([]);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active editing page
  const [editForm, setEditForm] = useState({
    id: '',
    slug: '',
    title: '',
    category: 'main',
    content: '',
    metaTitle: '',
    metaDescription: '',
    pdfUrl: '',
    pdfLabel: '',
    isPublished: true,
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);

  // Create page form
  const [createForm, setCreateForm] = useState({
    slug: '',
    title: '',
    category: 'main',
    metaTitle: '',
    metaDescription: '',
    isPublished: true,
  });

  const fetchPages = () => {
    setLoading(true);
    fetch('/api/admin/pages')
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) {
          setPages(data.pages);
          setUserRole(data.userRole || 'admin');
          setAssignedDepts(data.assignedDepartments || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      fetchPages();
    }
  }, [status, router]);

  // Check if query param ?edit=slug is passed
  useEffect(() => {
    const editSlug = searchParams.get('edit');
    if (editSlug && pages.length > 0) {
      handleOpenEdit(editSlug);
    }
  }, [searchParams, pages]);

  const handleOpenEdit = async (slug: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages?slug=${slug}`);
      const data = await res.json();
      if (res.ok && data.page) {
        setEditForm({
          id: data.page.id,
          slug: data.page.slug,
          title: data.page.title,
          category: data.page.category,
          content: data.page.content || '',
          metaTitle: data.page.metaTitle || '',
          metaDescription: data.page.metaDescription || '',
          pdfUrl: data.page.pdfUrl || '',
          pdfLabel: data.page.pdfLabel || '',
          isPublished: data.page.isPublished,
        });
        setIsEditOpen(true);
      } else {
        alert(data.error || 'Failed to load page content.');
      }
    } catch (err: any) {
      alert('Error fetching page content.');
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
        setEditForm((f) => ({ ...f, pdfUrl: data.url, pdfLabel: f.pdfLabel || file.name.replace(/\.pdf$/i, '') }));
      } else {
        alert(data.error || 'PDF upload failed.');
      }
    } catch {
      alert('Network error during PDF upload.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Page updated and saved successfully!' });
        fetchPages();
        setTimeout(() => {
          setIsEditOpen(false);
          setMessage(null);
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update page.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error. Could not save page.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'New page created successfully!' });
        fetchPages();
        setTimeout(() => {
          setIsCreateOpen(false);
          setMessage(null);
          setCreateForm({
            slug: '',
            title: '',
            category: 'main',
            metaTitle: '',
            metaDescription: '',
            isPublished: true,
          });
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create page.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error. Could not create page.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPages();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete page.');
      }
    } catch (err) {
      alert('Error deleting page.');
    }
  };

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      {/* Header */}
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
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>
            Page Creator & Editor
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            {userRole === 'admin'
              ? `Manage all ${pages.length} website pages, departments, and institutes.`
              : `Sub-Admin Department Management: You have authorized access to your assigned department pages.`}
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => {
              setMessage(null);
              setIsCreateOpen(true);
            }}
            className="btn btn-success"
            style={{
              backgroundColor: '#006633',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Create New Page</span>
          </button>
        )}
      </div>

      {/* Sub-Admin Banner if applicable */}
      {userRole === 'subadmin' && (
        <div
          style={{
            backgroundColor: '#e8f4fd',
            color: '#0d6efd',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #b6d4fe',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '20px' }}></i>
          <div>
            <strong>Sub-Admin Scoped Access:</strong> You are authorized to manage content for:{' '}
            <code>{assignedDepts.join(', ') || 'No departments assigned yet'}</code>.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'department', 'institute', 'main', 'portal'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`btn btn-sm ${categoryFilter === cat ? 'btn-success' : 'btn-light border'}`}
              style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '13px' }}
            >
              {cat === 'all' ? `All (${pages.length})` : cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search pages by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '10px', top: '10px', color: '#adb5bd', fontSize: '13px' }}
          ></i>
        </div>
      </div>

      {/* Pages Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-2 text-muted">Loading pages directory...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40%' }}>Title & Path</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.length > 0 ? (
                  filteredPages.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>{p.title}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          <code>{p.slug === 'home' ? '/' : `/${p.slug}`}</code>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.category === 'department'
                              ? 'bg-primary'
                              : p.category === 'institute'
                              ? 'bg-info text-dark'
                              : 'bg-secondary'
                          } text-capitalize`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.isPublished ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {p.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ color: '#6c757d' }}>
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <Link
                          href={p.slug === 'home' ? '/' : `/${p.slug}`}
                          target="_blank"
                          className="btn btn-sm btn-light border me-2"
                          title="View Live Page"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square text-muted"></i>
                        </Link>
                        <Link
                          href={`/admin/editor/${p.slug}`}
                          className="btn btn-sm btn-primary me-2"
                          style={{ backgroundColor: '#006633', borderColor: '#006633' }}
                          title="Visual Editor — edit text, photos and sections directly on the page"
                        >
                          <i className="fa-solid fa-pen-ruler"></i> Visual Editor
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(p.slug)}
                          className="btn btn-sm btn-light border me-2"
                          title="Page settings — title, slug, category, SEO & publish status"
                        >
                          <i className="fa-solid fa-gear"></i> Settings
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleDeletePage(p.id, p.title)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Page"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      No pages matched your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PAGE MODAL */}
      {isEditOpen && (
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
              maxWidth: '900px',
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
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a3a2a' }}>
                <i className="fa-solid fa-gear text-success me-2"></i> Page Settings: {editForm.title}
              </h4>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {message && (
                  <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                    {message.text}
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Page Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Slug (URL)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.slug}
                      disabled={userRole !== 'admin'}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Meta Description (SEO)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.metaDescription}
                      onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Category</label>
                    <select
                      className="form-select"
                      value={editForm.category}
                      disabled={userRole !== 'admin'}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                      <option value="main">Main Page</option>
                      <option value="department">Department</option>
                      <option value="institute">Institute</option>
                      <option value="portal">Portal</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Publish Status</label>
                    <select
                      className="form-select"
                      value={editForm.isPublished ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.value === 'true' })}
                    >
                      <option value="true">Published (Live)</option>
                      <option value="false">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Attached PDF (optional)</label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {editForm.pdfUrl && (
                      <a
                        href={editForm.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-danger"
                      >
                        <i className="fa-solid fa-file-pdf me-1"></i> View current PDF
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={uploadingPdf}
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      {uploadingPdf ? 'Uploading...' : editForm.pdfUrl ? 'Replace PDF' : 'Upload PDF'}
                    </button>
                    {editForm.pdfUrl && (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => setEditForm({ ...editForm, pdfUrl: '', pdfLabel: '' })}
                      >
                        Remove
                      </button>
                    )}
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
                  {editForm.pdfUrl && (
                    <input
                      type="text"
                      className="form-control form-control-sm mt-2"
                      placeholder="Button label, e.g. Download Prospectus"
                      value={editForm.pdfLabel}
                      onChange={(e) => setEditForm({ ...editForm, pdfLabel: e.target.value })}
                    />
                  )}
                  <div className="form-text">
                    When set, a floating "Download PDF" button appears on this page for visitors. Max 15MB.
                  </div>
                </div>

                <div
                  className="alert alert-light border d-flex align-items-center gap-2"
                  style={{ fontSize: '13px' }}
                >
                  <i className="fa-solid fa-circle-info text-muted"></i>
                  <span>
                    To edit the page's text, photos and sections, use the <strong>Visual Editor</strong> from
                    the Pages list — this panel covers title, URL, SEO, PDF attachment and publish status.
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e9ecef',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Link
                  href={`/admin/editor/${editForm.slug}`}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className="fa-solid fa-pen-ruler me-1"></i> Open Visual Editor
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="btn btn-light border btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-success btn-sm px-4"
                    style={{ backgroundColor: '#006633' }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW PAGE MODAL (ADMIN ONLY) */}
      {isCreateOpen && (
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
              maxWidth: '850px',
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
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a3a2a' }}>
                <i className="fa-solid fa-circle-plus text-success me-2"></i> Create New Page
              </h4>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePage} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {message && (
                  <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                    {message.text}
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Page Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Department of Artificial Intelligence"
                      value={createForm.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        setCreateForm({
                          ...createForm,
                          title,
                          slug: createForm.slug || autoSlug,
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Slug (URL) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. department-ai"
                      value={createForm.slug}
                      onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Meta Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="SEO meta description..."
                      value={createForm.metaDescription}
                      onChange={(e) => setCreateForm({ ...createForm, metaDescription: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Category</label>
                    <select
                      className="form-select"
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    >
                      <option value="main">Main Page</option>
                      <option value="department">Department</option>
                      <option value="institute">Institute</option>
                      <option value="portal">Portal</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Publish Status</label>
                    <select
                      className="form-select"
                      value={createForm.isPublished ? 'true' : 'false'}
                      onChange={(e) => setCreateForm({ ...createForm, isPublished: e.target.value === 'true' })}
                    >
                      <option value="true">Published</option>
                      <option value="false">Draft</option>
                    </select>
                  </div>
                </div>

                <div
                  className="alert alert-light border d-flex align-items-center gap-2"
                  style={{ fontSize: '13px' }}
                >
                  <i className="fa-solid fa-circle-info text-muted"></i>
                  <span>
                    The page is created with placeholder content — open it in the <strong>Visual Editor</strong>{' '}
                    afterward to add real text, photos and sections.
                  </span>
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
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-light border btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-success btn-sm px-4"
                  style={{ backgroundColor: '#006633' }}
                >
                  {saving ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagesManagerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">Loading Pages Directory...</p>
        </div>
      }
    >
      <PagesManagerContent />
    </React.Suspense>
  );
}


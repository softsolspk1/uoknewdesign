'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  location: string;
  label: string;
  url: string;
  parentId: string | null;
  order: number;
  target: string | null;
  isPublished: boolean;
}

const emptyForm = { id: '', location: 'header', label: '', url: '', parentId: '' as string | '', target: '', isPublished: true };

export default function MenusAdminPage() {
  const { status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'header' | 'footer'>('header');
  const [form, setForm] = useState(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/admin/menus')
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated') fetchItems();
  }, [status]);

  const tabItems = items.filter((i) => i.location === tab);
  const topLevel = tabItems.filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
  const childrenOf = (id: string) => tabItems.filter((i) => i.parentId === id).sort((a, b) => a.order - b.order);

  const openCreate = (parentId?: string) => {
    setForm({ ...emptyForm, location: tab, parentId: parentId || '' });
    setMessage(null);
    setIsOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      location: item.location,
      label: item.label,
      url: item.url,
      parentId: item.parentId || '',
      target: item.target || '',
      isPublished: item.isPublished,
    });
    setMessage(null);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/menus', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchItems();
        setIsOpen(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    const hasChildren = childrenOf(item.id).length > 0;
    const confirmMsg = hasChildren
      ? `Delete "${item.label}" and its ${childrenOf(item.id).length} sub-item(s)?`
      : `Delete "${item.label}"?`;
    if (!confirm(confirmMsg)) return;
    const res = await fetch(`/api/admin/menus?id=${item.id}`, { method: 'DELETE' });
    if (res.ok) fetchItems();
    else alert('Failed to delete.');
  };

  const move = async (item: MenuItem, direction: -1 | 1) => {
    const siblings = (item.parentId ? childrenOf(item.parentId) : topLevel);
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapWith = siblings[idx + direction];
    if (!swapWith) return;
    await fetch('/api/admin/menus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reorder: [
          { id: item.id, order: swapWith.order },
          { id: swapWith.id, order: item.order },
        ],
      }),
    });
    fetchItems();
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
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Menus Manager</h1>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          Manage the top navigation and footer links shown on every page of the site.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn btn-sm ${tab === 'header' ? 'btn-success' : 'btn-light border'}`}
          onClick={() => setTab('header')}
        >
          Header Menu
        </button>
        <button
          className={`btn btn-sm ${tab === 'footer' ? 'btn-success' : 'btn-light border'}`}
          onClick={() => setTab('footer')}
        >
          Footer Menu
        </button>
        <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={() => openCreate()}>
          <i className="fa-solid fa-plus me-1"></i>
          {tab === 'header' ? 'Add Top-Level Item' : 'Add Footer Column'}
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-4 text-muted">No {tab} items yet.</div>
        ) : (
          topLevel.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e9ecef', borderRadius: '8px', marginBottom: '10px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ color: '#1a3a2a' }}>{item.label}</strong>{' '}
                  <code style={{ fontSize: '12px', color: '#6c757d' }}>{item.url}</code>
                  {!item.isPublished && <span className="badge bg-warning text-dark ms-2">Hidden</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-xs btn-light border" onClick={() => move(item, -1)} title="Move up">
                    <i className="fa-solid fa-arrow-up"></i>
                  </button>
                  <button className="btn btn-xs btn-light border" onClick={() => move(item, 1)} title="Move down">
                    <i className="fa-solid fa-arrow-down"></i>
                  </button>
                  <button className="btn btn-xs btn-outline-secondary" onClick={() => openCreate(item.id)}>
                    <i className="fa-solid fa-plus me-1"></i>
                    {tab === 'header' ? 'Add Sub-Item' : 'Add Link'}
                  </button>
                  <button className="btn btn-xs btn-outline-primary" onClick={() => openEdit(item)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="btn btn-xs btn-outline-danger" onClick={() => handleDelete(item)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {childrenOf(item.id).length > 0 && (
                <ul style={{ marginTop: '10px', marginBottom: 0, paddingLeft: '20px' }}>
                  {childrenOf(item.id).map((child) => (
                    <li key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '13px' }}>
                      <span>
                        {child.label} <code style={{ fontSize: '11px', color: '#6c757d' }}>{child.url}</code>
                        {!child.isPublished && <span className="badge bg-warning text-dark ms-2">Hidden</span>}
                      </span>
                      <span style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-xs btn-light border" onClick={() => move(child, -1)}>
                          <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button className="btn btn-xs btn-light border" onClick={() => move(child, 1)}>
                          <i className="fa-solid fa-arrow-down"></i>
                        </button>
                        <button className="btn btn-xs btn-outline-primary" onClick={() => openEdit(child)}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button className="btn btn-xs btn-outline-danger" onClick={() => handleDelete(child)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      {isOpen && (
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
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1a3a2a' }}>
                {form.id ? 'Edit Menu Item' : 'New Menu Item'}
              </h4>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px 24px' }}>
                {message && <div className="alert alert-danger">{message.text}</div>}
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Label</label>
                  <input
                    className="form-control"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
                    URL {!form.parentId && tab === 'footer' ? '(use # for a column with no direct link)' : ''}
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. /about or https://example.com"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="targetBlank"
                    checked={form.target === '_blank'}
                    onChange={(e) => setForm({ ...form, target: e.target.checked ? '_blank' : '' })}
                  />
                  <label className="form-check-label" htmlFor="targetBlank" style={{ fontSize: '13px' }}>
                    Open in a new tab
                  </label>
                </div>
                <div className="mb-1 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isPublished"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="isPublished" style={{ fontSize: '13px' }}>
                    Visible on the live site
                  </label>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-light border btn-sm" onClick={() => setIsOpen(false)}>
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

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
  order: number;
}

const emptyForm = { id: '', question: '', answer: '', isPublished: true, order: 0 };

export default function FaqManagerPage() {
  const { status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  const fetchItems = () => {
    setLoading(true);
    fetch('/api/admin/faqs')
      .then((r) => r.json())
      .then((d) => setItems(d.faqs || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated') fetchItems();
  }, [status]);

  const openCreate = () => {
    setForm({ ...emptyForm, order: items.length });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setForm({ id: item.id, question: item.question, answer: item.answer, isPublished: item.isPublished, order: item.order });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const method = form.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/admin/faqs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Saved — the homepage FAQ section has been updated.' });
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

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Delete "${question}"? This removes it from the homepage too.`)) return;
    const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
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
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Frequently Asked Questions</h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Manage the questions shown in the homepage FAQ accordion, in display order.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn btn-success"
          style={{ backgroundColor: '#006633', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
        >
          <i className="fa-solid fa-plus me-2"></i>Add FAQ
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
                  <th>Question</th>
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
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>{item.question}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.answer.slice(0, 100)}{item.answer.length > 100 ? '…' : ''}</div>
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
                        <button onClick={() => handleDelete(item.id, item.question)} className="btn btn-sm btn-outline-danger">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted">
                      No FAQs yet. Add one to show it on the homepage.
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
              maxWidth: '600px',
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
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a3a2a' }}>{form.id ? 'Edit FAQ' : 'Add FAQ'}</h4>
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
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Question *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Answer *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className="col-md-8 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                        id="faqPublished"
                      />
                      <label className="form-check-label" htmlFor="faqPublished" style={{ fontSize: '13px' }}>
                        Show on homepage
                      </label>
                    </div>
                  </div>
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

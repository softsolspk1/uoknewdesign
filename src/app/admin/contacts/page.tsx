'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function ContactsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Submission | null>(null);

  const fetchContacts = () => {
    setLoading(true);
    let url = `/api/contact?status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          setSubmissions(data.submissions);
          setUnreadCount(data.unreadCount || 0);
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
      fetchContacts();
    }
  }, [status, router, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact submission?')) return;
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts();
  };

  return (
    <div>
      {/* Top Banner */}
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
            Contact Us Inquiries
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Inquiries received from the public Contact Us form across Admissions, Academics, and Administration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge bg-warning text-dark px-3 py-2 fs-6">
            <i className="fa-solid fa-bell me-1"></i> {unreadCount} Unread
          </span>
          <span className="badge bg-secondary px-3 py-2 fs-6">
            Total: {submissions.length}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'unread', 'read', 'replied'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-success' : 'btn-light border'}`}
              style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '13px' }}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '300px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search inquiries by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '32px' }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', left: '10px', top: '10px', color: '#adb5bd', fontSize: '13px' }}
          ></i>
        </form>
      </div>

      {/* Inquiries Table */}
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
            <p className="mt-2 text-muted">Loading inquiries...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      style={{
                        backgroundColor: sub.status === 'unread' ? '#fffdf5' : 'inherit',
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: sub.status === 'unread' ? 700 : 500, color: '#1a3a2a' }}>
                          {sub.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          <a href={`mailto:${sub.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {sub.email}
                          </a>
                          {sub.phone && <span> • {sub.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{sub.subject}</span>
                      </td>
                      <td style={{ maxWidth: '320px', color: '#495057' }}>
                        {sub.message.length > 80 ? sub.message.substring(0, 80) + '...' : sub.message}
                      </td>
                      <td style={{ color: '#6c757d' }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sub.status === 'unread'
                              ? 'bg-warning text-dark'
                              : sub.status === 'replied'
                              ? 'bg-success'
                              : 'bg-primary'
                          } text-capitalize`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => {
                            setSelectedInquiry(sub);
                            if (sub.status === 'unread') {
                              handleUpdateStatus(sub.id, 'read');
                            }
                          }}
                          className="btn btn-sm btn-outline-success me-2"
                          title="Read Full Inquiry"
                        >
                          <i className="fa-solid fa-eye"></i> View
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No contact submissions found in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedInquiry && (
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
              maxWidth: '650px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
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
                <i className="fa-solid fa-envelope-open-text text-success me-2"></i> Inquiry Details
              </h4>
              <button
                onClick={() => setSelectedInquiry(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <small className="text-muted d-block">From</small>
                  <strong>{selectedInquiry.name}</strong>
                </div>
                <div>
                  <small className="text-muted d-block">Date Received</small>
                  <span>{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <small className="text-muted d-block">Email</small>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-success fw-bold">
                    {selectedInquiry.email}
                  </a>
                </div>
                <div>
                  <small className="text-muted d-block">Phone</small>
                  <span>{selectedInquiry.phone || 'Not provided'}</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <small className="text-muted d-block">Subject</small>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2c3e50' }}>{selectedInquiry.subject}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <small className="text-muted d-block mb-1">Message</small>
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#212529',
                  }}
                >
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Update Status:</span>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'unread')}
                  className={`btn btn-sm ${selectedInquiry.status === 'unread' ? 'btn-warning' : 'btn-outline-warning'}`}
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'read')}
                  className={`btn btn-sm ${selectedInquiry.status === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, 'replied')}
                  className={`btn btn-sm ${selectedInquiry.status === 'replied' ? 'btn-success' : 'btn-outline-success'}`}
                >
                  Mark Replied
                </button>
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                  className="btn btn-sm btn-dark ms-auto"
                >
                  <i className="fa-solid fa-reply me-1"></i> Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

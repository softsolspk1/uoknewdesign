'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SubmissionImage {
  id: string;
  url: string;
}

interface Submission {
  id: string;
  type: string;
  name: string;
  status: string;
  departmentName: string | null;
  headName: string | null;
  designation: string | null;
  qualification: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  programsOffered: string | null;
  facilities: string | null;
  focusAreas: string | null;
  bio: string | null;
  publications: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  images: SubmissionImage[];
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  department: 'Department',
  faculty: 'Faculty Member',
  institute: 'Research Institute',
};

const TYPE_BADGE: Record<string, string> = {
  department: 'bg-primary',
  faculty: 'bg-success',
  institute: 'bg-warning text-dark',
};

export default function InfoSubmissionsAdminPage() {
  const { status } = useSession();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<Submission | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(`/api/admin/info-submissions?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setSubmissions(d.submissions || []);
        setSelected({});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await fetch('/api/admin/info-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      if (detail?.id === id) setDetail({ ...detail, status: newStatus });
      fetchItems();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the entry for "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/info-submissions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (detail?.id === id) setDetail(null);
      fetchItems();
    } else {
      alert('Failed to delete.');
    }
  };

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const handleExport = async (format: 'pdf' | 'docx', ids: string[]) => {
    if (ids.length === 0) {
      alert('Select at least one entry to export.');
      return;
    }
    setExporting(true);
    try {
      const res = await fetch('/api/admin/info-submissions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Export failed.');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `export.${format}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Network error during export.');
    } finally {
      setExporting(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) submissions.forEach((s) => (next[s.id] = true));
    setSelected(next);
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>
          Department / Faculty / Institute Info Submissions
        </h1>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          Information submitted via the public content-update form. Review entries, then export a single record or a
          selection to PDF or Word for website content updates.
        </p>
        <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#006633' }}>
          Public submission form: <code>/info-submission</code>
        </div>
      </div>

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
          {['all', 'department', 'faculty', 'institute'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`btn btn-sm ${typeFilter === t ? 'btn-success' : 'btn-light border'}`}
              style={{ fontWeight: 600, fontSize: '13px' }}
            >
              {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
            </button>
          ))}
          <span style={{ width: '1px', backgroundColor: '#dee2e6', margin: '0 4px' }}></span>
          {['all', 'new', 'reviewed', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-dark' : 'btn-light border'}`}
              style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '13px' }}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search by name, email, department..."
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

      {selectedIds.length > 0 && (
        <div
          style={{
            backgroundColor: '#eaf6ee',
            border: '1px solid #b7e0c4',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: '13px', color: '#0a3622' }}>{selectedIds.length} selected</strong>
          <button
            className="btn btn-sm btn-success"
            disabled={exporting}
            onClick={() => handleExport('pdf', selectedIds)}
            style={{ backgroundColor: '#006633' }}
          >
            <i className="fa-solid fa-file-pdf me-1"></i> Export PDF
          </button>
          <button className="btn btn-sm btn-primary" disabled={exporting} onClick={() => handleExport('docx', selectedIds)}>
            <i className="fa-solid fa-file-word me-1"></i> Export Word
          </button>
          <button className="btn btn-sm btn-light border" onClick={() => setSelected({})}>
            Clear Selection
          </button>
        </div>
      )}

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
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={submissions.length > 0 && selectedIds.length === submissions.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Submitted By</th>
                  <th>Images</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selected[sub.id]}
                          onChange={(e) => setSelected((s) => ({ ...s, [sub.id]: e.target.checked }))}
                        />
                      </td>
                      <td>
                        <span className={`badge ${TYPE_BADGE[sub.type] || 'bg-secondary'}`}>{TYPE_LABELS[sub.type] || sub.type}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>{sub.name}</div>
                        {sub.departmentName && <div style={{ fontSize: '11.5px', color: '#6c757d' }}>{sub.departmentName}</div>}
                      </td>
                      <td style={{ color: '#495057' }}>
                        {sub.submittedByName || sub.submittedByEmail ? (
                          <>
                            <div>{sub.submittedByName || '—'}</div>
                            <div style={{ fontSize: '11.5px', color: '#6c757d' }}>{sub.submittedByEmail}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{sub.images.length > 0 ? <span className="badge bg-light text-dark border">{sub.images.length}</span> : '—'}</td>
                      <td style={{ color: '#6c757d' }}>{new Date(sub.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`badge text-capitalize ${
                            sub.status === 'new' ? 'bg-warning text-dark' : sub.status === 'reviewed' ? 'bg-primary' : 'bg-secondary'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button onClick={() => setDetail(sub)} className="btn btn-sm btn-outline-success me-2" title="View Details">
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          onClick={() => handleExport('pdf', [sub.id])}
                          disabled={exporting}
                          className="btn btn-sm btn-outline-dark me-2"
                          title="Export this entry to PDF"
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                        </button>
                        <button onClick={() => handleDelete(sub.id, sub.name)} className="btn btn-sm btn-outline-danger" title="Delete">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      No submissions found in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
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
              maxWidth: '700px',
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
                <span className={`badge ${TYPE_BADGE[detail.type] || 'bg-secondary'} me-2`}>{TYPE_LABELS[detail.type] || detail.type}</span>
                {detail.name}
              </h4>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13.5px' }}>
                {detail.departmentName && (
                  <div>
                    <small className="text-muted d-block">Department</small>
                    <span>{detail.departmentName}</span>
                  </div>
                )}
                {detail.headName && (
                  <div>
                    <small className="text-muted d-block">{detail.type === 'institute' ? 'Director' : 'Head of Department'}</small>
                    <span>{detail.headName}</span>
                  </div>
                )}
                {detail.designation && (
                  <div>
                    <small className="text-muted d-block">Designation</small>
                    <span>{detail.designation}</span>
                  </div>
                )}
                {detail.qualification && (
                  <div>
                    <small className="text-muted d-block">Qualification</small>
                    <span>{detail.qualification}</span>
                  </div>
                )}
                {detail.email && (
                  <div>
                    <small className="text-muted d-block">Email</small>
                    <a href={`mailto:${detail.email}`} className="text-success fw-bold">
                      {detail.email}
                    </a>
                  </div>
                )}
                {detail.phone && (
                  <div>
                    <small className="text-muted d-block">Phone</small>
                    <span>{detail.phone}</span>
                  </div>
                )}
                <div>
                  <small className="text-muted d-block">Submitted By</small>
                  <span>
                    {detail.submittedByName || '—'}
                    {detail.submittedByEmail ? ` (${detail.submittedByEmail})` : ''}
                  </span>
                </div>
                <div>
                  <small className="text-muted d-block">Submitted On</small>
                  <span>{new Date(detail.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {[
                ['Description', detail.description],
                ['Programs Offered', detail.programsOffered],
                ['Facilities', detail.facilities],
                ['Focus Areas', detail.focusAreas],
                ['Bio', detail.bio],
                ['Publications', detail.publications],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} style={{ marginBottom: '16px' }}>
                    <small className="text-muted d-block mb-1">{label}</small>
                    <div
                      style={{
                        backgroundColor: '#f8f9fa',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        whiteSpace: 'pre-wrap',
                        fontSize: '13.5px',
                        lineHeight: 1.6,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}

              {detail.images.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <small className="text-muted d-block mb-2">Images ({detail.images.length})</small>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {detail.images.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={img.url}
                          alt=""
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e9ecef' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #e9ecef',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Status:</span>
                {['new', 'reviewed', 'archived'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(detail.id, st)}
                    className={`btn btn-sm ${detail.status === st ? 'btn-dark' : 'btn-outline-dark'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-success" disabled={exporting} onClick={() => handleExport('pdf', [detail.id])} style={{ backgroundColor: '#006633' }}>
                  <i className="fa-solid fa-file-pdf me-1"></i> PDF
                </button>
                <button className="btn btn-sm btn-primary" disabled={exporting} onClick={() => handleExport('docx', [detail.id])}>
                  <i className="fa-solid fa-file-word me-1"></i> Word
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

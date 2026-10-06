'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  assignedDepartments?: string;
  createdAt: string;
}

interface DeptOption {
  slug: string;
  title: string;
}

export default function UsersAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Department search inside modal
  const [deptSearch, setDeptSearch] = useState('');

  // Create user form
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'subadmin',
    assignedDepartments: [] as string[],
  });

  // Edit user form
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'subadmin',
    assignedDepartments: [] as string[],
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((res) => {
        if (res.status === 403) {
          router.push('/admin');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUsers(data.users || []);
          setDepartments(data.departments || []);
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
      fetchUsers();
    }
  }, [status, router]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Sub-Admin user created successfully!');
        fetchUsers();
        setTimeout(() => {
          setIsCreateOpen(false);
          setSuccessMsg(null);
          setCreateForm({
            name: '',
            email: '',
            password: '',
            role: 'subadmin',
            assignedDepartments: [],
          });
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Failed to create user.');
      }
    } catch (err: any) {
      setErrorMsg('Network error. Could not create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('User updated successfully!');
        fetchUsers();
        setTimeout(() => {
          setIsEditOpen(false);
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Failed to update user.');
      }
    } catch (err: any) {
      setErrorMsg('Network error. Could not update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (email === 'uok@softsols.pk') {
      alert('The Master Super Admin account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  const openEditModal = (user: UserItem) => {
    const depts = (user.assignedDepartments || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setEditForm({
      id: user.id,
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      assignedDepartments: depts,
    });
    setDeptSearch('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditOpen(true);
  };

  const toggleDeptSelection = (slug: string, isCreate: boolean) => {
    if (isCreate) {
      const current = [...createForm.assignedDepartments];
      const idx = current.indexOf(slug);
      if (idx !== -1) current.splice(idx, 1);
      else current.push(slug);
      setCreateForm({ ...createForm, assignedDepartments: current });
    } else {
      const current = [...editForm.assignedDepartments];
      const idx = current.indexOf(slug);
      if (idx !== -1) current.splice(idx, 1);
      else current.push(slug);
      setEditForm({ ...editForm, assignedDepartments: current });
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.title.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.slug.toLowerCase().includes(deptSearch.toLowerCase())
  );

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
            Users & Sub-Admin RBAC Management
          </h1>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
            Create and assign Sub-Admins to manage selected Department pages with restricted editing privileges.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setDeptSearch('');
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
          <i className="fa-solid fa-user-plus"></i>
          <span>Create Sub-Admin</span>
        </button>
      </div>

      {/* Users Table */}
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
            <p className="mt-2 text-muted">Loading user accounts...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>User & Email</th>
                  <th>Role</th>
                  <th style={{ width: '40%' }}>Assigned Department Scope</th>
                  <th>Created Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMaster = u.email === 'uok@softsols.pk';
                  const depts = (u.assignedDepartments || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a3a2a' }}>{u.name || 'User'}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{u.email}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin'
                              ? 'bg-warning text-dark'
                              : 'bg-info text-dark'
                          } text-uppercase`}
                          style={{ fontWeight: 700, letterSpacing: '0.5px' }}
                        >
                          {isMaster ? 'Master Super Admin' : u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === 'admin' || u.assignedDepartments === 'all' ? (
                          <span className="badge bg-success">Full System Access (All Pages)</span>
                        ) : depts.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {depts.map((d) => (
                              <span key={d} className="badge bg-light text-dark border" style={{ fontSize: '11px' }}>
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">No departments assigned</span>
                        )}
                      </td>
                      <td style={{ color: '#6c757d' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-sm btn-outline-primary me-2"
                          title="Edit Permissions"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        {!isMaster && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete User"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SUB-ADMIN MODAL */}
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
              maxWidth: '680px',
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
                <i className="fa-solid fa-user-plus text-success me-2"></i> Create Sub-Admin Account
              </h4>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {errorMsg && <div className="alert alert-danger mb-3">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Salman (Computer Science)"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. cs.admin@uok.edu.pk"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Set account password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Account Role *</label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    >
                      <option value="subadmin">Sub-Admin (Scoped to Department Pages)</option>
                      <option value="admin">Full Admin (Full System Access)</option>
                    </select>
                  </div>
                </div>

                {/* Department Selection */}
                {createForm.role === 'subadmin' && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0" style={{ fontSize: '13px' }}>
                        Assign Department Pages ({createForm.assignedDepartments.length} selected)
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary"
                          style={{ fontSize: '11px' }}
                          onClick={() => setCreateForm({ ...createForm, assignedDepartments: departments.map((d) => d.slug) })}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary"
                          style={{ fontSize: '11px' }}
                          onClick={() => setCreateForm({ ...createForm, assignedDepartments: [] })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="Filter departments..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                    />

                    <div
                      style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid #ced4da',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        backgroundColor: '#fdfdfd',
                      }}
                    >
                      {filteredDepts.map((dept) => {
                        const checked = createForm.assignedDepartments.includes(dept.slug);
                        return (
                          <div key={dept.slug} className="form-check mb-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`create-dept-${dept.slug}`}
                              checked={checked}
                              onChange={() => toggleDeptSelection(dept.slug, true)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`create-dept-${dept.slug}`}
                              style={{ fontSize: '13px', cursor: 'pointer' }}
                            >
                              <strong>{dept.title}</strong>{' '}
                              <span className="text-muted" style={{ fontSize: '11px' }}>({dept.slug})</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  {saving ? 'Creating...' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUB-ADMIN MODAL */}
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
              maxWidth: '680px',
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
                <i className="fa-solid fa-user-pen text-primary me-2"></i> Edit Permissions: {editForm.email}
              </h4>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {errorMsg && <div className="alert alert-danger mb-3">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Role</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      disabled={editForm.email === 'uok@softsols.pk'}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="subadmin">Sub-Admin (Department Scoped)</option>
                      <option value="admin">Full Admin</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
                    Reset Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new password to change"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                </div>

                {/* Department Selection */}
                {editForm.role === 'subadmin' && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0" style={{ fontSize: '13px' }}>
                        Assigned Departments ({editForm.assignedDepartments.length} selected)
                      </label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary"
                          style={{ fontSize: '11px' }}
                          onClick={() => setEditForm({ ...editForm, assignedDepartments: departments.map((d) => d.slug) })}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary"
                          style={{ fontSize: '11px' }}
                          onClick={() => setEditForm({ ...editForm, assignedDepartments: [] })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="Filter departments..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                    />

                    <div
                      style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid #ced4da',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        backgroundColor: '#fdfdfd',
                      }}
                    >
                      {filteredDepts.map((dept) => {
                        const checked = editForm.assignedDepartments.includes(dept.slug);
                        return (
                          <div key={dept.slug} className="form-check mb-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`edit-dept-${dept.slug}`}
                              checked={checked}
                              onChange={() => toggleDeptSelection(dept.slug, false)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`edit-dept-${dept.slug}`}
                              style={{ fontSize: '13px', cursor: 'pointer' }}
                            >
                              <strong>{dept.title}</strong>{' '}
                              <span className="text-muted" style={{ fontSize: '11px' }}>({dept.slug})</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  onClick={() => setIsEditOpen(false)}
                  className="btn btn-light border btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm px-4"
                >
                  {saving ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

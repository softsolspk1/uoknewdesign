'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BACKUP_TABLES, BackupModel } from '@/lib/backupTables';

interface Snapshot {
  name: string;
  size: number;
  uploadedAt: string;
}

interface BackupPreview {
  fileName: string;
  createdAt: string;
  createdBy: string | null;
  counts: Partial<Record<BackupModel, number>>;
  // Gzipped bytes, ready to send to the restore API.
  payload: Blob;
}

// Section names used by the older command-line backups in db-backups/.
const LEGACY_KEYS: Record<string, BackupModel> = {
  pages: 'Page',
  slides: 'Slide',
  news: 'News',
  faqs: 'Faq',
  users: 'User',
  menuItems: 'MenuItem',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
};

async function readBackupFile(file: File): Promise<BackupPreview> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

  let text: string;
  try {
    text = isGzip
      ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
      : new TextDecoder().decode(bytes);
  } catch {
    throw new Error('This file could not be opened. Choose a backup downloaded from this page (.json.gz).');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup.');
  }

  const counts: BackupPreview['counts'] = {};
  let createdAt: string;
  let createdBy: string | null = null;
  if (parsed?.format === 'uok-website-backup' && parsed.tables) {
    for (const { model } of BACKUP_TABLES) {
      if (Array.isArray(parsed.tables[model])) counts[model] = parsed.tables[model].length;
    }
    createdAt = parsed.createdAt;
    createdBy = parsed.createdBy || null;
  } else if (parsed?.takenAt && Array.isArray(parsed.pages)) {
    for (const [key, model] of Object.entries(LEGACY_KEYS)) {
      if (Array.isArray(parsed[key])) counts[model] = parsed[key].length;
    }
    createdAt = parsed.takenAt;
  } else {
    throw new Error('This file is not a UoK website backup.');
  }

  // Plain JSON backups are several MB; compress before upload so they stay
  // under the server's 4.5MB request limit.
  const payload = isGzip
    ? new Blob([bytes])
    : await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).blob();

  return { fileName: file.name, createdAt, createdBy, counts, payload };
}

export default function BackupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [fileError, setFileError] = useState('');
  const [selected, setSelected] = useState<Set<BackupModel>>(new Set());
  const [confirmText, setConfirmText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotsEnabled, setSnapshotsEnabled] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  const fetchSnapshots = () => {
    fetch('/api/admin/backup/snapshots')
      .then((r) => r.json())
      .then((d) => {
        setSnapshots(d.snapshots || []);
        setSnapshotsEnabled(d.enabled !== false);
      })
      .catch(() => setSnapshots([]));
  };

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) fetchSnapshots();
  }, [status, isAdmin]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadMsg(null);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not create the backup.');
      }
      const blob = await res.blob();
      // Name the file in the admin's local time; the server runs in UTC.
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const name = `uok-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.json.gz`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadMsg({ type: 'success', text: `Downloaded ${name} (${formatSize(blob.size)}). Keep it somewhere safe.` });
    } catch (err: any) {
      setDownloadMsg({ type: 'error', text: err.message || 'Network error while creating the backup.' });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChosen = async (file: File | undefined) => {
    setPreview(null);
    setFileError('');
    setRestoreMsg(null);
    setConfirmText('');
    if (!file) return;
    try {
      const p = await readBackupFile(file);
      setPreview(p);
      setSelected(
        new Set(BACKUP_TABLES.filter((t) => t.restoreByDefault && p.counts[t.model] !== undefined).map((t) => t.model))
      );
    } catch (err: any) {
      setFileError(err.message);
    }
  };

  const toggle = (model: BackupModel) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  };

  const handleRestore = async () => {
    if (!preview || selected.size === 0 || confirmText !== 'RESTORE') return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch(`/api/admin/backup/restore?tables=${[...selected].join(',')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/gzip' },
        body: preview.payload,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const summary = BACKUP_TABLES.filter((t) => data.restored[t.model] !== undefined)
          .map((t) => `${t.label}: ${data.restored[t.model]}`)
          .join(', ');
        setRestoreMsg({
          type: 'success',
          text:
            `Restored from the backup of ${formatDate(preview.createdAt)}. ${summary}.` +
            (data.snapshot ? ` The previous content was saved as safety snapshot "${data.snapshot}" below.` : ''),
        });
        setPreview(null);
        setConfirmText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchSnapshots();
      } else {
        setRestoreMsg({ type: 'error', text: data.error || 'Restore failed. Nothing was changed.' });
      }
    } catch {
      setRestoreMsg({
        type: 'error',
        text: 'Network error during restore. Reload this page and check the site before trying again.',
      });
    } finally {
      setRestoring(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={cardStyle}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Backup &amp; Restore</h1>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>Only administrators can back up or restore the website.</p>
      </div>
    );
  }

  const canRestore = !!preview && selected.size > 0 && confirmText === 'RESTORE' && !restoring;

  return (
    <div>
      <div style={cardStyle}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a3a2a', margin: '0 0 6px 0' }}>Backup &amp; Restore</h1>
        <p style={{ fontSize: '14px', color: '#6c757d', margin: 0 }}>
          Download a copy of all website content to your computer, and restore it if something goes wrong.
        </p>
      </div>

      {/* Download */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a3a2a', marginBottom: '8px' }}>
          <i className="fa-solid fa-download me-2" style={{ color: '#006633' }}></i>Download a backup
        </h2>
        <p style={{ fontSize: '13px', color: '#495057', marginBottom: '6px' }}>
          Includes all pages, menus, news, homepage slides, FAQs, contact inquiries, info submissions and admin
          user accounts, in one <code>.json.gz</code> file.
        </p>
        <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '16px' }}>
          Not included: visitor analytics, and the uploaded image/PDF files themselves (pages keep their links to
          them, and restoring never deletes them). The file contains password hashes and visitors&apos; contact
          details — store it securely and don&apos;t share it.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-success"
          style={{ backgroundColor: '#006633', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
        >
          {downloading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>Preparing backup…
            </>
          ) : (
            <>
              <i className="fa-solid fa-file-arrow-down me-2"></i>Download Backup
            </>
          )}
        </button>
        {downloadMsg && (
          <div className={`alert alert-${downloadMsg.type === 'success' ? 'success' : 'danger'} mt-3 mb-0`} style={{ fontSize: '13px' }}>
            {downloadMsg.text}
          </div>
        )}
      </div>

      {/* Restore */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a3a2a', marginBottom: '8px' }}>
          <i className="fa-solid fa-clock-rotate-left me-2" style={{ color: '#006633' }}></i>Restore from a backup
        </h2>
        <p style={{ fontSize: '13px', color: '#495057', marginBottom: '16px' }}>
          Restoring <strong>replaces</strong> the selected sections with the contents of the backup file. Changes
          made since the backup was taken will be lost from those sections. The current content is saved
          automatically as a safety snapshot first.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".gz,.json,application/gzip,application/json"
          className="form-control"
          style={{ maxWidth: '480px', fontSize: '13px' }}
          onChange={(e) => handleFileChosen(e.target.files?.[0])}
        />
        {fileError && <div className="alert alert-danger mt-3 mb-0" style={{ fontSize: '13px' }}>{fileError}</div>}

        {preview && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', color: '#495057', marginBottom: '12px' }}>
              <strong>{preview.fileName}</strong> — taken {formatDate(preview.createdAt)}
              {preview.createdBy ? ` by ${preview.createdBy}` : ''}
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle mb-3" style={{ fontSize: '13px', maxWidth: '560px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Section</th>
                    <th className="text-end">Items in backup</th>
                  </tr>
                </thead>
                <tbody>
                  {BACKUP_TABLES.map((t) => {
                    const count = preview.counts[t.model];
                    const available = count !== undefined;
                    return (
                      <tr key={t.model} style={{ opacity: available ? 1 : 0.5 }}>
                        <td>
                          {/* The site theme hides native checkboxes and draws
                              its own box on the label that follows them. */}
                          <input
                            type="checkbox"
                            id={`restore-${t.model}`}
                            disabled={!available}
                            checked={selected.has(t.model)}
                            onChange={() => toggle(t.model)}
                          />
                          <label
                            htmlFor={`restore-${t.model}`}
                            style={{ cursor: available ? 'pointer' : 'default', marginBottom: 0 }}
                          >
                            {t.label}
                          </label>
                        </td>
                        <td className="text-end">{available ? count : 'not in backup'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selected.has('User') && (
              <div className="alert alert-warning" style={{ fontSize: '13px', maxWidth: '560px' }}>
                Restoring <strong>Users &amp; Sub-Admins</strong> brings back the accounts and passwords as they were
                when the backup was taken. Your own account is kept so you can still sign in.
              </div>
            )}

            <label htmlFor="restore-confirm" style={{ fontSize: '13px', color: '#495057', display: 'block', marginBottom: '6px' }}>
              Type <strong>RESTORE</strong> to confirm
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                id="restore-confirm"
                type="text"
                className="form-control"
                style={{ maxWidth: '200px', fontSize: '13px' }}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
              <button
                onClick={handleRestore}
                disabled={!canRestore}
                className="btn btn-danger"
                style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
              >
                {restoring ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>Restoring…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-rotate-left me-2"></i>Restore {selected.size} section{selected.size === 1 ? '' : 's'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {restoreMsg && (
          <div className={`alert alert-${restoreMsg.type === 'success' ? 'success' : 'danger'} mt-3 mb-0`} style={{ fontSize: '13px' }}>
            {restoreMsg.text}
          </div>
        )}
      </div>

      {/* Safety snapshots */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a3a2a', marginBottom: '8px' }}>
          <i className="fa-solid fa-shield-halved me-2" style={{ color: '#006633' }}></i>Safety snapshots
        </h2>
        <p style={{ fontSize: '13px', color: '#495057', marginBottom: '16px' }}>
          Saved automatically just before each restore. To undo a restore, download the snapshot taken just before it
          and restore from that file.
        </p>
        {!snapshotsEnabled ? (
          <p style={{ fontSize: '13px', color: '#6c757d', margin: 0 }}>
            Safety snapshots need file storage, which isn&apos;t set up in this environment. Download a backup before
            restoring.
          </p>
        ) : snapshots.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#6c757d', margin: 0 }}>No restores have been made yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Taken</th>
                  <th>Size</th>
                  <th className="text-end">Download</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.name}>
                    <td>{formatDate(s.uploadedAt)}</td>
                    <td>{formatSize(s.size)}</td>
                    <td className="text-end">
                      <a
                        href={`/api/admin/backup/snapshots?file=${encodeURIComponent(s.name)}`}
                        className="btn btn-sm btn-outline-success"
                      >
                        <i className="fa-solid fa-download"></i>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

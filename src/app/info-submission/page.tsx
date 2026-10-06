'use client';

import React, { useEffect, useRef, useState } from 'react';
import { isValidUokEmail, normalizeEmail } from '@/lib/emailValidation';

type SubmissionType = 'department' | 'faculty' | 'institute';

const TYPE_OPTIONS: { value: SubmissionType; label: string; icon: string }[] = [
  { value: 'department', label: 'Department', icon: 'fa-solid fa-building-columns' },
  { value: 'faculty', label: 'Faculty Member', icon: 'fa-solid fa-user-tie' },
  { value: 'institute', label: 'Research Institute', icon: 'fa-solid fa-flask' },
];

const emptyForm = {
  type: 'department' as SubmissionType,
  name: '',
  departmentName: '',
  headName: '',
  designation: '',
  qualification: '',
  email: '',
  phone: '',
  description: '',
  programsOffered: '',
  facilities: '',
  focusAreas: '',
  bio: '',
  publications: '',
  submittedByName: '',
  submittedByEmail: '',
};

interface UploadedImage {
  url: string;
  name: string;
}

export default function InfoSubmissionPage() {
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof emptyForm, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleEmailChange = (val: string) => {
    set('submittedByEmail', val);
    if (isVerified) {
      setIsVerified(false);
      setVerifiedEmail('');
      setVerificationToken('');
      setOtpSent(false);
      setOtpCode('');
      setOtpMessage(null);
    }
  };

  const handleSendOtp = async () => {
    setOtpMessage(null);
    const email = normalizeEmail(form.submittedByEmail);
    if (!email) {
      setOtpMessage({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }
    if (!isValidUokEmail(email)) {
      setOtpMessage({ type: 'error', text: 'Email must be an official @uok.edu.pk address (e.g. yourname@uok.edu.pk).' });
      return;
    }

    setOtpSending(true);
    try {
      const res = await fetch('/api/info-submissions/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpMessage({ type: 'success', text: data.message || '4-digit code sent to your email.' });
      } else {
        setOtpMessage({ type: 'error', text: data.error || 'Failed to send verification code.' });
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'Network error while sending code. Please try again.' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpMessage(null);
    const email = normalizeEmail(form.submittedByEmail);
    const code = otpCode.trim();

    if (!code || code.length !== 4) {
      setOtpMessage({ type: 'error', text: 'Please enter the 4-digit code received on your email.' });
      return;
    }

    setOtpVerifying(true);
    try {
      const res = await fetch('/api/info-submissions/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.verificationToken) {
        setIsVerified(true);
        setVerifiedEmail(email);
        setVerificationToken(data.verificationToken);
        setOtpMessage({ type: 'success', text: 'Email verified successfully! You can now submit the form.' });
      } else {
        setOtpMessage({ type: 'error', text: data.error || 'Invalid or expired code. Please try again.' });
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'Network error while verifying code.' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 10);
    setUploadingCount((c) => c + list.length);

    for (const file of list) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/public/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((imgs) => [...imgs, { url: data.url, name: file.name }]);
        } else {
          setMessage({ type: 'error', text: data.error || `Failed to upload ${file.name}.` });
        }
      } catch {
        setMessage({ type: 'error', text: `Network error uploading ${file.name}.` });
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  };

  const removeImage = (url: string) => setImages((imgs) => imgs.filter((i) => i.url !== url));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name.' });
      return;
    }
    if (!isVerified || !verificationToken || normalizeEmail(form.submittedByEmail) !== normalizeEmail(verifiedEmail)) {
      setMessage({ type: 'error', text: 'Please verify your @uok.edu.pk email address with the 4-digit code before submitting.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/info-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          submittedByEmail: normalizeEmail(form.submittedByEmail),
          verificationToken,
          images: images.map((i) => i.url),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Thank you! Your information has been submitted successfully.' });
        setForm(emptyForm);
        setImages([]);
        setIsVerified(false);
        setVerifiedEmail('');
        setVerificationToken('');
        setOtpSent(false);
        setOtpCode('');
        setOtpMessage(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit. Please try again.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while submitting.' });
    } finally {
      setSubmitting(false);
    }
  };

  const nameLabel = form.type === 'faculty' ? 'Full Name *' : form.type === 'institute' ? 'Institute Name *' : 'Department Name *';

  return (
    <div className="container" style={{ maxWidth: '760px', padding: '60px 20px' }}>
      <div className="mb-4">
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a3622' }}>Department / Faculty / Institute Information Update</h1>
        <p style={{ color: '#6c757d', fontSize: '14.5px' }}>
          Use this form to submit or update information for your Department, Faculty Member profile, or Research Institute.
          This helps our web team keep the university website accurate and current. You can attach multiple photos.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ borderRadius: '8px' }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: '13.5px' }}>
            What are you submitting information for? *
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('type', opt.value)}
                className={`btn ${form.type === opt.value ? 'btn-success' : 'btn-outline-secondary'}`}
                style={{
                  backgroundColor: form.type === opt.value ? '#006633' : undefined,
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                <i className={`${opt.icon} me-2`}></i>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold" style={{ fontSize: '13px' }}>{nameLabel}</label>
          <input className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        {form.type === 'faculty' && (
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Department</label>
            <input className="form-control" value={form.departmentName} onChange={(e) => set('departmentName', e.target.value)} />
          </div>
        )}

        {form.type !== 'faculty' && (
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
              {form.type === 'institute' ? 'Director' : 'Head of Department'}
            </label>
            <input className="form-control" value={form.headName} onChange={(e) => set('headName', e.target.value)} />
          </div>
        )}

        {form.type === 'faculty' && (
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Designation</label>
              <input className="form-control" value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. Assistant Professor" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Qualification</label>
              <input className="form-control" value={form.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. PhD (Chemistry)" />
            </div>
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Email</label>
            <input type="email" className="form-control" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Phone</label>
            <input className="form-control" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>

        {form.type === 'department' && (
          <>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Description / Overview</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Programs Offered</label>
              <textarea className="form-control" rows={3} value={form.programsOffered} onChange={(e) => set('programsOffered', e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Facilities</label>
              <textarea className="form-control" rows={3} value={form.facilities} onChange={(e) => set('facilities', e.target.value)}></textarea>
            </div>
          </>
        )}

        {form.type === 'faculty' && (
          <>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Bio</label>
              <textarea className="form-control" rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Publications</label>
              <textarea className="form-control" rows={3} value={form.publications} onChange={(e) => set('publications', e.target.value)}></textarea>
            </div>
          </>
        )}

        {form.type === 'institute' && (
          <>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Description / Overview</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Focus Areas</label>
              <textarea className="form-control" rows={3} value={form.focusAreas} onChange={(e) => set('focusAreas', e.target.value)}></textarea>
            </div>
          </>
        )}

        <div className="mb-4">
          <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
            Photos {form.type === 'faculty' ? '(profile / additional photos)' : '(department / institute photos)'}
          </label>
          <div>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0}>
              <i className="fa-solid fa-upload me-1"></i> {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : 'Add Photos'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          {images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              {images.map((img) => (
                <div key={img.url} style={{ position: 'relative' }}>
                  <img src={img.url} alt={img.name} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e9ecef' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(img.url)}
                    title="Remove"
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      fontSize: '13px',
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="form-text">Up to 10 images, JPG/PNG/WEBP, 4MB each.</div>
        </div>

        <hr className="my-4" />

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Your Name</label>
            <input className="form-control" value={form.submittedByName} onChange={(e) => set('submittedByName', e.target.value)} placeholder="Person submitting this info" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold" style={{ fontSize: '13px' }}>
              Your Email <span className="text-muted fw-normal" style={{ fontSize: '12px' }}>(Email should be of @uok.edu.pk)</span> *
            </label>
            <div className="input-group">
              <input
                type="email"
                className={`form-control ${isVerified ? 'is-valid' : ''}`}
                value={form.submittedByEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="yourname@uok.edu.pk"
                disabled={isVerified}
                required
              />
              {isVerified ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setIsVerified(false);
                    setVerifiedEmail('');
                    setVerificationToken('');
                    setOtpSent(false);
                    setOtpCode('');
                    setOtpMessage(null);
                  }}
                  title="Change email"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSendOtp}
                  disabled={otpSending || !isValidUokEmail(form.submittedByEmail)}
                  style={{ backgroundColor: '#006633', fontSize: '13px', fontWeight: 600 }}
                >
                  {otpSending ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
                </button>
              )}
            </div>

            {isVerified && (
              <div className="mt-2 text-success fw-semibold" style={{ fontSize: '13px' }}>
                <i className="fa-solid fa-circle-check me-1"></i> Email verified: {verifiedEmail}
              </div>
            )}

            {!isVerified && otpSent && (
              <div className="mt-3 p-3 border rounded" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: '12.5px' }}>
                  Enter 4-Digit Verification Code *
                </label>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="text"
                    maxLength={4}
                    className="form-control text-center fw-bold"
                    style={{ maxWidth: '140px', letterSpacing: '6px', fontSize: '18px' }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpCode.length !== 4}
                    style={{ backgroundColor: '#006633', borderColor: '#006633', fontSize: '13px', fontWeight: 600 }}
                  >
                    {otpVerifying ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
                <div className="form-text text-muted" style={{ fontSize: '11.5px', marginTop: '6px' }}>
                  Check your inbox for a 4-digit code sent to <strong>{form.submittedByEmail}</strong> (valid for 10 minutes).
                </div>
              </div>
            )}

            {otpMessage && (
              <div
                className={`mt-2 alert ${otpMessage.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-0`}
                style={{ fontSize: '12.5px', borderRadius: '6px' }}
              >
                {otpMessage.text}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-success px-4"
          disabled={submitting || uploadingCount > 0 || !isVerified}
          style={{
            backgroundColor: isVerified ? '#006633' : '#6c757d',
            borderColor: isVerified ? '#006633' : '#6c757d',
            fontWeight: 600,
            cursor: isVerified ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Information'}
        </button>
        {!isVerified && (
          <div className="form-text text-muted mt-2">
            <i className="fa-solid fa-shield-halved me-1 text-success"></i> Please verify your @uok.edu.pk email address above to enable submission.
          </div>
        )}
      </form>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (res?.ok) {
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #0a3622 0%, #155724 50%, #052c17 100%)',
        padding: '20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            backgroundColor: '#052c17',
            color: '#fff',
            padding: '32px 24px',
            textAlign: 'center',
            borderBottom: '3px solid #d4a017',
          }}
        >
          <img
            src="/uok101.jpg"
            alt="University of Karachi 75 Years Logo"
            style={{
              height: '80px',
              width: 'auto',
              marginBottom: '12px',
              backgroundColor: '#fff',
              padding: '4px',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
            UNIVERSITY OF KARACHI
          </h2>
          <p style={{ fontSize: '13px', margin: 0, color: '#e0c068', fontWeight: 500 }}>
            ADMINISTRATION PORTAL
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '32px 28px' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2c3e50', margin: '0 0 6px 0' }}>
              Sign In to Your Account
            </h3>
            <p style={{ fontSize: '13px', color: '#6c757d', margin: 0 }}>
              Enter your credentials to access the administration dashboard
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@uok.edu.pk"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <i
                  className="fa-solid fa-envelope"
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#adb5bd', fontSize: '14px' }}
                ></i>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <i
                  className="fa-solid fa-lock"
                  style={{ position: 'absolute', left: '12px', top: '13px', color: '#adb5bd', fontSize: '14px' }}
                ></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#006633',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 102, 51, 0.3)',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/" style={{ color: '#6c757d', fontSize: '13px', textDecoration: 'none' }}>
              <i className="fa-solid fa-house"></i> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

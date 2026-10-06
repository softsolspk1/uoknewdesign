import React from 'react';

export default function PdfDownloadButton({ url, label }: { url?: string | null; label?: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '90px',
        zIndex: 1200,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#7c0405',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: 600,
        textDecoration: 'none',
        boxShadow: '0 8px 20px rgba(124,4,5,0.35)',
      }}
    >
      <i className="fa-solid fa-file-pdf"></i>
      <span>{label || 'Download PDF'}</span>
    </a>
  );
}

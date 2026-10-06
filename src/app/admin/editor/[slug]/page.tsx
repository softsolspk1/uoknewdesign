'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

const EDITOR_STYLE_ID = 'uok-visual-editor-style';

export default function VisualEditorPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editObserverRef = useRef<MutationObserver | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [notFoundErr, setNotFoundErr] = useState<string | null>(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [autoFitReplace, setAutoFitReplace] = useState(true);
  const autoFitReplaceRef = useRef(autoFitReplace);
  autoFitReplaceRef.current = autoFitReplace;
  const newImageInputRef = useRef<HTMLInputElement>(null);

  // Insert Link / Insert File modal state
  const savedRangeRef = useRef<Range | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkMode, setLinkMode] = useState<'url' | 'upload'>('upload');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkFile, setLinkFile] = useState<File | null>(null);
  const [linkUploading, setLinkUploading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const linkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login');
  }, [status, router]);

  useEffect(() => {
    fetch(`/api/admin/pages?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.page) {
          setPageTitle(d.page.title);
        } else {
          setNotFoundErr(d.error || 'Page not found.');
        }
      })
      .catch(() => setNotFoundErr('Failed to load page.'));
  }, [slug]);

  const liveUrl = slug === 'home' ? '/' : `/${slug}`;

  const openImagePicker = useCallback((imgEl: HTMLImageElement, doc: Document) => {
    const fileInput = doc.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.style.display = 'none';
    doc.body.appendChild(fileInput);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.remove();
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      // Replacing an existing image: auto-fit the new file to the current
      // image's rendered size so the page layout doesn't shift or distort.
      if (autoFitReplaceRef.current && imgEl.naturalWidth && imgEl.naturalHeight) {
        formData.append('targetWidth', String(imgEl.naturalWidth));
        formData.append('targetHeight', String(imgEl.naturalHeight));
      }
      setMessage(null);
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          imgEl.setAttribute('src', data.url);
          // Template images often sit in a fixed-height box with
          // `object-fit: cover`, which crops anything whose shape differs
          // from the original. Let the new image take its natural height so
          // the whole uploaded picture is visible.
          if (imgEl.style.objectFit === 'cover' && imgEl.style.height && imgEl.style.height !== 'auto') {
            imgEl.style.height = 'auto';
            imgEl.style.removeProperty('object-fit');
          }
          setDirty(true);
        } else {
          setMessage({ type: 'error', text: data.error || 'Image upload failed.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Network error during image upload.' });
      }
    });

    fileInput.click();
  }, []);

  const setupEditing = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    if (!iframe || !doc || !win) {
      setLoadingIframe(false);
      setMessage({ type: 'error', text: 'Could not access the page preview. Try reloading.' });
      return;
    }

    const root = (doc.querySelector('main.uok-dynamic-page') || doc.querySelector('main')) as HTMLElement | null;
    if (!root) {
      // Without this, the loading spinner (position:absolute, inset:0,
      // z-index:10) stays up forever and silently blocks every click on
      // the iframe underneath it — the page *looks* frozen/uneditable
      // with no indication of why.
      setLoadingIframe(false);
      setMessage({ type: 'error', text: 'This page has no editable content area. Contact an administrator.' });
      return;
    }

    // Any failure below (e.g. a DOM API throwing on an edge-case document)
    // must still clear the loading spinner — otherwise it's stuck covering
    // the iframe forever, which looks exactly like "the editor is broken
    // and nothing is clickable".
    try {
      // Re-entrant guard: this function can run more than once against the
      // same document (see the MutationObserver set up at the end of this
      // function), so clear out anything a previous run left behind first.
      editObserverRef.current?.disconnect();
      doc.querySelectorAll('.uok-editor-delete-btn').forEach((el) => el.remove());

      // The site's own preloader (a fixed, full-viewport, z-index:999 overlay)
      // is only dismissed by a jQuery `$(window).on('load', ...)` handler in
      // main.js. On content-heavy pages that event can fire late — or the
      // fade can leave it visually transparent but still present — and since
      // opacity alone doesn't disable pointer-events, it silently swallows
      // every click in the iframe (clicking a photo appears to do nothing).
      // The editor doesn't need this cosmetic overlay at all, so remove it
      // outright instead of racing the live site's own dismissal timing.
      doc.querySelectorAll('.preloader').forEach((el) => el.remove());

      root.setAttribute('contenteditable', 'true');
      root.style.outline = 'none';
      root.style.minHeight = '100px';

      try {
        doc.execCommand('enableObjectResizing', false, 'false' as any);
        doc.execCommand('enableInlineTableEditing', false, 'false' as any);
      } catch {
        /* not supported in all browsers; safe to ignore */
      }

      if (!doc.getElementById(EDITOR_STYLE_ID)) {
        const style = doc.createElement('style');
        style.id = EDITOR_STYLE_ID;
        style.textContent = `
          .uok-editor-hover { outline: 2px dashed #006633 !important; outline-offset: -2px; }
          .uok-editor-img-hover { outline: 3px solid #0d6efd !important; cursor: pointer !important; }
          .uok-editor-img-hover, main[contenteditable] img { -webkit-user-drag: none; user-select: none; }
          main[contenteditable] *::before, main[contenteditable] *::after { pointer-events: none !important; }
          .uok-editor-delete-btn {
            position: absolute; z-index: 999999; background: #dc3545; color: #fff; border: none;
            border-radius: 5px; width: 28px; height: 28px; font-size: 16px; line-height: 1; cursor: pointer;
            display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.35);
          }
        `;
        doc.head.appendChild(style);
      }

      const delBtn = doc.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'uok-editor-delete-btn';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Delete this section';
      delBtn.style.display = 'none';
      doc.body.appendChild(delBtn);

      // Template images are often covered by something: `.global-img:after`
      // (a z-index:1 hover-shine pseudo-element that grows over the photo),
      // gradient/overlay divs, etc. A click on a pseudo-element targets its
      // host, so the event never reaches the <img> — clicking such a photo
      // silently did nothing. Resolve the image actually under the pointer
      // instead, but leave clicks on real text alone so captions/cards that
      // sit over an image stay editable as text.
      const findImageAt = (e: MouseEvent): HTMLImageElement | null => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') return target as HTMLImageElement;
        if (!root.contains(target)) return null;
        const img = doc
          .elementsFromPoint(e.clientX, e.clientY)
          .find((el): el is HTMLImageElement => el.tagName === 'IMG' && root.contains(el));
        if (!img) return null;
        if (target.contains(img) || !target.textContent?.trim()) return img;
        return null;
      };

      let hoveredImg: HTMLImageElement | null = null;
      root.addEventListener('mousemove', (e: MouseEvent) => {
        const img = findImageAt(e);
        if (img === hoveredImg) return;
        hoveredImg?.classList.remove('uok-editor-img-hover');
        img?.classList.add('uok-editor-img-hover');
        hoveredImg = img;
      });

      let hoveredSection: HTMLElement | null = null;

      const positionDelBtn = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        delBtn.style.display = 'flex';
        delBtn.style.top = `${win.scrollY + rect.top + 6}px`;
        delBtn.style.left = `${win.scrollX + rect.right - 34}px`;
      };

      root.addEventListener('mouseover', (e: Event) => {
        const target = e.target as HTMLElement;

        let el: HTMLElement | null = target;
        while (el && el.parentElement !== root) el = el.parentElement;
        if (el && el.parentElement === root) {
          if (hoveredSection && hoveredSection !== el) hoveredSection.classList.remove('uok-editor-hover');
          hoveredSection = el;
          el.classList.add('uok-editor-hover');
          positionDelBtn(el);
        }
      });

      root.addEventListener('mouseleave', () => {
        hoveredImg?.classList.remove('uok-editor-img-hover');
        hoveredImg = null;
        if (hoveredSection) hoveredSection.classList.remove('uok-editor-hover');
        hoveredSection = null;
        delBtn.style.display = 'none';
      });

      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (hoveredSection && win.confirm('Delete this section? This cannot be undone once you Save.')) {
          hoveredSection.remove();
          hoveredSection = null;
          delBtn.style.display = 'none';
          setDirty(true);
        }
      });

      root.addEventListener(
        'click',
        (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const link = target.closest('a');
          if (link) {
            e.preventDefault();
          }
          const img = findImageAt(e);
          if (img) {
            e.preventDefault();
            e.stopPropagation();
            openImagePicker(img, doc);
          }
        },
        true
      );

      root.addEventListener('input', () => setDirty(true));

      // Prevent embedded forms (e.g. the contact form) from actually
      // submitting while in edit mode.
      root.addEventListener('submit', (e: Event) => e.preventDefault(), true);

      // Track the last selection/cursor position inside the page body so the
      // "Insert Link" toolbar (which lives outside the iframe, and steals
      // focus/selection when clicked) still knows where to insert.
      doc.addEventListener('selectionchange', () => {
        const sel = win.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (root.contains(range.commonAncestorContainer)) {
            savedRangeRef.current = range.cloneRange();
          }
        }
      });

      // If React decides post-load that its client render didn't match the
      // server-rendered HTML anywhere on the page (a hydration mismatch —
      // these are easy to introduce in a large template and easy to miss),
      // it silently discards and rebuilds the affected DOM subtree. That can
      // take `root` down with it: contenteditable and every listener
      // attached above vanish with no error, and the page just stops
      // responding to clicks. Watch for that and re-run setup against
      // whatever element is actually there now.
      const observer = new MutationObserver(() => {
        const currentRoot = doc.querySelector('main.uok-dynamic-page') || doc.querySelector('main');
        if (currentRoot && (currentRoot !== root || currentRoot.getAttribute('contenteditable') !== 'true')) {
          setupEditing();
        }
      });
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable'] });
      editObserverRef.current = observer;
    } catch (err) {
      console.error('Visual editor setup failed:', err);
      setMessage({ type: 'error', text: 'Something went wrong preparing this page for editing. Try reloading.' });
    } finally {
      setLoadingIframe(false);
    }
  }, [openImagePicker]);

  const handleSave = async () => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const root = (doc.querySelector('main.uok-dynamic-page') || doc.querySelector('main')) as HTMLElement | null;
    if (!root) return;

    const clone = root.cloneNode(true) as HTMLElement;
    clone.removeAttribute('contenteditable');
    clone.style.removeProperty('outline');
    clone.style.removeProperty('min-height');
    clone.querySelectorAll('.uok-editor-delete-btn').forEach((el) => el.remove());
    clone.querySelectorAll('.uok-editor-hover').forEach((el) => el.classList.remove('uok-editor-hover'));
    clone.querySelectorAll('.uok-editor-img-hover').forEach((el) => el.classList.remove('uok-editor-img-hover'));

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content: clone.innerHTML }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Saved — your changes are live.' });
        setDirty(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save changes.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!dirty || window.confirm('Discard unsaved changes and reload the page?')) {
      setDirty(false);
      setLoadingIframe(true);
      setReloadKey((k) => k + 1);
    }
  };

  const openLinkModal = () => {
    const selectedText = savedRangeRef.current?.toString() || '';
    setLinkText(selectedText);
    setLinkMode('upload');
    setLinkUrl('');
    setLinkFile(null);
    setLinkError('');
    setLinkModalOpen(true);
  };

  const handleInsertLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    const range = savedRangeRef.current;
    if (!doc || !win || !range) {
      setLinkError('Click into the page text first to place your cursor, then try again.');
      return;
    }

    let href = linkUrl.trim();

    if (linkMode === 'upload') {
      if (!linkFile) {
        setLinkError('Choose a PDF, Word or image file to upload.');
        return;
      }
      setLinkUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', linkFile);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) {
          setLinkError(data.error || 'Upload failed.');
          setLinkUploading(false);
          return;
        }
        href = data.url;
      } catch {
        setLinkError('Network error during upload.');
        setLinkUploading(false);
        return;
      }
      setLinkUploading(false);
    }

    if (!href) {
      setLinkError('Enter a URL or upload a file.');
      return;
    }

    const text = linkText.trim() || href;
    const anchor = doc.createElement('a');
    anchor.setAttribute('href', href);
    if (/^https?:\/\//.test(href) || href.startsWith('/api/media/') || href.startsWith('/uploads/')) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
    anchor.textContent = text;

    const sel = win.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    // If the selection sits inside (or spans) an existing link — e.g. the admin
    // selected old "Click here" text to swap in a new upload — strip that old
    // <a> first. Otherwise insertNode below nests the new link inside it
    // (<a href="old"><a href="new">...</a></a>), which browsers render as a
    // dead outer link wrapping the real one instead of a clean replacement.
    doc.execCommand('unlink', false);
    const insertRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : range;

    insertRange.deleteContents();
    insertRange.insertNode(anchor);

    // Move the cursor to just after the newly inserted link.
    insertRange.setStartAfter(anchor);
    insertRange.setEndAfter(anchor);
    sel?.removeAllRanges();
    sel?.addRange(insertRange);
    savedRangeRef.current = insertRange.cloneRange();

    setDirty(true);
    setLinkModalOpen(false);
  };

  // Table row editing: works on whichever table cell the admin last clicked
  // into (tracked via savedRangeRef, since the toolbar lives outside the iframe).
  const getCurrentTableRow = (): HTMLTableRowElement | null => {
    const range = savedRangeRef.current;
    if (!range) return null;
    let node: Node | null = range.startContainer;
    if (node && node.nodeType !== 1) node = node.parentNode;
    return (node as Element | null)?.closest('tr') ?? null;
  };

  const handleTableRow = (action: 'above' | 'below' | 'delete') => {
    const row = getCurrentTableRow();
    if (!row) {
      setMessage({ type: 'error', text: 'Click into a table cell first, then use the table buttons.' });
      return;
    }
    const doc = row.ownerDocument;
    const win = doc.defaultView;
    setMessage(null);

    if (action === 'delete') {
      const section = row.parentElement;
      row.remove();
      if (section && section.children.length === 0 && section.tagName !== 'TBODY') section.remove();
      savedRangeRef.current = null;
      setDirty(true);
      return;
    }

    // Header rows (<th> cells / <thead>) shouldn't be cloned as header cells
    // into the body, so new rows always use <td>, while keeping each column's
    // class/style/colspan so the new row lines up with the existing table.
    const inHead = row.parentElement?.tagName === 'THEAD';
    const newRow = doc.createElement('tr');
    newRow.className = row.className;
    Array.from(row.cells).forEach((cell) => {
      const td = doc.createElement(inHead || cell.tagName !== 'TH' ? 'td' : 'th');
      if (!inHead) {
        if (cell.className) td.className = cell.className;
        const style = cell.getAttribute('style');
        if (style) td.setAttribute('style', style);
      }
      if (cell.colSpan > 1) td.colSpan = cell.colSpan;
      td.innerHTML = '<br>';
      newRow.appendChild(td);
    });

    if (inHead) {
      // Adding a row next to the header goes at the top of the body.
      const table = row.closest('table');
      let tbody = table?.tBodies[0];
      if (!tbody && table) tbody = table.appendChild(doc.createElement('tbody'));
      tbody?.insertBefore(newRow, tbody.firstChild);
    } else if (action === 'above') {
      row.parentNode?.insertBefore(newRow, row);
    } else {
      row.parentNode?.insertBefore(newRow, row.nextSibling);
    }

    // Put the cursor in the first cell of the new row.
    const first = newRow.cells[0];
    if (first && win) {
      const r = doc.createRange();
      r.setStart(first, 0);
      r.collapse(true);
      const sel = win.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      savedRangeRef.current = r.cloneRange();
    }
    setDirty(true);
  };

  const handleInsertNewImage = async (file: File) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    const range = savedRangeRef.current;
    if (!doc || !win || !range) {
      setMessage({ type: 'error', text: 'Click into the page text first to place your cursor, then try again.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setMessage({ type: 'error', text: data.error || 'Image upload failed.' });
        return;
      }

      const img = doc.createElement('img');
      img.setAttribute('src', data.url);
      img.setAttribute('alt', '');
      img.style.maxWidth = '100%';
      img.style.height = 'auto';

      const sel = win.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      range.deleteContents();
      range.insertNode(img);

      range.setStartAfter(img);
      range.setEndAfter(img);
      sel?.removeAllRanges();
      sel?.addRange(range);
      savedRangeRef.current = range.cloneRange();

      setDirty(true);
    } catch {
      setMessage({ type: 'error', text: 'Network error during image upload.' });
    }
  };

  return (
    <div
      className="uok-visual-editor-shell"
      style={{ margin: '-28px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 66px)' }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e9ecef',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1a3a2a', margin: 0 }}>
            <i className="fa-solid fa-pen-ruler me-2"></i> Visual Editor: {pageTitle || slug}
          </h1>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '2px 0 0 0' }}>
            Click any text to edit it in place &bull; Click an image to replace it &bull; Insert Image adds a new one at your cursor &bull; Click a table cell to add/delete rows &bull; Hover a section for the delete button
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {message && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: message.type === 'success' ? '#0f5132' : '#842029',
              }}
            >
              {message.text}
            </span>
          )}
          <div className="form-check form-switch mb-0" title="When replacing an image, automatically crop/resize the new file to match the current image's size so the layout doesn't shift">
            <input
              className="form-check-input"
              type="checkbox"
              checked={autoFitReplace}
              onChange={(e) => setAutoFitReplace(e.target.checked)}
              id="autoFitReplace"
            />
            <label className="form-check-label" htmlFor="autoFitReplace" style={{ fontSize: '12.5px' }}>
              Auto-fit replaced images
            </label>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/pages')}
            className="btn btn-light border btn-sm"
          >
            Back to Pages
          </button>
          <button
            type="button"
            onClick={() => newImageInputRef.current?.click()}
            disabled={loadingIframe}
            className="btn btn-outline-secondary btn-sm"
            title="Insert a brand-new image at your cursor position"
          >
            <i className="fa-solid fa-image me-1"></i> Insert Image
          </button>
          <input
            ref={newImageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleInsertNewImage(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={openLinkModal}
            disabled={loadingIframe}
            className="btn btn-outline-secondary btn-sm"
            title="Insert a link — paste a URL, or upload a PDF / Word / image file"
          >
            <i className="fa-solid fa-link me-1"></i> Insert Link / File
          </button>
          <div className="btn-group btn-group-sm" role="group" aria-label="Table rows">
            <button
              type="button"
              onClick={() => handleTableRow('above')}
              disabled={loadingIframe}
              className="btn btn-outline-secondary"
              title="Click into a table cell, then add a new empty row above it"
            >
              <i className="fa-solid fa-table me-1"></i> Row Above
            </button>
            <button
              type="button"
              onClick={() => handleTableRow('below')}
              disabled={loadingIframe}
              className="btn btn-outline-secondary"
              title="Click into a table cell, then add a new empty row below it"
            >
              Row Below
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete the table row your cursor is in?')) handleTableRow('delete');
              }}
              disabled={loadingIframe}
              className="btn btn-outline-danger"
              title="Delete the table row your cursor is in"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!dirty || saving}
            className="btn btn-outline-secondary btn-sm"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn btn-success btn-sm px-3"
            style={{ backgroundColor: '#006633' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', backgroundColor: '#f4f6f9' }}>
        {notFoundErr && (
          <div className="alert alert-danger m-4">{notFoundErr}</div>
        )}

        {!notFoundErr && loadingIframe && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f4f6f9',
              zIndex: 10,
            }}
          >
            <div className="spinner-border text-success" role="status"></div>
          </div>
        )}

        {!notFoundErr && (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={liveUrl}
            onLoad={setupEditing}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
            title="Visual page editor"
          />
        )}
      </div>

      {linkModalOpen && (
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
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1a3a2a' }}>
                <i className="fa-solid fa-link text-success me-2"></i> Insert Link
              </h4>
              <button onClick={() => setLinkModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6c757d', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleInsertLink}>
              <div style={{ padding: '20px 24px' }}>
                {linkError && <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>{linkError}</div>}

                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '13px' }}>Link Text</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Download Prospectus"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                  <div className="form-text" style={{ fontSize: '12px' }}>
                    {savedRangeRef.current && !savedRangeRef.current.collapsed
                      ? 'Your text selection will be replaced by this link.'
                      : 'This text will be inserted as a link at your cursor position.'}
                  </div>
                </div>

                <div className="mb-3" style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="linkModeUpload"
                      checked={linkMode === 'upload'}
                      onChange={() => setLinkMode('upload')}
                    />
                    <label className="form-check-label" htmlFor="linkModeUpload" style={{ fontSize: '13px' }}>
                      Upload a file
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="linkModeUrl"
                      checked={linkMode === 'url'}
                      onChange={() => setLinkMode('url')}
                    />
                    <label className="form-check-label" htmlFor="linkModeUrl" style={{ fontSize: '13px' }}>
                      Paste a URL
                    </label>
                  </div>
                </div>

                {linkMode === 'upload' ? (
                  <div className="mb-1">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={linkUploading}
                      onClick={() => linkFileInputRef.current?.click()}
                    >
                      <i className="fa-solid fa-upload me-1"></i>
                      {linkFile ? linkFile.name : 'Choose PDF, Word or Image file'}
                    </button>
                    <input
                      ref={linkFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setLinkFile(file);
                        if (file && !linkText.trim()) setLinkText(file.name.replace(/\.[^.]+$/, ''));
                        e.target.value = '';
                      }}
                    />
                    <div className="form-text" style={{ fontSize: '12px' }}>PDF or Word up to 15MB, images up to 4MB.</div>
                  </div>
                ) : (
                  <div className="mb-1">
                    <input
                      className="form-control"
                      placeholder="https://example.com or /some-page"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-light border btn-sm" onClick={() => setLinkModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={linkUploading} className="btn btn-success btn-sm px-4" style={{ backgroundColor: '#006633' }}>
                  {linkUploading ? 'Uploading...' : 'Insert Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
